'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import styles from './page.module.scss';
import GoogleIcon from '@mui/icons-material/Google';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import { loginWithGoogle, signupWithEmail } from '@/lib/auth';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';

const ThreeBackground = dynamic(() => import('@/components/home/three-background'), { ssr: false });

export default function SignupPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && !authLoading) {
      router.replace('/');
    }
  }, [user, authLoading, router]);

  if (authLoading || user) {
    return null; // Or a loading spinner
  }

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signupWithEmail(email, password);
      router.replace('/');
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('User already exists, use another email');
      } else {
        setError(err.message || 'Signup failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    setError('');
    try {
      await loginWithGoogle();
      router.replace('/');
    } catch (err: unknown) {
      setError((err as Error).message || 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <ThreeBackground />
      <div className={styles.gridOverlay} />

      <motion.div
        className={styles.card}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
      >
        <h1 className={styles.title}>Begin Your Journey</h1>
        <p className={styles.subtitle}>
          Create an account to unlock your personalized cosmic wisdom and celestial insights.
        </p>

        {error && <p className={styles.error}>{error}</p>}

        <form className={styles.form} onSubmit={handleEmailSignup}>
          <div className={styles.inputWrapper}>
            <EmailIcon className={styles.inputIcon} />
            <input
              type="email"
              placeholder="Email"
              required
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className={styles.inputWrapper}>
            <LockIcon className={styles.inputIcon} />
            <input
              type="password"
              placeholder="Password"
              required
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Creating Account…' : 'Sign Up'}
          </button>
        </form>

        <div className={styles.divider}><span>or</span></div>

        <button className={styles.googleBtn} onClick={handleGoogleSignup} disabled={loading}>
          <GoogleIcon sx={{ color: '#ea4335' }} />
          Continue with Google
        </button>

        <p className={styles.footerLink}>
          Already have an account? <Link href="/login">Sign In</Link>
        </p>
      </motion.div>
    </div>
  );
}
