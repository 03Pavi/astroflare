'use client';

import { use, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Container, Grid, CircularProgress } from '@mui/material';
import dynamic from 'next/dynamic';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import DiamondIcon from '@mui/icons-material/Diamond';
import AirIcon from '@mui/icons-material/Air';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import FavoriteIcon from '@mui/icons-material/Favorite';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import ExploreIcon from '@mui/icons-material/Explore';
import ReactMarkdown from 'react-markdown';
import styles from './sign.module.scss';
import { signs } from '@/constants/zodiac';
import { getZodiacRangesTillToday, getTodayHoroscopeDate } from '@/lib/zodiac';

const ThreeBackground = dynamic(() => import('@/components/home/three-background'), {
  ssr: false,
});

const getElementIcon = (element: string) => {
  switch (element) {
    case 'Fire': return <ElectricBoltIcon />;
    case 'Earth': return <DiamondIcon />;
    case 'Air': return <AirIcon />;
    case 'Water': return <WaterDropIcon />;
    default: return null;
  }
};

export default function SignDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const sign = (signs as any[]).find(s => s.name.toLowerCase() === resolvedParams.slug.toLowerCase());

  const dynamicRanges = getZodiacRangesTillToday();
  const currentDynamicRange = dynamicRanges.find(r => r.name.toLowerCase() === resolvedParams.slug.toLowerCase())?.formatted;
  const todayInfo = getTodayHoroscopeDate();

  const [horoscope, setHoroscope] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sign) {
      fetchHoroscope();
    }
  }, [sign]);

  const fetchHoroscope = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/daily-horoscope', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sign: sign.name })
      });
      const data = await res.json();
      setHoroscope(data.horoscope || data.response || "No horoscope available for today.");
    } catch (error) {
      console.error('Failed to fetch horoscope:', error);
      setHoroscope("Celestial alignments are fuzzy. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const extractFieldValue = (keywords: string[]) => {
    if (!horoscope) return null;
    for (const keyword of keywords) {
      const regex = new RegExp(`\\*\\*[^\\*]*?${keyword}[^\\*]*?\\*\\*:?\\s*([\\s\\S]*?)(?=\\*\\*|$)`, 'i');
      const match = horoscope.match(regex);
      if (match?.[1]) {
        const cleaned = match[1].trim()
          .replace(/^[:\s\*\|\)\(>\-0-9\.]+/, '')
          .replace(/[\n\s]+$/, '');
        if (cleaned && cleaned.length > 3) return cleaned;
      }
    }
    return null;
  };

  const overall = extractFieldValue(['Overall Energy', 'Samanya Shakti', 'General Insight', 'Summary', 'Dainik']);
  const career = extractFieldValue(['Career', 'Karmik Shakti', 'Karyavastha', 'Naukri', 'Business', 'Work']);
  const love = extractFieldValue(['Love', 'Prem', 'Relationship', 'Pyaar', 'Romance']);
  const health = extractFieldValue(['Health', 'Swasthya', 'Fitness']);
  const luck = extractFieldValue(['Lucky Tip', 'Tip', 'Upay', 'Suggestion']);

  const showStructured = !!(overall || career || love || health || luck);

  if (!sign) {
    return (
      <div className={styles.notFound}>
        <ThreeBackground />
        <h1>Cosmic Mystery</h1>
        <p>This zodiac sign has drifted into another dimension.</p>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      <ThreeBackground />
      <div className={styles.gridOverlay} />

      <Container maxWidth="lg" className={styles.container}>
        <Grid container spacing={8} alignItems="center">
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className={styles.badge} style={{ color: sign.color, borderColor: `${sign.color}33`, backgroundColor: `${sign.color}11` }}>
                {getElementIcon(sign.element)}
                {sign.element} Sign
              </div>
              <h1 className={styles.signName}>{sign.name}</h1>
              <span className={styles.dateRange}>{currentDynamicRange || sign.date} • {todayInfo.display}</span>
              <p className={styles.description}>{sign.description}</p>

              <div className={styles.traits}>
                {sign.traits.map((trait: string, i: number) => (
                  <motion.span
                    key={trait}
                    className={styles.traitBadge}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                  >
                    {trait}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          </Grid>

          <Grid item xs={12} md={6}>
            <motion.div
              className={styles.visualContainer}
              initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 1, ease: 'easeOut' }}
            >
              <div className={styles.glowRef} style={{ background: `radial-gradient(circle, ${sign.color}33 0%, transparent 70%)` }} />
              <div className={styles.symbolPlaceholder}>
                <div className={styles.floatingIcon} style={{ color: sign.color }}>
                  {getElementIcon(sign.element)}
                </div>
              </div>
            </motion.div>
          </Grid>
        </Grid>

        {/* Daily Horoscope Section */}
        <motion.div
          className={styles.horoscopeSection}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className={styles.horoscopeHeader}>
            <AutoAwesomeIcon />
            <h2>Daily Horoscope</h2>
          </div>
          <div className={styles.horoscopeCard}>
            {loading ? (
              <div className={styles.loader}>
                <CircularProgress size={40} sx={{ color: sign.color }} />
                <p>Consulting the heavens...</p>
              </div>
            ) : showStructured ? (
              <div className={styles.sections}>
                {overall && (
                  <div className={styles.section}>
                    <div className={styles.sectionIcon} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                      <ElectricBoltIcon />
                    </div>
                    <div className={styles.sectionContent}>
                      <h3>Overall Energy</h3>
                      <div className={styles.markdownDesc}>
                        <ReactMarkdown>{overall}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                )}
                {career && (
                  <div className={styles.section}>
                    <div className={styles.sectionIcon} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                      <BusinessCenterIcon />
                    </div>
                    <div className={styles.sectionContent}>
                      <h3>Career</h3>
                      <div className={styles.markdownDesc}>
                        <ReactMarkdown>{career}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                )}
                {love && (
                  <div className={styles.section}>
                    <div className={styles.sectionIcon} style={{ background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899' }}>
                      <FavoriteIcon />
                    </div>
                    <div className={styles.sectionContent}>
                      <h3>Love</h3>
                      <div className={styles.markdownDesc}>
                        <ReactMarkdown>{love}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                )}
                {health && (
                  <div className={styles.section}>
                    <div className={styles.sectionIcon} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                      <AutoAwesomeIcon />
                    </div>
                    <div className={styles.sectionContent}>
                      <h3>Health</h3>
                      <div className={styles.markdownDesc}>
                        <ReactMarkdown>{health}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                )}
                {luck && (
                  <div className={styles.section}>
                    <div className={styles.sectionIcon} style={{ background: 'rgba(234, 179, 8, 0.1)', color: '#eab308' }}>
                      <ExploreIcon />
                    </div>
                    <div className={styles.sectionContent}>
                      <h3>Lucky Tip</h3>
                      <div className={styles.markdownDesc}>
                        <ReactMarkdown>{luck}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className={styles.horoscopeText}>{horoscope}</p>
            )}
          </div>
        </motion.div>
      </Container>
    </div>
  );
}
