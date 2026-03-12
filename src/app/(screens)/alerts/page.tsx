'use client';

import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ConstructionIcon from '@mui/icons-material/Construction';
import styles from './page.module.scss';
import { useRouter } from 'next/navigation';
import { Container } from '@mui/material';

const ThreeBackground = dynamic(() => import('@/components/home/three-background'), { ssr: false });

export default function RetrogradeAlertsPage() {
  const router = useRouter();

  return (
    <div className={styles.page}>
      <ThreeBackground />
      <div className={styles.gridOverlay} />

      <Container maxWidth="lg" className={styles.container}>
        <motion.div
          className={styles.container}
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, type: 'spring' }}
        >
          <div className={styles.headerRow}>
            <button className={styles.backBtn} onClick={() => router.back()} title="Go Back">
              <ArrowBackIcon fontSize="small" />
            </button>
            <div className={styles.iconWrapper}>
              <CalendarMonthIcon sx={{ fontSize: 40, color: '#a78bfa' }} />
            </div>
          </div>

          <h1 className={styles.title}>Planetary Retrogrades</h1>
          <p className={styles.subtitle}>
            The retrograde notification system is being actively built. Prepare to receive deep cosmic insights about upcoming celestial transits mapped to your natal alignment.
          </p>

          <div className={styles.constructionBox}>
            <ConstructionIcon className={styles.pulseIcon} sx={{ color: '#F59E0B', fontSize: 32 }} />
            <span>Assembling Transit Tools</span>
          </div>

          <Link href="/profile" className={styles.returnBtn}>
            Return to Dashboard
          </Link>
        </motion.div>
      </Container>
    </div>
  );
}
