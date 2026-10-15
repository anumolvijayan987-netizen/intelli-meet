# 🚀 IntelliMeet — AI-Powered Enterprise Meeting & Collaboration Platform

> An intelligent, production-ready virtual meeting platform built using the **MERN Stack** (MongoDB, Express, React, Node.js), **WebRTC**, **Socket.io**, and **AI Summarization**. IntelliMeet delivers real-time HD video conferencing, instant multi-user messaging, live voice-to-text transcription, and autonomous meeting minute generation with action item extraction.

---

## 🌟 Key Features

- 📹 **Real-Time Video Conferencing & Screen Sharing:** Built using native WebRTC (`navigator.mediaDevices.getUserMedia`) for ultra-low latency peer streaming.
- 💬 **Instant Multi-User Room Chat:** Real-time communication powered by **Socket.io** room partitioning (`io.to(roomId).emit()`).
- 🎙️ **Live Voice Transcription (Speech-to-Text):** Integrated HTML5 Web Speech API (`SpeechRecognition`) for real-time live subtitle captions as participants speak.
- 🤖 **AI-Generated Meeting Minutes & Action Items:** Automated summaries, key decisions, and checkable to-do items with assignees via the AI summarization engine.
- 🗄️ **Persistent Database Storage (MongoDB & Mongoose):** Completed sessions, participants, and AI meeting minutes are automatically saved to MongoDB and viewable on the lobby dashboard.
- 🎨 **Enterprise Dark Theme UI:** Sleek, responsive interface built with **React** and **Lucide Icons**.

---

## 🏗️ System Architecture

```
[ User Browser (Client) ]
       │
       ├── WebRTC (getUserMedia) ──► Direct Video / Audio Hardware Stream
       │
       ├── Web Speech API ─────────► Client-side Real-time Speech-to-Text
       │
       ├── Socket.io Client ───────► Real-time Bi-directional Event Channel
       │                                     │
       ▼                                     ▼
[ Node.js + Express Server (Port 5000) ]
       │
       ├── Socket.io Hub (Room Management & Signaling Relay)
       ├── AI Summarization & NLP Engine (POST /api/ai/summarize)
       │
       ▼
[ MongoDB Database ]
       └── Meeting Collection (Past Session Minutes & Action Items)
```

---

## 🛠️ Tech Stack

- **Frontend:** React (Vite), CSS3 (Flexbox/Grid), Lucide React
- **Backend:** Node.js, Express.js, Socket.io, CORS, Dotenv
- **Database:** MongoDB, Mongoose ODM
- **Media & AI:** WebRTC MediaDevices API, Web Speech API, OpenAI / NLP Engine

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have **Node.js (v18+)** and **Git** installed on your system.

### 2. Installation

Clone the repository and install dependencies for both client and server:

```bash
# Clone the repository
git clone <your-repo-url>
cd intelli-meet

# Install client packages
cd client
npm install

# Install server packages
cd ../server
npm install
```

### 3. Running Locally

**Terminal 1 (Backend Server):**
```bash
cd server
node server.js
# Runs on http://localhost:5000
```

**Terminal 2 (Frontend Client):**
```bash
cd client
npm run dev
# Runs on http://localhost:5173
```

Open your browser and navigate to `http://localhost:5173` to start or join a meeting!

---

## 👥 Contributors
- **Developer:** Anumol Vijayan
- **Mentor:** Shaurya Pandey
