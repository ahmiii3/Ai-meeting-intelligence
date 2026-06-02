# 🎯 AI Meeting Intelligence - Project Documentation

## 📋 Project Overview

**AI Meeting Intelligence** is a comprehensive meeting management platform that captures, transcribes, and analyzes meetings in real-time using AI. The system provides automated summaries, action items, decisions tracking, and intelligent chat capabilities.

---

## 🏗️ System Architecture

### **Tech Stack**
- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL (Supabase) + MongoDB
- **Real-time**: Socket.IO
- **AI Services**: 
  - Whisper AI (Transcription)
  - GPT-4o (Summarization & Analysis)
- **Message Queue**: Redis + BullMQ
- **Authentication**: JWT (Access + Refresh Tokens)

### **Architecture Flow**
```
Browser Extension/Panel → Backend API → Real-time Processing → AI Analysis → Database Storage → UI Display
```

---

## ✅ Development Progress Tracker

### **Phase 1: Authentication & User Management**
- [x] User Model (UUID-based with workspace support)
- [x] JWT Access Token (15m expiry)
- [x] JWT Refresh Token (7d expiry)
- [x] Signup API (`POST /auth/signup`)
- [x] Login API (`POST /auth/login`)
- [x] Token Refresh API (`POST /auth/refresh-token`)
- [x] Logout API (`POST /auth/logout`)
- [x] Auth Middleware (JWT verification)
- [x] Input Validation Middleware
- [x] Database Connection (Supabase PostgreSQL)
- [x] Environment Configuration (.env setup)
- [x] Git Repository Setup
- [x] Password Hashing (bcrypt)
- [x] Error Handling

**Status**: ✅ **COMPLETED & TESTED**

---

### **Phase 2: Workspace Management** 
- [x] Workspace Model (PostgreSQL)
- [x] Create Workspace API
- [x] Update Workspace API
- [x] Delete Workspace API
- [x] Get User Workspaces API
- [x] Get Workspace by ID API
- [x] Workspace Selection Flow
- [ ] Workspace Member Invitations (Future)
- [ ] Role-based Access Control - Members (Future)

**Status**: ✅ **COMPLETED & TESTED**

---

### **Phase 3: Meeting Management**
- [ ] Meeting Model (MongoDB)
- [ ] Start Meeting API
- [ ] Stop Meeting API
- [ ] Get Meeting Details API
- [ ] List All Meetings API
- [ ] Meeting Status Tracking (active/completed)
- [ ] Meeting Platform Integration (Zoom/Meet/Teams)
- [ ] Browser Extension Communication Setup

**Status**: ⏳ **PENDING**

---

### **Phase 4: Real-time Audio Capture & Transcription**
- [ ] Socket.IO Server Setup
- [ ] Audio Stream Handler
- [ ] Browser MediaStream API Integration
- [ ] Whisper AI Integration
- [ ] Real-time Transcription Chunks
- [ ] Transcript Storage (MongoDB - appending chunks)
- [ ] WebSocket Event Handlers:
  - [ ] `connection` - Client connects
  - [ ] `start-capture` - Begin audio capture
  - [ ] `audio-chunk` - Receive audio data
  - [ ] `stop-capture` - End capture
  - [ ] `transcript-chunk` - Send transcript to UI
- [ ] Error Handling & Reconnection Logic

**Status**: ⏳ **PENDING**

---

### **Phase 5: AI Processing Pipeline**
- [ ] Redis Setup (Message Queue)
- [ ] BullMQ Job Queue Configuration
- [ ] Job: Generate Summary (GPT-4o)
  - [ ] Executive Summary
  - [ ] Detailed Summary
  - [ ] Bullet Points
- [ ] Job: Extract Action Items (GPT-4o)
  - [ ] Assignee Detection
  - [ ] Task Description
  - [ ] Deadline Extraction
- [ ] Job: Extract Decisions (GPT-4o)
  - [ ] Decision Status (Approved/Rejected/Pending)
  - [ ] Decision Context
- [ ] Job: Generate Emails (GPT-4o)
  - [ ] Client Emails
  - [ ] Internal Team Emails
  - [ ] Executive Summaries
- [ ] Job Status Tracking
- [ ] Socket.IO Progress Updates (e.g., "Summarizing...")
- [ ] GPT-4o API Integration
- [ ] Prompt Engineering for Each Step

**Status**: ⏳ **PENDING**

---

### **Phase 6: Data Storage & Retrieval**
- [ ] MongoDB Schema Design:
  - [ ] Meetings Collection
  - [ ] Transcripts Collection (chunks)
  - [ ] Summaries Collection
  - [ ] Action Items Collection
  - [ ] Decisions Collection
  - [ ] Emails Collection
