'use client';

import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BuildIcon from '@mui/icons-material/Build';
import styles from './page.module.scss';
import { useRouter } from 'next/navigation';

const ThreeBackground = dynamic(() => import('@/components/home/three-background'), { ssr: false });

export default function CompatibilityPage() {
  const router = useRouter();

  return (
    <div className={styles.page}>
      <ThreeBackground />
      <div className={styles.gridOverlay} />

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
            <FavoriteIcon sx={{ fontSize: 40, color: '#f472b6' }} />
          </div>
        </div>

        <h1 className={styles.title}>Cosmic Compatibility</h1>
        <p className={styles.subtitle}>
          The Synastry Engine is currently undergoing calibration. Soon, you'll be able to compare birth charts and deeply analyze dynamic astrological connections.
        </p>

        <div className={styles.constructionBox}>
          <BuildIcon className={styles.pulseIcon} sx={{ color: '#06b6d4', fontSize: 32 }} />
          <span>Development in Progress</span>
        </div>

        <Link href="/profile" className={styles.returnBtn}>
          Return to Dashboard
        </Link>
      </motion.div>
    </div>
  );
}
