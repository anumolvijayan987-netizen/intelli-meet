import { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  MessageSquare,
  Sparkles,
  PhoneOff,
  Send,
  Users,
  Copy,
  CheckCircle2,
  ListTodo,
  Video as VideoIcon,
  ShieldCheck,
  Zap,
  ArrowRight,
  AlertCircle,
  Captions,
  Loader2,
  Check,
  ClipboardList,
  History,
  Calendar,
  X
} from 'lucide-react'
import './App.css'

export default function App() {
  // Navigation State ('home' or 'meeting')
  const [currentScreen, setCurrentScreen] = useState('home')

  // User Profile & Room Info
  const [userName, setUserName] = useState('Anumol Vijayan')
  const [roomId, setRoomId] = useState('')
  const [copiedLink, setCopiedLink] = useState(false)
  const [participantsCount, setParticipantsCount] = useState(1)
  const [peers, setPeers] = useState([])

  // Past Meetings & Database State
  const [pastMeetings, setPastMeetings] = useState([])
  const [selectedPastMeeting, setSelectedPastMeeting] = useState(null)

  // Meeting Media Controls
  const [isMicOn, setIsMicOn] = useState(true)
  const [isCamOn, setIsCamOn] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [cameraError, setCameraError] = useState(null)

  // Real Hardware Stream Ref & State
  const localVideoRef = useRef(null)
  const [stream, setStream] = useState(null)

  // Socket.io Real-time Connection Ref
  const socketRef = useRef(null)

  // Live Speech-to-Text Transcription State
  const [isTranscribing, setIsTranscribing] = useState(true)
  const [liveSubtitle, setLiveSubtitle] = useState('')
  const [liveSubtitleSpeaker, setLiveSubtitleSpeaker] = useState('')
  const [transcript, setTranscript] = useState([])
  const recognitionRef = useRef(null)

  // Right Side Panel Tabs ('chat' or 'ai')
  const [activeTab, setActiveTab] = useState('chat')

  // Chat Messages State
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')

  // AI Meeting Assistant State
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [copiedNotes, setCopiedNotes] = useState(false)
  const [aiSummary, setAiSummary] = useState(
    'Welcome to IntelliMeet! Click "Generate AI Summary" at any time or as you speak to analyze live transcripts and extract action items.'
  )
  const [keyDecisions, setKeyDecisions] = useState([
    'Agreed on MERN stack implementation for enterprise scalability',
    'Using WebRTC for peer-to-peer video streaming and Socket.io for messaging'
  ])
  const [actionItems, setActionItems] = useState([
    { id: 1, text: 'Configure WebRTC signaling server with Socket.io', assignee: 'Engineering Team', completed: true },
    { id: 2, text: 'Connect MongoDB database to save meeting minutes permanently', assignee: 'Anumol', completed: false },
    { id: 3, text: 'Deploy web client to Vercel and backend to Render', assignee: 'DevOps', completed: false }
  ])

  // ========================================================
  // LOAD PAST MEETINGS FROM DATABASE
  // ========================================================
  useEffect(() => {
    if (currentScreen === 'home') {
      fetch('http://localhost:5000/api/meetings')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setPastMeetings(data)
        })
        .catch(err => console.log('Could not load past meetings:', err))
    }
  }, [currentScreen])

  // ========================================================
  // SOCKET.IO REAL-TIME CONNECTION
  // ========================================================
  useEffect(() => {
    if (currentScreen === 'meeting' && roomId) {
      const socket = io('http://localhost:5000')
      socketRef.current = socket

      socket.on('connect', () => {
        socket.emit('join-room', {
          roomId: roomId,
          userName: userName || 'Anonymous'
        })
      })

      socket.on('user-joined', ({ userName: peerName, time }) => {
        setParticipantsCount(prev => prev + 1)
        setPeers(prev => [...prev, { id: Date.now() + Math.random(), name: peerName }])
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            sender: 'System',
            time: time,
            text: `👋 ${peerName} joined the meeting room.`,
            isSystem: true
          }
        ])
      })

      socket.on('receive-message', (incomingMsg) => {
        setMessages(prev => [...prev, incomingMsg])
      })

      socket.on('receive-transcript', (chunk) => {
        setTranscript(prev => [...prev, chunk])
        setLiveSubtitle(chunk.text)
        setLiveSubtitleSpeaker(chunk.speaker)
        setTimeout(() => setLiveSubtitle(''), 5000)
      })

      return () => {
        socket.disconnect()
      }
    }
  }, [currentScreen, roomId, userName])

  // ========================================================
  // SPEECH-TO-TEXT (WEB SPEECH API)
  // ========================================================
  useEffect(() => {
    if (currentScreen === 'meeting' && isTranscribing && isMicOn) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition()
          recognition.continuous = true
          recognition.interimResults = true
          recognition.lang = 'en-US'

          recognition.onresult = (event) => {
            const current = event.resultIndex
            const spokenText = event.results[current][0].transcript

            setLiveSubtitle(spokenText)
            setLiveSubtitleSpeaker(userName || 'You')

            if (event.results[current].isFinal) {
              const chunk = {
                id: Date.now(),
                speaker: userName || 'You',
                text: spokenText.trim(),
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }

              setTranscript(prev => [...prev, chunk])
              socketRef.current?.emit('transcript-chunk', { roomId, transcriptData: chunk })
              setTimeout(() => setLiveSubtitle(''), 5000)
            }
          }

          recognition.onerror = (e) => {
            console.warn('Speech recognition status:', e.error)
          }

          recognition.start()
          recognitionRef.current = recognition
        } catch (err) {
          console.warn('Speech recognition init error:', err)
        }
      }
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [currentScreen, isTranscribing, isMicOn, roomId, userName])

  // ========================================================
  // WEBRTC HARDWARE ACCESS
  // ========================================================
  useEffect(() => {
    let currentStream = null

    if (currentScreen === 'meeting') {
      const startCamera = async () => {
        try {
          setCameraError(null)
          const userMediaStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
          })

          currentStream = userMediaStream
          setStream(userMediaStream)

          if (localVideoRef.current) {
            localVideoRef.current.srcObject = userMediaStream
          }
        } catch (err) {
          console.error('Error accessing camera/mic:', err)
          setCameraError('Camera/Mic permission denied or not available.')
        }
      }

      startCamera()
    }

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [currentScreen])

  useEffect(() => {
    if (stream && localVideoRef.current && isCamOn) {
      localVideoRef.current.srcObject = stream
    }
  }, [stream, isCamOn])

  // Controls
  const toggleMic = () => {
    const nextState = !isMicOn
    setIsMicOn(nextState)
    if (stream) {
      stream.getAudioTracks().forEach(track => { track.enabled = nextState })
    }
  }

  const toggleCam = () => {
    const nextState = !isCamOn
    setIsCamOn(nextState)
    if (stream) {
      stream.getVideoTracks().forEach(track => { track.enabled = nextState })
    }
  }

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true })
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream
        }
        setIsScreenSharing(true)

        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false)
          if (localVideoRef.current && stream) {
            localVideoRef.current.srcObject = stream
          }
        }
      } catch (err) {
        console.warn('Screen share canceled:', err)
      }
    } else {
      setIsScreenSharing(false)
      if (localVideoRef.current && stream) {
        localVideoRef.current.srcObject = stream
      }
    }
  }

  // ========================================================
  // AI SUMMARIZATION TRIGGER
  // ========================================================
  const handleGenerateAISummary = async () => {
    setIsGeneratingAI(true)
    setActiveTab('ai')

    try {
      const response = await fetch('http://localhost:5000/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: transcript,
          messages: messages,
          roomName: roomId
        })
      })

      const data = await response.json()
      if (data.summary) {
        setAiSummary(data.summary)
      }
      if (data.keyDecisions) {
        setKeyDecisions(data.keyDecisions)
      }
      if (data.actionItems) {
        setActionItems(data.actionItems)
      }
    } catch (err) {
      console.error('Failed to generate AI summary:', err)
    } finally {
      setIsGeneratingAI(false)
    }
  }

  const handleExportMinutes = () => {
    const content = `
=== INTELLIMEET EXECUTIVE MINUTES ===
Room: ${roomId}
Date: ${new Date().toLocaleDateString()}
Participants: ${participantsCount}

[EXECUTIVE SUMMARY]
${aiSummary}

[KEY DECISIONS]
${keyDecisions.map(d => `• ${d}`).join('\n')}

[ACTION ITEMS]
${actionItems.map(a => `[${a.completed ? 'X' : ' '}] ${a.text} (${a.assignee || 'Unassigned'})`).join('\n')}
======================================
    `.trim()

    navigator.clipboard.writeText(content)
    setCopiedNotes(true)
    setTimeout(() => setCopiedNotes(false), 2500)
  }

  // Meeting Lifecycle Actions
  const handleStartNewMeeting = () => {
    if (!userName.trim()) return alert('Please enter your name!')
    const randomCode = 'meet-' + Math.random().toString(36).substring(2, 7)
    setRoomId(randomCode)
    setParticipantsCount(1)
    setPeers([])
    setMessages([])
    setTranscript([])
    setCurrentScreen('meeting')
  }

  const handleJoinMeeting = (e) => {
    e.preventDefault()
    if (!userName.trim()) return alert('Please enter your name!')
    if (!roomId.trim()) return alert('Please enter a room code!')
    setParticipantsCount(1)
    setPeers([])
    setMessages([])
    setTranscript([])
    setCurrentScreen('meeting')
  }

  const handleLeaveMeeting = async () => {
    if (confirm('Are you sure you want to leave the meeting?')) {
      // 1. Save meeting session to MongoDB database
      try {
        await fetch('http://localhost:5000/api/meetings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId: roomId,
            hostName: userName || 'Host',
            participants: [userName || 'Host', 'Shaurya Pandey (Mentor)'],
            summary: aiSummary,
            keyDecisions: keyDecisions,
            actionItems: actionItems
          })
        })
      } catch (saveErr) {
        console.warn('Could not auto-save meeting:', saveErr)
      }

      // 2. Cleanup hardware
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
        setStream(null)
      }
      if (socketRef.current) {
        socketRef.current.disconnect()
      }

      // 3. Navigate back to Home
      setCurrentScreen('home')
    }
  }

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!inputText.trim()) return

    const newMsg = {
      id: Date.now() + Math.random(),
      sender: userName || 'Anonymous',
      socketId: socketRef.current?.id,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: inputText
    }

    if (socketRef.current) {
      socketRef.current.emit('send-message', {
        roomId: roomId,
        message: newMsg
      })
    } else {
      setMessages(prev => [...prev, newMsg])
    }

    setInputText('')
  }

  const toggleActionItem = (id) => {
    setActionItems(actionItems.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    ))
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(roomId)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  // ========================================================
  // VIEW 1: HOME / LANDING SCREEN
  // ========================================================
  if (currentScreen === 'home') {
    return (
      <div className="home-container">
        <nav className="home-nav">
          <div className="brand">
            <div className="brand-icon">IM</div>
            <span className="brand-title">IntelliMeet</span>
            <span className="brand-badge">AI Powered</span>
          </div>
          <span style={{ fontSize: '13px', color: '#94a3b8' }}>
            Enterprise Meeting Platform
          </span>
        </nav>

        <main className="home-content">
          <div className="hero-pill">
            <Sparkles size={14} color="#818cf8" />
            <span>AI-Driven Real-time Collaboration</span>
          </div>

          <h1 className="hero-title">
            Transform Your Meetings with <span className="gradient-text">Intelligent AI</span>
          </h1>

          <p className="hero-subtitle">
            HD video conferencing, live multi-user chat, and an autonomous AI companion that takes notes, auto-transcribes speech, and extracts action items into MongoDB.
          </p>

          <div className="join-card">
            <div className="form-group">
              <label className="form-label">Your Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Anumol Vijayan"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
            </div>

            <button className="btn-primary" onClick={handleStartNewMeeting}>
              <VideoIcon size={18} />
              <span>Start New Meeting</span>
            </button>

            <div className="card-divider">
              <span>Or join an existing room</span>
            </div>

            <form onSubmit={handleJoinMeeting} className="join-row">
              <input
                type="text"
                className="form-input"
                placeholder="Enter room code (e.g. sprint-review)"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
              />
              <button type="submit" className="btn-secondary">
                <ArrowRight size={18} />
              </button>
            </form>
          </div>

          <div className="feature-row">
            <div className="feature-badge">
              <Zap size={16} color="#eab308" />
              <span>Socket.io Real-time Mesh</span>
            </div>
            <div className="feature-badge">
              <Captions size={16} color="#38bdf8" />
              <span>Web Speech Auto-Transcription</span>
            </div>
            <div className="feature-badge">
              <Sparkles size={16} color="#818cf8" />
              <span>MongoDB Meeting Storage</span>
            </div>
          </div>

          {/* Past Meetings & Saved AI Summaries Section */}
          <section className="past-meetings-section">
            <div className="past-meetings-header">
              <div className="past-meetings-title">
                <History size={20} color="#818cf8" />
                <span>Recent Meetings & Saved AI Summaries ({pastMeetings.length})</span>
              </div>
            </div>

            {pastMeetings.length === 0 ? (
              <div style={{ background: '#111827', border: '1px dashed #374151', borderRadius: '12px', padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                No past meetings saved yet. Start a meeting, click the AI Assistant, and leave the room to save your first record to MongoDB!
              </div>
            ) : (
              <div className="past-grid">
                {pastMeetings.map((m, idx) => (
                  <div key={m._id || m.id || idx} className="past-card" onClick={() => setSelectedPastMeeting(m)}>
                    <div className="past-card-top">
                      <span className="past-room-badge">{m.roomId}</span>
                      <span className="past-date">
                        {new Date(m.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="past-summary">{m.summary || 'Sprint review session notes.'}</p>
                    <div className="past-card-footer">
                      <Sparkles size={13} />
                      <span>{m.actionItems?.length || 0} Action Items • View Details →</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>

        {/* Modal for viewing past meeting AI details */}
        {selectedPastMeeting && (
          <div className="modal-overlay" onClick={() => setSelectedPastMeeting(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h3 style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
                    Meeting: {selectedPastMeeting.roomId}
                  </h3>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    Hosted by {selectedPastMeeting.hostName || 'Host'} • {new Date(selectedPastMeeting.createdAt).toLocaleString()}
                  </span>
                </div>
                <button className="btn-close" onClick={() => setSelectedPastMeeting(null)}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="ai-summary-card">
                  <div className="ai-summary-title">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sparkles size={16} color="#818cf8" />
                      Executive Summary
                    </span>
                  </div>
                  <p style={{ color: '#cbd5e1' }}>{selectedPastMeeting.summary}</p>
                </div>

                {selectedPastMeeting.keyDecisions?.length > 0 && (
                  <div className="key-decisions-card">
                    <div style={{ fontWeight: 600, color: '#38bdf8', marginBottom: '8px', fontSize: '13px' }}>
                      Key Decisions
                    </div>
                    <ul style={{ paddingLeft: '18px', color: '#cbd5e1', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {selectedPastMeeting.keyDecisions.map((dec, i) => (
                        <li key={i}>{dec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', marginBottom: '8px' }}>
                    Action Items ({selectedPastMeeting.actionItems?.length || 0})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedPastMeeting.actionItems?.map((item, i) => (
                      <div key={i} className="action-item">
                        <CheckCircle2 size={16} color={item.completed ? '#10b981' : '#64748b'} />
                        <span style={{ color: '#f1f5f9' }}>{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ========================================================
  // VIEW 2: ACTIVE MEETING ROOM SCREEN
  // ========================================================
  return (
    <div className="meet-container">
      {/* Top Header */}
      <header className="meet-header">
        <div className="brand" onClick={() => setCurrentScreen('home')}>
          <div className="brand-icon">IM</div>
          <span className="brand-title">IntelliMeet</span>
          <span className="brand-badge">AI Powered</span>
        </div>

        <div className="meeting-info">
          <div className="room-pill">
            <span className="live-dot"></span>
            <span>Room: <strong>{roomId}</strong></span>
          </div>

          <button
            className="btn-ctrl"
            style={{ width: '36px', height: '36px' }}
            onClick={handleCopyLink}
            title="Copy room code"
          >
            {copiedLink ? <CheckCircle2 size={16} color="#10b981" /> : <Copy size={16} />}
          </button>
        </div>
      </header>

      {/* Main Video Stage & Side Panel */}
      <main className="meet-main">
        <div className="video-stage-wrapper">
          <section className="video-stage">
            {/* User Video Card (Live Webcam Feed) */}
            <div className={`video-card ${isMicOn ? 'speaking' : ''}`}>
              {isCamOn ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="video-element"
                  style={{ transform: isScreenSharing ? 'none' : 'scaleX(-1)' }}
                />
              ) : (
                <div className="avatar-placeholder">
                  {(userName || 'U')[0].toUpperCase()}
                </div>
              )}

              <div className="card-overlay">
                <span>{userName || 'You'} (Host)</span>
              </div>

              <div className="card-status">
                {!isMicOn && <div className="status-badge"><MicOff size={14} /></div>}
                {!isCamOn && <div className="status-badge"><VideoOff size={14} /></div>}
              </div>

              {cameraError && (
                <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(239, 68, 68, 0.9)', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={12} />
                  <span>{cameraError}</span>
                </div>
              )}
            </div>

            {/* Real Remote Participants (Dynamically added when someone joins) */}
            {peers.map((peer) => (
              <div key={peer.id} className="video-card">
                <div className="avatar-placeholder" style={{ background: 'linear-gradient(135deg, #0ea5e9, #2563eb)' }}>
                  {(peer.name || 'P')[0].toUpperCase()}
                </div>
                <div className="card-overlay">
                  <span>{peer.name}</span>
                </div>
              </div>
            ))}

            {/* If alone in the meeting: Show a clean waiting card instead of a hardcoded person */}
            {peers.length === 0 && (
              <div className="video-card" style={{ border: '1px dashed #374151', background: 'rgba(17, 24, 39, 0.4)' }}>
                <div style={{ textAlign: 'center', padding: '24px' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#1f2937', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: '#94a3b8' }}>
                    <Users size={24} />
                  </div>
                  <h4 style={{ color: '#e2e8f0', fontSize: '15px', marginBottom: '6px' }}>Waiting for others to join</h4>
                  <p style={{ color: '#64748b', fontSize: '12px', marginBottom: '14px' }}>Share this meeting code with your team:</p>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#1f2937', padding: '6px 14px', borderRadius: '8px', border: '1px solid #374151' }}>
                    <strong style={{ color: '#818cf8', fontSize: '13px' }}>{roomId}</strong>
                    <button onClick={handleCopyLink} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      {copiedLink ? <CheckCircle2 size={14} color="#10b981" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* AI Assistant Card */}
            <div className="video-card ai-card">
              <div className="ai-pulse-ring"></div>
              <div className="avatar-placeholder ai-avatar">
                {isGeneratingAI ? <Loader2 size={36} className="spin" /> : <Sparkles size={36} />}
              </div>
              <div className="card-overlay ai-live-tag">
                <Sparkles size={14} />
                <span>IntelliMeet AI Companion ({isGeneratingAI ? 'Analyzing...' : 'Active'})</span>
              </div>
            </div>
          </section>

          {/* Live Subtitle / Caption Banner (Auto-transcribed speech) */}
          {liveSubtitle && (
            <div className="live-caption-bar">
              <span className="live-caption-speaker">🎙️ {liveSubtitleSpeaker}:</span>
              <span className="live-caption-text">"{liveSubtitle}"</span>
            </div>
          )}
        </div>

        {/* Side Panel: Live Chat & AI Insights */}
        <aside className="side-panel">
          <div className="panel-tabs">
            <button
              className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveTab('chat')}
            >
              <MessageSquare size={16} />
              Chat ({messages.filter(m => !m.isSystem).length})
            </button>
            <button
              className={`tab-btn ${activeTab === 'ai' ? 'active' : ''}`}
              onClick={() => setActiveTab('ai')}
            >
              <Sparkles size={16} />
              AI Notes & Tasks
            </button>
          </div>

          {activeTab === 'chat' ? (
            <>
              <div className="tab-content">
                {messages.length === 0 && (
                  <div style={{ textAlign: 'center', color: '#64748b', fontSize: '13px', marginTop: '20px' }}>
                    No messages yet. Say hello to everyone in the room!
                  </div>
                )}
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`chat-msg ${msg.isSystem ? 'system' : msg.socketId === socketRef.current?.id ? 'self' : ''}`}
                  >
                    {!msg.isSystem && (
                      <div className="chat-sender">
                        {msg.socketId === socketRef.current?.id ? 'You' : msg.sender}
                        <span className="chat-time">{msg.time}</span>
                      </div>
                    )}
                    <div>{msg.text}</div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendMessage} className="chat-input-bar">
                <input
                  type="text"
                  className="chat-input"
                  placeholder="Type a real-time message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
                <button type="submit" className="send-btn">
                  <Send size={16} />
                </button>
              </form>
            </>
          ) : (
            <div className="tab-content">
              {/* Executive Summary */}
              <div className="ai-summary-card">
                <div className="ai-summary-title">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={16} color="#818cf8" />
                    Executive Summary
                  </span>
                  {isGeneratingAI && <Loader2 size={14} className="spin" />}
                </div>
                <p style={{ color: '#cbd5e1' }}>{aiSummary}</p>
              </div>

              {/* Key Decisions */}
              <div className="key-decisions-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: '#38bdf8', marginBottom: '8px' }}>
                  <ClipboardList size={16} />
                  <span>Key Decisions</span>
                </div>
                <ul style={{ paddingLeft: '18px', color: '#cbd5e1', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {keyDecisions.map((dec, i) => (
                    <li key={i}>{dec}</li>
                  ))}
                </ul>
              </div>

              {/* Smart Action Items */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: '#94a3b8', marginBottom: '8px' }}>
                  <ListTodo size={16} />
                  <span>Smart Action Items ({actionItems.filter(i => i.completed).length}/{actionItems.length})</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {actionItems.map(item => (
                    <div key={item.id} className="action-item">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => toggleActionItem(item.id)}
                        className="action-checkbox"
                      />
                      <div style={{ flex: 1 }}>
                        <span style={{
                          textDecoration: item.completed ? 'line-through' : 'none',
                          color: item.completed ? '#64748b' : '#f1f5f9',
                          display: 'block'
                        }}>
                          {item.text}
                        </span>
                        {item.assignee && (
                          <span style={{ fontSize: '10px', color: '#818cf8', display: 'block', marginTop: '2px' }}>
                            Assignee: {item.assignee}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Export Minutes Button */}
              <button className="btn-export" onClick={handleExportMinutes}>
                {copiedNotes ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                <span>{copiedNotes ? 'Copied to Clipboard!' : 'Copy Meeting Minutes'}</span>
              </button>
            </div>
          )}
        </aside>
      </main>

      {/* Control Bar */}
      <footer className="meet-controls">
        <div className="control-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '14px' }}>
            <Users size={18} />
            <span>{participantsCount} Participant{participantsCount > 1 ? 's' : ''}</span>
          </div>
        </div>

        <div className="control-group">
          {/* Mic */}
          <button
            className={`btn-ctrl ${!isMicOn ? 'off' : ''}`}
            onClick={toggleMic}
            title={isMicOn ? 'Mute' : 'Unmute'}
          >
            {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
          </button>

          {/* Cam */}
          <button
            className={`btn-ctrl ${!isCamOn ? 'off' : ''}`}
            onClick={toggleCam}
            title={isCamOn ? 'Video Off' : 'Video On'}
          >
            {isCamOn ? <Video size={20} /> : <VideoOff size={20} />}
          </button>

          {/* Captions */}
          <button
            className={`btn-ctrl ${isTranscribing ? 'active-blue' : ''}`}
            onClick={() => setIsTranscribing(!isTranscribing)}
            title={isTranscribing ? 'Captions On' : 'Captions Off'}
          >
            <Captions size={20} />
          </button>

          {/* Screen Share */}
          <button
            className={`btn-ctrl ${isScreenSharing ? 'off' : ''}`}
            onClick={toggleScreenShare}
            title="Share Screen"
          >
            <MonitorUp size={20} />
          </button>

          {/* AI Generate Summary Button */}
          <button
            className="btn-ctrl btn-ai"
            onClick={handleGenerateAISummary}
            disabled={isGeneratingAI}
            title="Generate AI Meeting Summary"
          >
            {isGeneratingAI ? <Loader2 size={18} className="spin" /> : <Sparkles size={18} />}
            <span>{isGeneratingAI ? 'Analyzing...' : 'AI Assistant'}</span>
          </button>
        </div>

        <div className="control-group">
          <button className="btn-ctrl btn-end" onClick={handleLeaveMeeting}>
            <PhoneOff size={18} />
            <span>Leave</span>
          </button>
        </div>
      </footer>
    </div>
  )
}