- [ ] Save Transcript API
- [ ] Save Summary API
- [ ] Save Action Items API
- [ ] Save Decisions API
- [ ] Save Emails API
- [ ] Get Meeting Complete Data API
- [ ] Search & Filter APIs
- [ ] Pagination Support

**Status**: ⏳ **PENDING**

---

### **Phase 7: Meeting Detail UI & Tabs**
- [ ] Meeting Detail Page Layout
- [ ] **Transcript Tab**:
  - [ ] Full transcript display
  - [ ] Timestamps
  - [ ] Speaker identification (if possible)
- [ ] **Summary Tab**:
  - [ ] Executive Summary
  - [ ] Detailed Summary
  - [ ] Bullet Points View
- [ ] **Tasks Tab**:
  - [ ] Action Items List
  - [ ] Assignee + Task + Deadline
  - [ ] Edit/Update Tasks
- [ ] **Decisions Tab**:
  - [ ] Approved Decisions
  - [ ] Rejected Decisions
  - [ ] Pending Decisions
- [ ] **Email Tab**:
  - [ ] Client Email Preview
  - [ ] Internal Email Preview
  - [ ] Executive Email Preview
  - [ ] Copy to Clipboard
  - [ ] Send Email Integration (optional)
- [ ] Real-time UI Updates (Socket.IO)
- [ ] Loading States & Spinners

**Status**: ⏳ **PENDING**

---

### **Phase 8: AI Chat with Meeting Context**
- [ ] Chat Interface (Query Box)
- [ ] Chat API Endpoint
- [ ] GPT-4o Context-Aware Responses
- [ ] Use Transcript as Context
- [ ] Chat History Storage
- [ ] Display AI Responses in UI
- [ ] Chat Message Styling

**Status**: ⏳ **PENDING**

---

### **Phase 9: Dashboard & Meeting List**
- [ ] Dashboard Layout
- [ ] Meeting List View
- [ ] Meeting Cards:
  - [ ] Meeting Title
  - [ ] Date & Duration
  - [ ] Status (Active/Completed)
  - [ ] Quick Summary
- [ ] Search Meetings
- [ ] Filter by Date/Status
- [ ] Sort by Recent/Oldest
- [ ] Navigate to Meeting Detail

**Status**: ⏳ **PENDING**

---

### **Phase 10: Browser Extension Development**
- [ ] Chrome Extension Manifest Setup
- [ ] AI Sidebar Panel (Browser Extension)
- [ ] Start Meeting Button
- [ ] Audio Capture via MediaStream API
- [ ] Socket.IO Client Connection
- [ ] Send Audio Chunks to Backend
- [ ] Display Live Transcript in Sidebar
- [ ] Stop Meeting Button
- [ ] Platform Detection (Zoom/Meet/Teams)
- [ ] Extension Icon & UI Polish

**Status**: ⏳ **PENDING**

---

### **Phase 11: Testing & Quality Assurance**
- [ ] Unit Tests (Auth APIs)
- [ ] Integration Tests (Full Flow)
- [ ] Socket.IO Connection Tests
- [ ] AI Processing Tests (Mock GPT responses)
- [ ] Database Query Tests
- [ ] Error Handling Tests
- [ ] Load Testing (Multiple concurrent meetings)
- [ ] Browser Extension Testing
- [ ] Cross-browser Compatibility

**Status**: ⏳ **PENDING**

---

### **Phase 12: Deployment & Production**
- [ ] Environment Configuration (Production)
- [ ] Backend Deployment (Heroku/AWS/Railway)
- [ ] MongoDB Atlas Setup
- [ ] Redis Cloud Setup
- [ ] PostgreSQL Production Setup
- [ ] Domain & SSL Configuration
- [ ] Browser Extension Submission (Chrome Web Store)
- [ ] API Rate Limiting
- [ ] Monitoring & Logging (Winston/Sentry)
- [ ] Backup Strategy

**Status**: ⏳ **PENDING**

---

## 🗂️ Database Schema

### **PostgreSQL (Supabase) - User & Workspace Management**

