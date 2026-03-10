'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { Container } from '@mui/material';
import { signs, zodiacHeader } from '@/constants/zodiac';
import styles from './zodiac.module.scss';

export default function Zodiac() {
  return (
    <section className={styles.zodiacSection}>
      <Container maxWidth="lg">
        <div className={styles.header}>
          <div className={styles.titleWrapper}>
            <h2>{zodiacHeader.title}</h2>
            <p>{zodiacHeader.subtitle}</p>
          </div>
          <Link href="/zodiac" className={styles.viewAll}>
            View all 12 signs <ArrowForwardIosIcon sx={{ fontSize: 12 }} />
          </Link>
        </div>

        <div className={styles.grid}>
          {signs.slice(0, 7).map((sign, index) => (
            <motion.div
              key={sign.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
            >
              <Link href={`/zodiac/${sign.name.toLowerCase()}`} className={styles.card} data-element={sign.element.toLowerCase()}>
                <div className={styles.elementTag}>{sign.element}</div>
                <div className={styles.iconWrapper}>{sign.icon}</div>
                <h3>{sign.name}</h3>
                <span>{sign.date}</span>
              </Link>
            </motion.div>
          ))}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.35 }}
          >
            <Link href="/zodiac" className={styles.viewAllCard}>
              <span>All signs <ArrowForwardIosIcon sx={{ fontSize: 16 }} /></span>
            </Link>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
