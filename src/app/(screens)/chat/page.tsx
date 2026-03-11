'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '@/context/auth-context';
import { useAppSelector } from '@/store/hooks';
import SendIcon from '@mui/icons-material/Send';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import Image from 'next/image';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import StopIcon from '@mui/icons-material/Stop';
import AddIcon from '@mui/icons-material/Add';
import HistoryIcon from '@mui/icons-material/History';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import styles from './page.module.scss';

const ThreeBackground = dynamic(() => import('@/components/home/three-background'), { ssr: false });

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

const SUGGESTED = [
  'What does my birth chart reveal?',
  'Which planets are retrograde now?',
  'Tell me about Aries rising sign',
  'What is my lucky day this week?',
];

const MAX_HISTORY = 5;
const STORAGE_KEY = 'astroflare_chat_history';

function loadHistory(): ChatSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(sessions: ChatSession[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.slice(0, MAX_HISTORY)));
  } catch { }
}

export default function ChatPage() {
  const { user } = useAuth();
  const { charts } = useAppSelector((state) => state.charts);

  const [messages, setMessages] = useState<Message[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasMessages = messages.length > 0;

  // Load history from localStorage on mount
  useEffect(() => {
    setChatHistory(loadHistory());
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
  }, [input]);

  const saveCurrentSession = useCallback((msgs: Message[], sessionId: string) => {
    if (msgs.length < 2) return; // need at least 1 user + 1 ai
    const firstUserMsg = msgs.find(m => m.role === 'user');
    const title = firstUserMsg
      ? firstUserMsg.content.slice(0, 50) + (firstUserMsg.content.length > 50 ? '…' : '')
      : 'Cosmic conversation';

    setChatHistory(prev => {
      const filtered = prev.filter(s => s.id !== sessionId);
      const updated = [
        { id: sessionId, title, messages: msgs, createdAt: Date.now() },
        ...filtered,
      ].slice(0, MAX_HISTORY);
      saveHistory(updated);
      return updated;
    });
  }, []);

  const handleSend = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput('');

    const sessionId = currentSessionId ?? Date.now().toString();
    if (!currentSessionId) setCurrentSessionId(sessionId);

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: msg };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setLoading(true);

    try {
      const primaryChart = charts[0];
      const res = await fetch('/api/ask-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: msg, chartData: primaryChart ? JSON.stringify(primaryChart) : null }),
      });
      const data = await res.json();
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || data.answer || 'The stars are silent right now. Please try again soon.',
      };
      const finalMessages = [...newMessages, aiMsg];
      setMessages(finalMessages);
      saveCurrentSession(finalMessages, sessionId);
    } catch {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I've lost my connection to the ether. Please check your internet and try again.",
      };
      const finalMessages = [...newMessages, errMsg];
      setMessages(finalMessages);
      saveCurrentSession(finalMessages, sessionId);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentSessionId(null);
    setInput('');
    setSidebarOpen(false);
  };

  const loadSession = (session: ChatSession) => {
    setMessages(session.messages);
    setCurrentSessionId(session.id);
    setSidebarOpen(false);
  };

  const deleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setChatHistory(prev => {
      const updated = prev.filter(s => s.id !== sessionId);
      saveHistory(updated);
      return updated;
    });
    if (currentSessionId === sessionId) startNewChat();
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const diffH = (now.getTime() - d.getTime()) / 3600000;
    if (diffH < 1) return 'Just now';
    if (diffH < 24) return `${Math.floor(diffH)}h ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className={styles.page}>
      <ThreeBackground />
      {/* ── Permanent bg blur ── */}
      <div className={styles.bgBlur} />

      {/* ── Sidebar overlay blur ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className={styles.sidebarOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            className={styles.sidebar}
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          >
            <div className={styles.sidebarHeader}>
              <div className={styles.sidebarLogo}>
                <AutoAwesomeIcon sx={{ fontSize: '1.1rem', color: '#a78bfa' }} />
                <span>Chat History</span>
              </div>
              <button className={styles.sidebarClose} onClick={() => setSidebarOpen(false)}>
                <CloseIcon sx={{ fontSize: '1.1rem' }} />
              </button>
            </div>

            <button className={styles.newChatBtn} onClick={startNewChat}>
              <AddIcon sx={{ fontSize: '1rem' }} />
              New Chat
            </button>

            <div className={styles.historyList}>
              {chatHistory.length === 0 ? (
                <div className={styles.noHistory}>
                  <ChatBubbleOutlineIcon sx={{ fontSize: '2rem', color: '#334155', mb: 1 }} />
                  <p>No previous chats yet</p>
                </div>
              ) : (
                <>
                  <span className={styles.historyLabel}>Recent — Top {MAX_HISTORY}</span>
                  {chatHistory.map((session) => (
                    <button
                      key={session.id}
                      className={`${styles.historyItem} ${currentSessionId === session.id ? styles.historyActive : ''}`}
                      onClick={() => loadSession(session)}
                    >
                      <ChatBubbleOutlineIcon sx={{ fontSize: '0.9rem', flexShrink: 0, opacity: 0.5 }} />
                      <div className={styles.historyItemContent}>
                        <span className={styles.historyTitle}>{session.title}</span>
                        <span className={styles.historyTime}>{formatTime(session.createdAt)}</span>
                      </div>
                      <button
                        className={styles.deleteBtn}
                        onClick={(e) => deleteSession(e, session.id)}
                        title="Delete"
                      >
                        <DeleteOutlineIcon sx={{ fontSize: '0.9rem' }} />
                      </button>
                    </button>
                  ))}
                </>
              )}
            </div>

            {/* User profile at bottom of sidebar */}
            {user && (
              <div className={styles.sidebarUser}>
                {user.photoURL ? (
                  <Image src={user.photoURL} alt="avatar" width={32} height={32} className={styles.sidebarAvatar} />
                ) : (
                  <AccountCircleIcon sx={{ fontSize: '2rem', color: '#64748b' }} />
                )}
                <div className={styles.sidebarUserInfo}>
                  <span className={styles.sidebarUserName}>{user.displayName ?? 'Explorer'}</span>
                  <span className={styles.sidebarUserEmail}>{user.email}</span>
                </div>
              </div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Floating top-left controls ── */}
      <div className={styles.floatingControls}>
        <button className={styles.historyBtn} onClick={() => setSidebarOpen(true)} title="Chat history">
          <HistoryIcon sx={{ fontSize: '1.2rem' }} />
        </button>
        <button className={styles.newChatIconBtn} onClick={startNewChat} title="New chat">
          <AddIcon sx={{ fontSize: '1.2rem' }} />
        </button>
      </div>

      {/* ── Playful Bot Character (bottom-right) ── */}
      {/* <div className={styles.botCharacter}>
        <div className={styles.botGlow} />
        <div className={styles.botOrbit}>
          <span className={styles.orbitStar}>✦</span>
          <span className={styles.orbitStar2}>★</span>
          <span className={styles.orbitStar3}>✧</span>
        </div>
        <div className={styles.botBody}>
          <div className={styles.botFace}>
            <span className={styles.botEye} />
            <span className={styles.botEye} />
          </div>
          <div className={styles.botAntenna}>
            <span className={styles.botAntennaTip}>⋆</span>
          </div>
          <div className={styles.botMouth} />
        </div>
        <div className={styles.botLabel}>
          <AutoAwesomeIcon sx={{ fontSize: '0.7rem', color: '#a78bfa' }} />
          <span>AI Astrologer</span>
        </div>
      </div> */}

      {/* ── Messages area ── */}
      <div className={`${styles.messagesArea} ${hasMessages ? styles.hasMessages : ''}`} ref={scrollRef}>
        {!hasMessages ? (
          <motion.div
            className={styles.emptyState}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className={styles.orb}>
              <AutoAwesomeIcon sx={{ fontSize: '2rem', color: '#a78bfa' }} />
            </div>
            <h1 className={styles.greeting}>What's on the cosmic agenda today?</h1>
            <p className={styles.sub}>Ask me anything about astrology, your birth chart, or the stars.</p>
            <div className={styles.suggestions}>
              {SUGGESTED.map((s) => (
                <button key={s} className={styles.suggestionChip} onClick={() => handleSend(s)}>
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <div className={styles.messagesList}>
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  className={msg.role === 'user' ? styles.userRow : styles.aiRow}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {msg.role === 'assistant' && (
                    <div className={styles.aiAvatar}>
                      <AutoAwesomeIcon sx={{ fontSize: '1.1rem', color: '#a78bfa' }} />
                    </div>
                  )}
                  <div className={msg.role === 'user' ? styles.userBubble : styles.aiBubble}>
                    {msg.role === 'assistant' ? (
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    ) : (
                      msg.content
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && (
              <motion.div
                className={styles.aiRow}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <div className={styles.aiAvatar}>
                  <AutoAwesomeIcon sx={{ fontSize: '1.1rem', color: '#a78bfa' }} />
                </div>
                <div className={styles.thinkingBubble}>
                  <span /><span /><span />
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* ── Input bar ── */}
      <div className={`${styles.inputBar} ${hasMessages ? styles.inputBottom : styles.inputCentered}`}>
        <div className={styles.inputInner}>
          <textarea
            ref={textareaRef}
            className={styles.textarea}
            placeholder="Ask anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            rows={1}
          />
          <div className={styles.inputActions}>
            <button
              className={styles.sendBtn}
              onClick={() => handleSend()}
              disabled={!input.trim() && !loading}
              aria-label="Send"
            >
              {loading ? <StopIcon sx={{ fontSize: '1.2rem' }} /> : <SendIcon sx={{ fontSize: '1.2rem' }} />}
            </button>
          </div>
        </div>
        {hasMessages && (
          <p className={styles.disclaimer}>AI Astrologer can make mistakes. Verify important readings.</p>
        )}
      </div>
    </div>
  );
}
