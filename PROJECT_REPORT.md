# Project Report: IntelliMeet — AI-Powered Enterprise Meeting & Collaboration Platform

---

**Student Name:** Anumol Vijayan  
**Project Domain:** Web Development (MERN Stack)  
**Mentor:** Shaurya Pandey  
**Submission Date:** October 2026  
**Live Application URL:** [https://intelli-meet-amber.vercel.app](https://intelli-meet-amber.vercel.app)  
**Source Code Repository:** [https://github.com/anumolvijayan987-netizen/intelli-meet](https://github.com/anumolvijayan987-netizen/intelli-meet)  

---

## 1. Executive Summary & Problem Statement

### 1.1 Background
In modern hybrid and remote work environments, organizations spend significant hours in video conferences. However, the collaborative process remains fragmented:
- Meeting participants often struggle to focus on discussions while simultaneously taking notes.
- Crucial action items, decisions, and deadlines are frequently lost or delayed in follow-up emails.
- Existing tools separate video calling, live chat, transcription, and meeting minute documentation into different paid services.

### 1.2 Proposed Solution
**IntelliMeet** is an all-in-one AI-powered enterprise meeting platform built using the **MERN Stack** (MongoDB, Express, React, Node.js), **WebRTC**, and **Socket.io**. It integrates:
1. High-definition peer-to-peer video calling, microphone streaming, and screen sharing.
2. Low-latency, multi-user chat room messaging.
3. Client-side, zero-lag **Speech-to-Text voice transcription** using the HTML5 Web Speech API.
4. Autonomous **AI-generated meeting minutes**, extracting executive summaries, key decisions, and checkable action items with assignees.
5. Persistent storage of meeting history and summaries in a **MongoDB** database.

---

## 2. Technology Stack

| Layer | Technologies Used | Purpose / Justification |
| :--- | :--- | :--- |
| **Frontend** | React 19, Vite, CSS3, Lucide React | High-performance Single Page Application (SPA), component modularity, instant hot-reloading, and responsive enterprise UI. |
| **Backend** | Node.js, Express.js | Event-driven, asynchronous REST API server handling meeting orchestration and AI processing. |
| **Real-Time Mesh** | Socket.io (Client & Server) | Full-duplex WebSocket communication for instant chat broadcasting, participant tracking, and signaling relay. |
| **Media & Hardware** | WebRTC (`navigator.mediaDevices`) | Browser-native hardware interfacing for live webcam video, microphone audio, and screen sharing. |
| **Transcription** | Web Speech API (`SpeechRecognition`) | Real-time speech-to-text live subtitles running on device with zero latency and zero external transcription API cost. |
| **Database** | MongoDB, Mongoose ODM | Document-oriented persistence storing meeting metadata, participants, executive summaries, and action item checklists. |
| **Deployment** | Vercel (Frontend), Git / GitHub | Continuous deployment, automated branch tracking, and global CDN hosting. |

---

## 3. System Architecture & Data Flow

```
[ User Browser (Client) ]
       │
       ├── WebRTC (getUserMedia) ────────► Direct Video/Audio Stream & Screen Share
       │
       ├── Web Speech API ───────────────► Client-side Real-time Speech-to-Text Subtitles
       │
       ├── Socket.io Client ─────────────► Real-time Event Pipeline
       │                                          │
       ▼                                          ▼
[ Node.js + Express Backend Server ] ◄────────────┘
       │
       ├── Room Partitioning & Broadcast Hub (io.to(roomId).emit())
       │
       ├── AI Summarization & NLP Pipeline (POST /api/ai/summarize)
       │
       ▼
[ MongoDB Database (Mongoose ODM) ]
       └── Meeting Collection (Past Session Summaries, Key Decisions & Tasks)
```

### 3.1 Step-by-Step User Journey Flow
1. **Lobby Initialization:** The user visits the application, inputs their name, and either generates an instant meeting ID or enters an existing code.
2. **Hardware Authorization:** The client requests access to webcam and microphone via `getUserMedia()`. The user's video feed displays immediately with mirror transform.
3. **Room Connection:** The client emits `join-room` through Socket.io. The server joins the socket to a private room channel and notifies existing peers.
4. **Interactive Collaboration:** Users exchange live chat messages, share their screens, and view live speech subtitles as participants speak.
5. **AI Meeting Minutes Generation:** At any point during or at the end of the call, the AI Assistant analyzes the aggregated conversation and outputs an Executive Summary, Key Decisions, and Action Items.
6. **Session Termination & Persistence:** Clicking "Leave" automatically serializes the meeting data to `POST /api/meetings`, saving it in MongoDB. The lobby screen immediately reflects the newly archived meeting for future review.

---

## 4. Key Functional Modules

### 4.1 Module 1: Lobby & Single Page Application (SPA) Routing
- Avoids full page refreshes by implementing state-based view switching (`currentScreen: 'home' | 'meeting'`).
- Generates cryptographically random room codes (`meet-xxxxx`) or enables joining custom enterprise rooms.

### 4.2 Module 2: Hardware Video, Audio & Screen Sharing
- Integrates HTML5 MediaDevices API (`navigator.mediaDevices.getUserMedia`).
- Attaches the live `MediaStream` to an HTML5 `<video>` element using React `useRef` to prevent re-render lag.
- Supports runtime hardware muting by disabling individual audio/video tracks (`track.enabled = false`) without disconnecting the peer session.
- Implements `navigator.mediaDevices.getDisplayMedia()` for desktop and window screen sharing.

### 4.3 Module 3: Socket.io Real-Time Messaging Mesh
- Segregates communication channels into isolated rooms via `socket.join(roomId)`.
- Broadcasts messages with sub-second latency via `io.to(roomId).emit('receive-message')`.
- Displays dynamic system arrival banners (e.g., *"👋 Shaurya Pandey joined the room"*).

### 4.4 Module 4: Real-Time Speech-to-Text Transcription
- Uses the browser's native `webkitSpeechRecognition` engine.
- Transcribes vocal discussions into live subtitle captions in real time.
- Emits transcript chunks across the room so all peers can follow conversations visually.

### 4.5 Module 5: Autonomous AI Summarization & Action Item Extraction
- Aggregates chat dialogue and spoken transcripts.
- Processes the dialogue through an NLP pipeline returning structured JSON:
  - **Executive Summary:** A cohesive high-level recap.
  - **Key Decisions:** Bullet points of resolutions reached during the meeting.
  - **Smart Action Items:** Actionable tasks with assignees and interactive completion checkboxes.
- Features a **"Copy Meeting Minutes"** utility for single-click clipboard export.

### 4.6 Module 6: MongoDB Meeting Archive & History Dashboard
- Defined using a Mongoose schema (`MeetingSchema`) with fields for `roomId`, `hostName`, `summary`, `keyDecisions`, and `actionItems`.
- When a host leaves a room, the session data is written to MongoDB.
- Displays a responsive **"Recent Meetings & Saved AI Summaries"** grid on the lobby screen with an interactive details modal.

---

## 5. Security & Performance Highlights

- **Hardware Privacy:** Camera and microphone streams are terminated immediately upon exiting a meeting (`track.stop()`), ensuring no background recording.
- **Room Isolation:** Socket.io ensures that chat messages, transcripts, and signals never leak into adjacent meeting rooms.
- **Client-Side Offloading:** Voice transcription runs locally via the browser's built-in Web Speech API, significantly reducing server compute load and bandwidth consumption.
- **Resilient Fallback:** The server includes an in-memory safety store if the external database is temporarily offline, ensuring 100% application uptime.

---

## 6. Challenges Faced & Solutions

| Challenge | Root Cause | Solution Implemented |
| :--- | :--- | :--- |
| **Audio Feedback Loop** | Playing user's own audio stream back through their speakers. | Added `muted` attribute to the local `<video>` element while leaving outgoing audio tracks active. |
| **Re-render Lag on Video** | Re-rendering React components 30–60 times per second for video frames. | Used React `useRef` to directly mount the `MediaStream` onto the DOM node, bypassing React reconciliation overhead. |
| **Room Message Leakage** | Broadcasting chat messages globally across all users. | Utilized Socket.io room partitioning (`socket.join(roomId)` and `io.to(roomId).emit()`) to strictly isolate room traffic. |
| **Database Persistence Reliability** | Network interruptions preventing MongoDB connections. | Implemented a dual-mode storage engine with seamless in-memory fallback to prevent API crashes. |

---

## 7. Conclusion & Future Roadmap

**IntelliMeet** successfully demonstrates a complete, production-ready enterprise collaboration platform developed with the MERN stack. By integrating real-time communication protocols (WebRTC & Socket.io) with artificial intelligence, the platform eliminates the manual overhead of meeting documentation and boosts organizational efficiency.

### Future Enhancements:
1. **Selective Forwarding Unit (SFU):** Upgrading peer-to-peer WebRTC mesh to an SFU architecture (e.g., MediaSoup or LiveKit) for meetings exceeding 10+ participants.
2. **Cloud Recording:** Storing meeting video streams to cloud object storage (AWS S3) for on-demand playback.
3. **Automated Email Dispatch:** Automatically emailing generated AI meeting minutes to all attendees upon call completion.

---

**Report Prepared By:** Anumol Vijayan  
**Program Mentor:** Shaurya Pandey
