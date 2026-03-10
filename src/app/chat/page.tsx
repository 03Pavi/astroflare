'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Container, CircularProgress } from '@mui/material';
import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '@/context/auth-context';
import { useAppSelector } from '@/store/hooks';
import SendIcon from '@mui/icons-material/Send';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PersonIcon from '@mui/icons-material/Person';
import styles from './page.module.scss';

const ThreeBackground = dynamic(() => import('@/components/home/three-background'), { ssr: false });

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatPage() {
  const { user } = useAuth();
  const { charts } = useAppSelector((state) => state.charts);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Greetings, seeker. I am your celestial guide. You can ask me anything about your birth chart, daily influences, or general astrological mysteries."
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Find the primary chart (if any) to provide context
      const primaryChart = charts[0];
      const chartContext = primaryChart ? JSON.stringify(primaryChart) : null;

      const res = await fetch('/api/ask-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userMessage.content,
          chartData: chartContext
        })
      });

      const data = await res.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || data.answer || "The stars are silent right now. Please try again soon."
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I've lost my connection to the ether. Please check your internet and try again."
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <ThreeBackground />
      <div className={styles.gridOverlay} />

      <Container maxWidth="md" className={styles.container}>
        <div className={styles.chatHeader}>
          <div className={styles.aiBadge}>
            <AutoAwesomeIcon />
            <span>Cosmic AI</span>
          </div>
          <h1>AI Astrologer</h1>
          <p>Get personalized insights and answers to your cosmic questions.</p>
        </div>

        <div className={styles.chatBox} ref={scrollRef}>
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={msg.role === 'user' ? styles.userMsg : styles.aiMsg}
              >
                <div className={styles.avatar}>
                  {msg.role === 'user' ? <PersonIcon /> : <AutoAwesomeIcon />}
                </div>
                <div className={styles.bubble}>
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.loading}>
              <CircularProgress size={20} sx={{ color: '#7c3aed' }} />
              <span>Channelling cosmic energy...</span>
            </motion.div>
          )}
        </div>

        <form className={styles.inputArea} onSubmit={handleSend}>
          <input
            type="text"
            placeholder="Ask anything about the stars..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button type="submit" disabled={!input.trim() || loading}>
            <SendIcon />
          </button>
        </form>
      </Container>
    </div>
  );
}