#### **Users Table**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id),
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  refresh_token TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### **Workspaces Table** (To be created)
```sql
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  owner_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

### **MongoDB - Meeting Data**

#### **Meetings Collection**
```javascript
{
  _id: ObjectId,
  userId: UUID (from PostgreSQL),
  workspaceId: UUID,
  title: String,
  platform: String, // "Zoom", "Meet", "Teams", "Custom"
  status: String, // "active", "completed"
  startTime: Date,
  endTime: Date,
  duration: Number, // in seconds
  createdAt: Date,
  updatedAt: Date
}
```

#### **Transcripts Collection**
```javascript
{
  _id: ObjectId,
  meetingId: ObjectId,
  chunks: [
    {
      text: String,
      timestamp: Date,
      speaker: String (optional)
    }
  ],
  fullTranscript: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### **Summaries Collection**
```javascript
{
  _id: ObjectId,
  meetingId: ObjectId,
  executiveSummary: String,
  detailedSummary: String,
  bulletPoints: [String],
  createdAt: Date
}
```

#### **ActionItems Collection**
```javascript
{
  _id: ObjectId,
  meetingId: ObjectId,
  items: [
    {
      assignee: String,
      task: String,
      deadline: Date,
      status: String // "pending", "completed"
    }
  ],
  createdAt: Date
}
```

#### **Decisions Collection**
```javascript
{
  _id: ObjectId,
  meetingId: ObjectId,
  decisions: [
    {
      description: String,
      status: String, // "approved", "rejected", "pending"
      context: String
    }
  ],
  createdAt: Date
}
```

#### **Emails Collection**
```javascript
{
  _id: ObjectId,
  meetingId: ObjectId,
  clientEmail: String,
  internalEmail: String,
  executiveEmail: String,
  createdAt: Date
}
```

---

## 🔌 API Endpoints

### **Authentication APIs** ✅
| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| POST | `/api/auth/signup` | Register new user | ✅ Done |
| POST | `/api/auth/login` | User login | ✅ Done |
| POST | `/api/auth/refresh-token` | Refresh access token | ✅ Done |
| POST | `/api/auth/logout` | Logout user | ✅ Done |
| GET | `/api/auth/profile` | Get user profile | ✅ Done |

### **Workspace APIs** ✅
| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| POST | `/api/workspaces` | Create workspace | ✅ Done |
| GET | `/api/workspaces` | Get user workspaces | ✅ Done |
| GET | `/api/workspaces/:id` | Get workspace by ID | ✅ Done |
| PUT | `/api/workspaces/:id` | Update workspace | ✅ Done |
| DELETE | `/api/workspaces/:id` | Delete workspace | ✅ Done |
| POST | `/api/workspaces/:id/select` | Select workspace | ✅ Done |

### **Meeting APIs** ⏳
| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| POST | `/api/meetings/start` | Start new meeting | ⏳ Pending |
| POST | `/api/meetings/:id/stop` | Stop meeting | ⏳ Pending |
| GET | `/api/meetings` | List all meetings | ⏳ Pending |
| GET | `/api/meetings/:id` | Get meeting details | ⏳ Pending |
| GET | `/api/meetings/:id/transcript` | Get transcript | ⏳ Pending |
| GET | `/api/meetings/:id/summary` | Get summary | ⏳ Pending |
| GET | `/api/meetings/:id/tasks` | Get action items | ⏳ Pending |
| GET | `/api/meetings/:id/decisions` | Get decisions | ⏳ Pending |
| GET | `/api/meetings/:id/emails` | Get emails | ⏳ Pending |

### **Chat APIs** ⏳
| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| POST | `/api/chat/:meetingId` | Chat with meeting AI | ⏳ Pending |
| GET | `/api/chat/:meetingId/history` | Get chat history | ⏳ Pending |

---

## 🔄 Socket.IO Events

### **Client → Server Events**
| Event | Payload | Description |
|-------|---------|-------------|
| `start-capture` | `{ meetingId, userId }` | Start audio capture |
| `audio-chunk` | `{ meetingId, audioData }` | Send audio chunk |
| `stop-capture` | `{ meetingId }` | Stop audio capture |

### **Server → Client Events**
| Event | Payload | Description |
|-------|---------|-------------|
| `transcript-chunk` | `{ text, timestamp }` | Real-time transcript |
| `processing-status` | `{ status, message }` | AI processing updates |
| `summary-ready` | `{ summary }` | Summary generated |
| `tasks-ready` | `{ tasks }` | Action items ready |
| `decisions-ready` | `{ decisions }` | Decisions ready |
| `emails-ready` | `{ emails }` | Emails generated |
| `error` | `{ message }` | Error occurred |

---

## 📂 Project File Structure

```
workflow 1/
├── backend/
│   ├── config/
│   │   ├── db.js              ✅ PostgreSQL connection
│   │   ├── mongodb.js         ⏳ MongoDB connection
│   │   ├── redis.js           ⏳ Redis connection
│   │   └── socket.js          ⏳ Socket.IO setup
│   ├── controllers/
│   │   ├── authController.js  ✅ Auth logic
│   │   ├── workspaceController.js  ⏳
│   │   ├── meetingController.js    ⏳
│   │   └── chatController.js       ⏳
│   ├── middlewares/
│   │   ├── authMiddleware.js       ✅ JWT verification
│   │   └── validationMiddleware.js ✅ Input validation
│   ├── models/
│   │   ├── User.js            ✅ User model (PostgreSQL)
│   │   ├── Workspace.js       ⏳ Workspace model
│   │   ├── Meeting.js         ⏳ Meeting model (MongoDB)
│   │   ├── Transcript.js      ⏳ Transcript model
│   │   └── Summary.js         ⏳ Summary model
│   ├── routes/
│   │   ├── authRoutes.js      ✅ Auth routes
│   │   ├── workspaceRoutes.js ⏳
│   │   ├── meetingRoutes.js   ⏳
│   │   └── chatRoutes.js      ⏳
│   ├── services/
│   │   ├── whisperService.js  ⏳ Whisper AI integration
│   │   ├── gptService.js      ⏳ GPT-4o integration
│   │   └── queueService.js    ⏳ BullMQ jobs
│   ├── jobs/
│   │   ├── summaryJob.js      ⏳ Summary generation
│   │   ├── actionItemsJob.js  ⏳ Extract tasks
│   │   ├── decisionsJob.js    ⏳ Extract decisions
│   │   └── emailsJob.js       ⏳ Generate emails
│   ├── utils/
│   │   ├── logger.js          ⏳ Winston logger
│   │   └── errorHandler.js    ⏳ Global error handler
│   ├── .env                   ✅ Environment variables
│   ├── .gitignore             ✅ Git ignore
│   ├── index.js               ✅ Main server file
│   └── package.json           ✅ Dependencies
├── extension/                 ⏳ Browser extension code
│   ├── manifest.json          ⏳
│   ├── popup.html             ⏳
│   ├── sidebar.html           ⏳
│   └── scripts/
│       ├── background.js      ⏳
│       ├── content.js          ⏳
│       └── sidebar.js          ⏳
├── pull-and-clean.ps1         ✅ Git pull script
└── PROJECT_DOCUMENTATION.md   ✅ This file
```

---

## 🚀 Next Steps

### **Current Status**: Phase 2 Complete ✅

### **Next Phase**: Phase 3 - Meeting Management

**Tasks for Next Session:**
1. Setup MongoDB connection
2. Create Meeting Model (MongoDB)
3. Create Meeting APIs:
   - Start Meeting
   - Stop Meeting
   - Get All Meetings
   - Get Meeting by ID
4. Add meeting platform detection (Zoom/Meet/Teams/Custom)
5. Test meeting APIs

---

## 🔧 Environment Variables

```env
# Database
DIRECT_URL=postgresql://postgres.xxx:xxx@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres

# JWT Configuration
JWT_ACCESS_SECRET=your_access_secret_key_change_in_production_12345
JWT_REFRESH_SECRET=your_refresh_secret_key_change_in_production_67890
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# Server
PORT=5000

# MongoDB (to be added)
MONGODB_URI=

# Redis (to be added)
REDIS_URL=

# AI Services (to be added)
OPENAI_API_KEY=
WHISPER_API_KEY=
```

---

## 📝 Development Guidelines

### **Git Workflow**
1. Pull latest code: `.\pull-and-clean.ps1`
2. Create feature branch: `git checkout -b feature/workspace-management`
3. Make changes and test
4. Commit: `git add . && git commit -m "message"`
5. Push: `git push origin feature/workspace-management`
6. Merge to main after approval

### **Testing Before Approval**
- Test all APIs with Postman/Thunder Client
- Check database entries
- Verify error handling
- Test edge cases
- Confirm real-time updates (if applicable)

### **Code Standards**
- Use meaningful variable names
- Add comments for complex logic
- Follow existing code structure
- Handle errors properly
- Use async/await for promises
- Validate inputs

---

## 📞 Support & Contact

**Developer**: AI Assistant  
**Project**: AI Meeting Intelligence  
**Start Date**: 2025  
**Last Updated**: Current Session

---

**Version**: 1.0.0  
**Status**: Phase 1 Complete | Phase 2 Ready to Start

---

## 🎯 Quick Reference Commands

```bash
# Start development server
cd backend
npm run dev

# Pull latest code (with cleanup)
cd "d:\Testing Projects\workflow 1"
.\pull-and-clean.ps1

# Push changes
git add .
git commit -m "your message"
git push origin main

# Check git status
git status

# View recent commits
git log --oneline -5
```

---

**Ready for Phase 2! 🚀**
