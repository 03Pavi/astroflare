'use client';

import { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import SendIcon from '@mui/icons-material/Send';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import Image from 'next/image';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AddIcon from '@mui/icons-material/Add';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import HistoryIcon from '@mui/icons-material/History';
import StopIcon from '@mui/icons-material/Stop';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import styles from './page.module.scss';
import { useZodiac } from '@/context/zodiac-context';
import { useAuth } from '@/context/auth-context';
import {
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Drawer,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { fetchUserCharts } from '@/store/slices/charts-slice';
import type { BirthChart } from '@/lib/charts';

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
  selectedChartId?: string | null;
}

const SUGGESTED = [
  'What does my birth chart reveal?',
  'Which planets are retrograde now?',
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
  return (
    <Suspense fallback={null}>
      <ChatContent />
    </Suspense>
  );
}

function ChatContent() {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const { charts } = useAppSelector((state) => state.charts);
  const { activeChart } = useZodiac();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [messages, setMessages] = useState<Message[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chartPickerOpen, setChartPickerOpen] = useState(false);
  const [selectedChartId, setSelectedChartId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasMessages = messages.length > 0;

  const searchParams = useSearchParams();
  const topic = searchParams.get('topic');

  // Load history from localStorage on mount
  useEffect(() => {
    setChatHistory(loadHistory());
  }, []);

  useEffect(() => {
    if (user && charts.length === 0) {
      dispatch(fetchUserCharts(user.uid));
    }
  }, [user, charts.length, dispatch]);

  // Handle initial topic greeting
  useEffect(() => {
    if (topic && messages.length === 0 && !loading) {
      let prompt = "";
      if (topic === 'career') {
        prompt = "I'm interested in learning about my career and wealth potential based on my birth chart. What can you tell me?";
      } else if (topic === 'numerology') {
        prompt = "Can you provide a numerology reading for me? I'd like to understand the vibrations of my name and birth date.";
      }

      if (prompt) {
        handleSend(prompt);
      }
    }
  }, [topic, charts]); // Run when charts are loaded or topic changes

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    if (!selectedChartId && charts.length > 0) {
      setSelectedChartId(activeChart?.$id ?? charts[0].$id);
    }
  }, [charts, activeChart, selectedChartId]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
  }, [input]);

  const saveCurrentSession = useCallback((msgs: Message[], sessionId: string, chartId: string | null) => {
    if (msgs.length < 2) return; // need at least 1 user + 1 ai
    const firstUserMsg = msgs.find(m => m.role === 'user');
    const title = firstUserMsg
      ? firstUserMsg.content.slice(0, 50) + (firstUserMsg.content.length > 50 ? '…' : '')
      : 'Cosmic conversation';

    setChatHistory(prev => {
      const filtered = prev.filter(s => s.id !== sessionId);
      const updated = [
        { id: sessionId, title, messages: msgs, createdAt: Date.now(), selectedChartId: chartId },
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
    const aiMessageId = (Date.now() + 1).toString();
    const newMessages = [...messages, userMessage, { id: aiMessageId, role: 'assistant' as const, content: '' }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const primaryChart =
        charts.find((c: BirthChart) => c.$id === selectedChartId) || activeChart || charts[0];
      const res = await fetch('/api/ask-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: msg,
          chartData: primaryChart ? JSON.stringify(primaryChart) : null,
          stream: true, 
        }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to fetch response');
      }

      const contentType = res.headers.get('content-type') || '';
      let streamedText = '';

      const appendAssistantText = (textPart: string) => {
        if (!textPart) return;
        streamedText += textPart;
        setMessages((prev) =>
          prev.map((message) =>
            message.id === aiMessageId ? { ...message, content: streamedText } : message
          )
        );
      };

      // JSON fallback for non-streaming upstream responses.
      if (contentType.includes('application/json')) {
        const data = await res.json();
        const plain =
          data.response ||
          data.answer ||
          data.message ||
          'The stars are silent right now. Please try again soon.';
        appendAssistantText(typeof plain === 'string' ? plain : JSON.stringify(plain));
      } else if (res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let sseBuffer = '';
        let streamErrored = false;

        while (!streamErrored) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          if (!chunk) continue;
          sseBuffer += chunk;

          // Parse complete SSE events separated by a blank line.
          const events = sseBuffer.split('\n\n');
          sseBuffer = events.pop() || '';

          for (const event of events) {
            const lines = event.split('\n');
            const dataLines = lines
              .map((line) => line.trimStart())
              .filter((line) => line.startsWith('data:'))
              .map((line) => line.slice(5).trimStart());

            if (dataLines.length === 0) continue;
            const payload = dataLines.join('\n');

            if (!payload || payload === '[DONE]') {
              continue;
            }

            if (payload.startsWith('ERROR:')) {
              appendAssistantText(`\n${payload}`);
              streamErrored = true;
              break;
            }

            appendAssistantText(payload);
          }
        }

        // Fallback if upstream sent plain text instead of SSE frames.
        if (!streamedText.trim() && sseBuffer.trim()) {
          appendAssistantText(sseBuffer.trim());
        }
      }

      if (!streamedText.trim()) {
        appendAssistantText('The stars are silent right now. Please try again soon.');
      }

      const finalMessages = [
        ...messages,
        userMessage,
        { id: aiMessageId, role: 'assistant' as const, content: streamedText },
      ];
      setMessages(finalMessages);
      saveCurrentSession(finalMessages, sessionId, selectedChartId);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error && error.message
          ? error.message
          : "I've lost my connection to the ether. Please check your internet and try again.";
      const finalMessages = [
        ...messages,
        userMessage,
        { id: aiMessageId, role: 'assistant' as const, content: errorMessage },
      ];
      setMessages(finalMessages);
      saveCurrentSession(finalMessages, sessionId, selectedChartId);
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
    setSelectedChartId(session.selectedChartId ?? null);
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

  const updateSessionChart = useCallback((sessionId: string, chartId: string | null) => {
    setChatHistory((prev) => {
      const updated = prev.map((session) =>
        session.id === sessionId ? { ...session, selectedChartId: chartId } : session
      );
      saveHistory(updated);
      return updated;
    });
  }, []);

  const selectedChart =
    charts.find((c: BirthChart) => c.$id === selectedChartId) || activeChart || charts[0] || null;
  const hasPendingAssistantMessage =
    loading &&
    messages.length > 0 &&
    messages[messages.length - 1]?.role === 'assistant' &&
    !messages[messages.length - 1]?.content?.trim();

  const closeChartPicker = useCallback(() => {
    setChartPickerOpen(false);
    if (window.location.hash === '#chart-picker') {
      window.history.back();
    }
  }, []);

  useEffect(() => {
    if (chartPickerOpen) {
      window.history.pushState({ chartPickerOpen: true }, '', '#chart-picker');
      const handlePopState = () => setChartPickerOpen(false);
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [chartPickerOpen]);

  return (
    <div className={styles.page}>
      <ThreeBackground />
      <div className={styles.bgBlur} />

      {/* ── Sidebar Drawer ── */}
      <Drawer
        anchor="left"
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        PaperProps={{ className: styles.sidebar }}
      >
        <div className={styles.sidebarContent}>
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
                    <div
                      key={session.id}
                      role="button"
                      tabIndex={0}
                      className={`${styles.historyItem} ${currentSessionId === session.id ? styles.historyActive : ''}`}
                      onClick={() => loadSession(session)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          loadSession(session);
                        }
                      }}
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
                    </div>
                  ))}
                </>
              )}
            </div>
        </div>
      </Drawer>

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
              {messages.map((msg, index) => (
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
                      loading && index === messages.length - 1 && !msg.content?.trim() ? (
                        <div className={styles.thinkingBubble}>
                          <span /><span /><span />
                        </div>
                      ) : (
                        <ReactMarkdown components={{ p: ({ children }) => <>{children}</> }}>{msg.content}</ReactMarkdown>
                      )
                    ) : (
                      msg.content
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && !hasPendingAssistantMessage && (
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
          <button
            className={styles.plusBtn}
            onClick={() => setChartPickerOpen(true)}
            title="Select birth chart"
            aria-label="Select birth chart"
          >
            <AddCircleOutlineIcon sx={{ fontSize: '1.2rem' }} />
          </button>
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
              className={styles.historyMiniBtn}
              onClick={() => setSidebarOpen(true)}
              aria-label="Open chat history"
              title="Chat history"
            >
              <HistoryIcon sx={{ fontSize: '1.05rem' }} />
            </button>
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
        {selectedChart ? (
          <div className={styles.selectedChartRow}>
            <Chip
              size="small"
              label={`Chart: ${selectedChart.label || selectedChart.birthPlace || 'Selected'}`}
              onDelete={() => {
                setSelectedChartId(null);
                if (currentSessionId) updateSessionChart(currentSessionId, null);
              }}
              sx={{
                bgcolor: 'rgba(124, 58, 237, 0.14)',
                border: '1px solid rgba(124, 58, 237, 0.28)',
                color: '#ddd6fe',
              }}
            />
          </div>
        ) : null}
        {hasMessages && (
          <p className={styles.disclaimer}>AI Astrologer can make mistakes. Verify important readings.</p>
        )}
      </div>

      <Dialog
        open={chartPickerOpen}
        onClose={closeChartPicker}
        fullScreen={isMobile}
        fullWidth
        maxWidth="sm"
        PaperProps={{ className: styles.chartDialog }}
      >
        <DialogTitle className={styles.chartDialogTitle}>
          Select Birth Chart
          <IconButton onClick={closeChartPicker} size="small" sx={{ color: '#94a3b8' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers className={styles.chartDialogContent}>
          {charts.length === 0 ? (
            <div className={styles.noChartState}>
              <p>No birth charts found.</p>
            </div>
          ) : (
            charts.map((chart: BirthChart) => (
              <button
                key={chart.$id}
                className={`${styles.chartItem} ${selectedChartId === chart.$id ? styles.chartItemActive : ''}`}
                onClick={() => {
                  setSelectedChartId(chart.$id);
                  if (currentSessionId) updateSessionChart(currentSessionId, chart.$id);
                  closeChartPicker();
                }}
              >
                <span className={styles.chartItemTitle}>{chart.label || 'Untitled Chart'}</span>
                <span className={styles.chartItemMeta}>
                  {chart.birthDate} • {chart.birthTime || '--:--'} • {chart.birthPlace}
                </span>
              </button>
            ))
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
