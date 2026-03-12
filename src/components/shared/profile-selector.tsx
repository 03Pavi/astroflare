'use client';

import React from 'react';
import { useZodiac } from '@/context/zodiac-context';
import { useAppSelector } from '@/store/hooks';
import { type BirthChart } from '@/lib/charts';
import styles from './profile-selector.module.scss';
import PersonIcon from '@mui/icons-material/Person';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { signs } from '@/constants/zodiac';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProfileSelector() {
  const { activeChart, setActiveChart } = useZodiac();
  const { charts, loading } = useAppSelector((state) => state.charts);

  if (loading || charts.length === 0) return null;

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.iconBox}>
          <PersonIcon sx={{ fontSize: '1rem' }} />
        </div>
        <span>Switch Profile</span>
      </div>

      <div className={styles.grid}>
        {charts.map((chart: BirthChart) => {
          const isActive = activeChart?.$id === chart.$id;
          const signData = signs.find(s => s.name.toLowerCase() === chart.sunSign?.toLowerCase());

          return (
            <motion.button
              key={chart.$id}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveChart(chart)}
              className={`${styles.item} ${isActive ? styles.active : ''}`}
            >
              <div
                className={styles.avatar}
                style={{ background: signData?.color ? `${signData.color}20` : 'rgba(255,255,255,0.05)' }}
              >
                {signData?.icon || <AutoAwesomeIcon sx={{ fontSize: '0.9rem' }} />}
              </div>
              <div className={styles.info}>
                <span className={styles.name}>{chart.label}</span>
                <span className={styles.sign}>{chart.sunSign} Sun</span>
              </div>
              {isActive && (
                <div className={styles.activeDot} style={{ backgroundColor: signData?.color || '#a78bfa' }} />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
