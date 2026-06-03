const { Server } = require('socket.io');
const Transcript = require('../models/Transcript');

// ============================================================================
// OLD WHISPER SERVICE (COMMENTED OUT - WebM format compatibility issues)
// ============================================================================
// const { transcribeChunk } = require('../services/whisperService');

// ============================================================================
// NEW: DEEPGRAM + GEMINI SERVICE
// ============================================================================
const { transcribeAndTranslate } = require('../services/deepgramGeminiService');

// ============================================================================
// MEETING ANALYSIS SERVICE (Real-time meeting insights)
// ============================================================================
const { analyzeTranscript } = require('../services/meetingAnalysisService');

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // Update with your frontend URL in production
      methods: ['GET', 'POST']
    },
    maxHttpBufferSize: 1e8 // 100MB for audio chunks
  });

  io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);

    // Join meeting room
    socket.on('join-meeting', (meetingId) => {
      socket.join(meetingId);
      console.log(`📍 Socket ${socket.id} joined meeting: ${meetingId}`);
      socket.emit('joined-meeting', { meetingId });
    });

    // Leave meeting room
    socket.on('leave-meeting', (meetingId) => {
      socket.leave(meetingId);
      console.log(`📍 Socket ${socket.id} left meeting: ${meetingId}`);
    });

    // Start audio capture
    socket.on('start-capture', async (data) => {
      const { meetingId } = data;
      console.log(`🎤 Audio capture started for meeting: ${meetingId}`);
      
      // Notify all clients in the room
      io.to(meetingId).emit('capture-started', { meetingId });
    });

    // ========================================================================
    // NEW: RECEIVE AUDIO CHUNK → DEEPGRAM TRANSCRIBE → GEMINI TRANSLATE
    // ========================================================================
    socket.on('audio-chunk', async (data) => {
      try {
        const { meetingId, audioData, chunkIndex, format = 'webm', mimeType, targetLanguage = 'Urdu' } = data;
        
        console.log(`🎵 Received audio chunk ${chunkIndex} for meeting: ${meetingId} (format: ${format}, mimeType: ${mimeType})`);

        // Emit processing status
        io.to(meetingId).emit('processing-audio', { 
          chunkIndex,
          status: 'transcribing'
        });

        // Convert base64 string to buffer
        let audioBuffer;
        if (typeof audioData === 'string') {
          // Remove any data URL prefix if present (e.g., "data:audio/webm;base64,")
          const base64String = audioData.includes(',') ? audioData.split(',')[1] : audioData;
          audioBuffer = Buffer.from(base64String, 'base64');
          console.log(`📦 Decoded base64 audio: ${audioBuffer.length} bytes`);
        } else if (Buffer.isBuffer(audioData)) {
          audioBuffer = audioData;
        } else {
          audioBuffer = Buffer.from(audioData);
        }

        console.log(`🔍 Audio buffer details: ${audioBuffer.length} bytes, Format: ${format}, MimeType: ${mimeType}`);

        // Validate minimum chunk size (8KB for better quality - reduced from 10KB)
        if (audioBuffer.length < 8192) {
          console.log(`⚠️ Skipping small audio chunk ${chunkIndex} (${audioBuffer.length} bytes - too small for processing)`);
          
          io.to(meetingId).emit('transcription-error', {
            chunkIndex,
            error: 'Audio chunk too small - please speak longer (minimum 4 seconds)',
            step: 'validation'
          });
          return;
        }

        // ====================================================================
        // DEEPGRAM + GEMINI WORKFLOW
        // ====================================================================
        // Create a wrapper function that includes format information
        const deepgramResult = await require('../services/deepgramGeminiService').transcribeWithDeepgram(
          audioBuffer,
          format,
          mimeType
        );

        // If transcription failed, emit error and return
        if (!deepgramResult.success || !deepgramResult.text) {
          io.to(meetingId).emit('transcription-error', {
            chunkIndex,
            error: deepgramResult.error || 'Transcription failed',
            step: 'deepgram'
          });
          
          console.error(`❌ Chunk ${chunkIndex} transcription failed:`, deepgramResult.error);
          return;
        }

        // Now translate the transcribed text
        const translationResult = await require('../services/deepgramGeminiService').translateWithGemini(
          deepgramResult.text,
          targetLanguage
        );

        console.log(`📊 Translation result for "${targetLanguage}": Success=${translationResult.success}, Text="${translationResult.translatedText}"`);

        // Build complete result
        const result = {
          success: true,
          transcription: deepgramResult.text,
          translation: translationResult.success ? translationResult.translatedText : null, // Optional
          confidence: deepgramResult.confidence,
          targetLanguage: targetLanguage
        };

        if (result.success && result.transcription) {
          // Save transcript to database
          const transcript = await Transcript.create({
            meeting_id: meetingId,
            chunk_index: chunkIndex,
            text: result.transcription, // Original English text
            timestamp: new Date(),
            confidence: result.confidence || null,
            metadata: {
              translation: result.translation || null,
              targetLanguage: result.targetLanguage || targetLanguage,
              format: format,
              mimeType: mimeType,
              service: 'deepgram+gemini'
            }
          });

          // ====================================================================
          // REAL-TIME MEETING ANALYSIS - Analyze transcript chunk
          // ====================================================================
          try {
            console.log(`🔍 Analyzing transcript chunk for insights...`);
            const analysis = await analyzeTranscript(result.transcription);

            if (analysis.success) {
              // Emit analysis results to all clients in the meeting
              io.to(meetingId).emit('transcript-analysis', {
                chunkIndex,
                mainPoints: analysis.mainPoints,
                tasks: analysis.tasks,
                decisions: analysis.decisions,
                keyTakeaways: analysis.keyTakeaways,
                nextSteps: analysis.nextSteps,
                analyzedAt: analysis.timestamp
              });

              console.log(`✅ Analysis emitted to meeting room`);
            } else if (!analysis.rateLimited) {
              console.log(`⚠️  Analysis partial: ${analysis.error}`);
            }
          } catch (analysisError) {
            console.error(`❌ Analysis failed (non-fatal): ${analysisError.message}`);
            // Continue even if analysis fails - don't block transcription
          }

          // Emit transcript chunk with optional translation to all clients
          io.to(meetingId).emit('transcript-chunk', {
            chunkIndex,
            text: result.transcription,          // English
            translation: result.translation,      // Optional Urdu/other language
            targetLanguage: result.targetLanguage,
            timestamp: transcript.timestamp,
            transcriptId: transcript.id,
            confidence: result.confidence
          });

          console.log(`✅ Chunk ${chunkIndex} processed:`);
          console.log(`   📝 English: "${result.transcription}"`);
          if (result.translation) {
            console.log(`   🌐 ${targetLanguage}: "${result.translation}"`);
          }
        } else {
          // Emit error
          io.to(meetingId).emit('transcription-error', {
            chunkIndex,
            error: result.error || 'Transcription/translation failed',
            step: result.step || 'unknown'
          });
          
          console.error(`❌ Chunk ${chunkIndex} failed:`, result.error);
        }

        // ====================================================================
        // OLD WHISPER CODE (COMMENTED OUT)
        // ====================================================================
        /*
        const transcription = await transcribeChunk(audioBuffer, format);

        if (transcription.success && transcription.text) {
          const transcript = await Transcript.create({
            meeting_id: meetingId,
            chunk_index: chunkIndex,
            text: transcription.text,
            timestamp: new Date(),
            confidence: transcription.segments?.[0]?.confidence || null,
            metadata: {
              duration: transcription.duration,
              language: transcription.language,
              format: format,
              mimeType: mimeType
            }
          });

          io.to(meetingId).emit('transcript-chunk', {
            chunkIndex,
            text: transcription.text,
            timestamp: transcript.timestamp,
            transcriptId: transcript.id
          });

          console.log(`✅ Transcribed chunk ${chunkIndex}: "${transcription.text}"`);
        } else {
          io.to(meetingId).emit('transcription-error', {
            chunkIndex,
            error: transcription.error || 'Transcription failed'
          });
          
          console.error(`❌ Transcription failed for chunk ${chunkIndex}:`, transcription.error);
        }
        */
      } catch (error) {
        console.error('Audio chunk processing error:', error);
        socket.emit('error', { message: 'Failed to process audio chunk' });
      }
    });

    // Stop audio capture
    socket.on('stop-capture', async (data) => {
      const { meetingId } = data;
      console.log(`🛑 Audio capture stopped for meeting: ${meetingId}`);
      
      // Notify all clients
      io.to(meetingId).emit('capture-stopped', { meetingId });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('🔌 Client disconnected:', socket.id);
    });
  });

  console.log('✅ Socket.IO initialized with Deepgram+Gemini audio handlers (REAL AUDIO MODE)');
  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized! Call initializeSocket first.');
  }
  return io;
};

module.exports = { initializeSocket, getIO };
