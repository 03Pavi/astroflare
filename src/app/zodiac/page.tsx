'use client';

import { motion } from 'framer-motion';
import { Container } from '@mui/material';
import Link from 'next/link';
import dynamic from 'next/dynamic';

import styles from '@/components/home/zodiac/zodiac.module.scss';
import pageStyles from './page.module.scss';
import { signs } from '@/constants/zodiac';

const ThreeBackground = dynamic(() => import('@/components/home/three-background'), {
  ssr: false,
});

export default function ZodiacSignsPage() {
  return (
    <div className={pageStyles.pageContainer}>
      <ThreeBackground />
      <div className={pageStyles.gridOverlay} />

      <Container maxWidth="lg" className={pageStyles.content}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={pageStyles.header}
        >
          <h1>The Twelve Signs</h1>
          <p>Explore the complete astrological wheel and discover your cosmic blueprint.</p>
        </motion.div>

        <div className={styles.grid}>
          {signs.map((sign, index) => (
            <motion.div
              key={sign.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
            >
              <Link href={`/zodiac/${sign.name.toLowerCase()}`} className={styles.card} data-element={sign.element.toLowerCase()}>
                <div className={styles.elementTag}>{sign.element}</div>
                <div className={styles.iconWrapper}>{sign.icon}</div>
                <h3>{sign.name}</h3>
              </Link>
            </motion.div>
          ))}
        </div>
      </Container>
    </div>
  );
}
