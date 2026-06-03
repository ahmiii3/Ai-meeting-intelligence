const { Server } = require('socket.io');
const Transcript = require('../models/Transcript');
const { transcribeAndTranslate } = require('../services/deepgramGeminiService');
const { analyzeTranscript } = require('../services/meetingAnalysisService');

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    },
    maxHttpBufferSize: 1e8
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
      io.to(meetingId).emit('capture-started', { meetingId });
    });

    // Receive audio chunk
    socket.on('audio-chunk', async (data) => {
      try {
        const { meetingId, audioData, chunkIndex, format = 'webm', mimeType, targetLanguage = 'Urdu' } = data;
        
        console.log(`🎵 Received audio chunk ${chunkIndex} for meeting: ${meetingId} (format: ${format}, mimeType: ${mimeType})`);

        io.to(meetingId).emit('processing-audio', { 
          chunkIndex,
          status: 'transcribing'
        });

        // Convert base64 string to buffer
        let audioBuffer;
        if (typeof audioData === 'string') {
          const base64String = audioData.includes(',') ? audioData.split(',')[1] : audioData;
          audioBuffer = Buffer.from(base64String, 'base64');
          console.log(`📦 Decoded base64 audio: ${audioBuffer.length} bytes`);
        } else if (Buffer.isBuffer(audioData)) {
          audioBuffer = audioData;
        } else {
          audioBuffer = Buffer.from(audioData);
        }

        console.log(`🔍 Audio buffer details: ${audioBuffer.length} bytes, Format: ${format}, MimeType: ${mimeType}`);

        // Validate minimum chunk size
        if (audioBuffer.length < 8192) {
          console.log(`⚠️ Skipping small audio chunk ${chunkIndex} (${audioBuffer.length} bytes - too small for processing)`);
          
          io.to(meetingId).emit('transcription-error', {
            chunkIndex,
            error: 'Audio chunk too small - please speak longer (minimum 4 seconds)',
            step: 'validation'
          });
          return;
        }

        // Transcribe with Deepgram
        const deepgramResult = await require('../services/deepgramGeminiService').transcribeWithDeepgram(
          audioBuffer,
          format,
          mimeType
        );

        if (!deepgramResult.success || !deepgramResult.text) {
          io.to(meetingId).emit('transcription-error', {
            chunkIndex,
            error: deepgramResult.error || 'Transcription failed',
            step: 'deepgram'
          });
          
          console.error(`❌ Chunk ${chunkIndex} transcription failed:`, deepgramResult.error);
          return;
        }

        // Translate the transcribed text
        const translationResult = await require('../services/deepgramGeminiService').translateWithGemini(
          deepgramResult.text,
          targetLanguage
        );

        console.log(`📊 Translation result for "${targetLanguage}": Success=${translationResult.success}, Text="${translationResult.translatedText}"`);

        // Build complete result
        const result = {
          success: true,
          transcription: deepgramResult.text,
          translation: translationResult.success ? translationResult.translatedText : null,
          confidence: deepgramResult.confidence,
          targetLanguage: targetLanguage
        };

        if (result.success && result.transcription) {
          // Save transcript to database
          const transcript = await Transcript.create({
            meeting_id: meetingId,
            chunk_index: chunkIndex,
            text: result.transcription,
            timestamp: new Date(),
            confidence: result.confidence || null,
            metadata: {
              translation: result.translation || null,
              targetLanguage: result.targetLanguage || targetLanguage,
              format: format,
              mimeType: mimeType,
              service: 'deepgram+openai'
            }
          });

          // Real-time meeting analysis
          try {
            console.log(`🔍 Analyzing transcript chunk for insights...`);
            const analysis = await analyzeTranscript(result.transcription);

            if (analysis.success) {
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
          }

          // Emit transcript chunk to clients
          io.to(meetingId).emit('transcript-chunk', {
            chunkIndex,
            text: result.transcription,
            translation: result.translation,
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
          io.to(meetingId).emit('transcription-error', {
            chunkIndex,
            error: result.error || 'Transcription/translation failed',
            step: result.step || 'unknown'
          });
          
          console.error(`❌ Chunk ${chunkIndex} failed:`, result.error);
        }
      } catch (error) {
        console.error('Audio chunk processing error:', error);
        socket.emit('error', { message: 'Failed to process audio chunk' });
      }
    });

    // Stop audio capture
    socket.on('stop-capture', async (data) => {
      const { meetingId } = data;
      console.log(`\n${'='.repeat(80)}`);
      console.log(`🛑 [STOP-CAPTURE] Audio capture stopped for meeting: ${meetingId}`);
      console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
      console.log(`${'='.repeat(80)}\n`);
      
      io.to(meetingId).emit('capture-stopped', { meetingId });
      
      // Final analysis with 500ms delay to keep socket alive
      setTimeout(async () => {
        try {
          console.log(`📊 [${new Date().toISOString()}] Meeting ended - starting comprehensive analysis...`);
          
          const Transcript = require('../models/Transcript');
          const allTranscripts = await Transcript.findAll({
            where: { meeting_id: meetingId },
            order: [['chunk_index', 'ASC']]
          });

          console.log(`\n📝 [TRANSCRIPT QUERY] Found ${allTranscripts.length} transcript chunks`);
          
          if (allTranscripts.length === 0) {
            console.log(`⚠️ [NO TRANSCRIPTS] No transcripts found - skipping analysis`);
            return;
          }

          const fullTranscript = allTranscripts.map(t => t.text).join(' ');

          console.log(`📄 [FULL TRANSCRIPT] Length: ${fullTranscript.length} characters`);
          console.log(`📄 [PREVIEW] ${fullTranscript.substring(0, 100)}...`);

          console.log(`\n🤖 [ANALYSIS START] Calling analyzeTranscript()...`);
          const finalAnalysis = await analyzeTranscript(fullTranscript);

          if (finalAnalysis.success) {
            console.log(`\n✅ [ANALYSIS SUCCESS] Analysis complete:`);
            console.log(`   📌 Main Points: ${finalAnalysis.mainPoints.length}`);
            console.log(`   ✅ Action Items (Tasks): ${finalAnalysis.tasks.length}`);
            console.log(`   🎯 Decisions: ${finalAnalysis.decisions.length}`);
              
            // SAVE ANALYSIS TO DATABASE
            try {
              const MeetingSummary = require('../models/MeetingSummary');
              const Task = require('../models/Task');

              console.log(`\n💾 [SAVE START] Saving summary to database...`);
              console.log(`📊 Data to save: ${finalAnalysis.tasks.length} tasks, ${finalAnalysis.mainPoints.length} main points`);

              // Save main summary
              let summary;
              try {
                summary = await MeetingSummary.create({
                  meeting_id: meetingId,
                  executive_summary: finalAnalysis.keyTakeaways || 'Meeting analysis complete',
                  detailed_summary: finalAnalysis.mainPoints.join('\n'),
                  key_decisions: JSON.stringify(finalAnalysis.decisions),
                  summary_type: 'comprehensive',
                  generated_by: 'openai-gpt3.5'
                });

                console.log(`✅ [SUMMARY SAVED] ID: ${summary.id}`);
                console.log(`   Executive: ${summary.executive_summary}`);
              } catch (summaryError) {
                console.error(`❌ [SUMMARY ERROR] Failed to save summary: ${summaryError.message}`);
                console.error(summaryError);
                throw summaryError;
              }

              // Save each task
              let taskCount = 0;
              console.log(`📋 [TASK SAVE START] Saving ${finalAnalysis.tasks.length} tasks...`);

              for (let i = 0; i < finalAnalysis.tasks.length; i++) {
                const task = finalAnalysis.tasks[i];
                try {
                  console.log(`   Task ${i + 1}: "${task.description}" → ${task.assignee} (${task.priority})`);
                  
                  const savedTask = await Task.create({
                    meeting_id: meetingId,
                    description: task.description,
                    assignee: task.assignee || 'Unassigned',
                    priority: task.priority || 'medium',
                    status: 'pending',
                    detected_by_ai: true,
                    confidence_score: 0.85
                  });
                  
                  console.log(`   ✅ Task ${i + 1} saved: ID=${savedTask.id}`);
                  taskCount++;
                } catch (taskError) {
                  console.error(`   ❌ Task ${i + 1} failed: ${taskError.message}`);
                }
              }

              console.log(`✅ [TASK SAVE COMPLETE] ${taskCount}/${finalAnalysis.tasks.length} tasks saved`);

              // Emit final analysis
              console.log(`\n📤 [EMIT] Sending meeting-analysis-complete event...`);
              io.to(meetingId).emit('meeting-analysis-complete', {
                meetingId,
                mainPoints: finalAnalysis.mainPoints,
                tasks: finalAnalysis.tasks,
                decisions: finalAnalysis.decisions,
                keyTakeaways: finalAnalysis.keyTakeaways,
                nextSteps: finalAnalysis.nextSteps,
                totalTranscripts: allTranscripts.length,
                summaryId: summary.id,
                tasksSaved: taskCount,
                savedToDatabase: true,
                completedAt: new Date()
              });

              console.log(`✅ [EMIT COMPLETE] Final analysis emitted to all clients`);
              console.log(`\n🎉 [SUCCESS] Summary & ${taskCount} tasks saved to database successfully!\n`);
            } catch (dbError) {
              console.error(`⚠️ [DATABASE ERROR] ${dbError.message}`);
              console.error(dbError);
              
              io.to(meetingId).emit('meeting-analysis-complete', {
                meetingId,
                mainPoints: finalAnalysis.mainPoints,
                tasks: finalAnalysis.tasks,
                decisions: finalAnalysis.decisions,
                keyTakeaways: finalAnalysis.keyTakeaways,
                nextSteps: finalAnalysis.nextSteps,
                totalTranscripts: allTranscripts.length,
                savedToDatabase: false,
                error: `Database save failed: ${dbError.message}`,
                completedAt: new Date()
              });
            }
          } else {
            console.log(`\n⚠️ [ANALYSIS FAILED] Analysis error: ${finalAnalysis.error}`);
            
            io.to(meetingId).emit('meeting-analysis-complete', {
              meetingId,
              mainPoints: [],
              tasks: [],
              decisions: [],
              keyTakeaways: `Meeting ended with ${allTranscripts.length} transcript chunks`,
              nextSteps: [],
              totalTranscripts: allTranscripts.length,
              error: finalAnalysis.error,
              completedAt: new Date()
            });
          }
        } catch (analysisError) {
          console.error(`\n❌ [FATAL ERROR] Final analysis error: ${analysisError.message}`);
          console.error(analysisError.stack);
        }
      }, 500);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('🔌 Client disconnected:', socket.id);
    });
  });

  console.log('✅ Socket.IO initialized with Deepgram+OpenAI audio handlers (REAL AUDIO MODE)');
  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized! Call initializeSocket first.');
  }
  return io;
};

module.exports = { initializeSocket, getIO };
