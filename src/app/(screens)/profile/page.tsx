'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useAuth } from '@/context/auth-context';
import { logout } from '@/lib/auth';
import styles from './page.module.scss';
import { CircularProgress } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import FavoriteIcon from '@mui/icons-material/Favorite';
import PublicIcon from '@mui/icons-material/Public';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import NumbersIcon from '@mui/icons-material/Numbers';

const ThreeBackground = dynamic(() => import('@/components/home/three-background'), { ssr: false });

const features = [
  {
    icon: <PublicIcon />,
    title: 'Birth Chart',
    description: 'View your full natal chart with planetary positions.',
    href: '/birthchart',
    color: '#60a5fa',
  },
  {
    icon: <AutoAwesomeIcon />,
    title: 'Daily Horoscope',
    description: 'Personalized cosmic insights for today.',
    href: '/horoscope',
    color: '#eab308',
  },
  {
    icon: <FavoriteIcon />,
    title: 'Compatibility',
    description: 'Compare charts with your partner or friends.',
    href: '/compatibility',
    color: '#f472b6',
  },
  {
    icon: <CalendarMonthIcon />,
    title: 'Retrograde Alerts',
    description: 'Get notified of upcoming planetary retrogrades.',
    href: '/alerts',
    color: '#a78bfa',
  },
  {
    icon: <ChatBubbleOutlineIcon />,
    title: 'AI Astrologer',
    description: 'Chat with our cosmic AI for personalized guidance.',
    href: '/chat',
    color: '#8b5cf6',
  },
  {
    icon: <AutoStoriesIcon />,
    title: 'Zodiac Library',
    description: 'Explore traits, myths, and secrets of the twelve signs.',
    href: '/zodiac',
    color: '#10b981',
  },
  {
    icon: <WorkOutlineIcon />,
    title: 'Career & Wealth',
    description: 'Understand your vocational potential and financial abundance.',
    href: '/career',
    color: '#6366f1',
  },
  {
    icon: <NumbersIcon />,
    title: 'Numerology',
    description: 'Decode the secret vibrations of your name and birth date.',
    href: '/numerology',
    color: '#f59e0b',
  },
];

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [loadingRoute, setLoadingRoute] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
    if (user?.displayName) setDisplayName(user.displayName);
  }, [user, loading, router]);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const handleNavigate = (href: string) => {
    setLoadingRoute(href);
    router.push(href);
  };

  if (loading || !user) return null;

  return (
    <div className={styles.page}>
      <ThreeBackground />

      <div className={styles.container}>
        {/* Profile Card */}
        <motion.div
          className={styles.profileCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className={styles.avatarWrapper}>
            {user.photoURL ? (
              <Image
                src={user.photoURL}
                alt={user.displayName ?? 'avatar'}
                width={80}
                height={80}
                className={styles.avatar}
              />
            ) : (
              <div className={styles.avatarFallback}>
                <AccountCircleIcon sx={{ fontSize: 80, color: '#a490c2' }} />
              </div>
            )}
          </div>

          <h1 className={styles.name}>{user.displayName ?? 'Explorer'}</h1>
          <p className={styles.email}>{user.email}</p>
          <span className={styles.badge}>
            <AutoAwesomeIcon sx={{ fontSize: 12 }} /> Premium Member
          </span>

          <div className={styles.meta}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Provider</span>
              <span className={styles.metaValue}>
                {user.providerData[0]?.providerId === 'google.com' ? 'Google' : 'Email'}
              </span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Member since</span>
              <span className={styles.metaValue}>
                {user.metadata.creationTime
                  ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                  : '—'}
              </span>
            </div>
          </div>

          <button className={styles.logoutBtn} onClick={handleLogout}>
            <LogoutIcon fontSize="small" /> Sign Out
          </button>
        </motion.div>

        {/* Features Grid */}
        <div className={styles.featuresGrid}>
          <h2 className={styles.sectionTitle}>Your Cosmic Tools</h2>
          <div className={styles.grid}>
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                onClick={() => handleNavigate(f.href)}
                className={styles.featureCard}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * i }}
                style={{ cursor: 'pointer', position: 'relative' }}
              >
                {loadingRoute === f.href && (
                  <div className={styles.cardLoaderOverlay}>
                    <CircularProgress size={28} sx={{ color: f.color }} />
                  </div>
                )}
                <div className={styles.featureIcon} style={{ color: f.color, background: `${f.color}18` }}>
                  {f.icon}
                </div>
                <h3>{f.title}</h3>
                <p>{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
