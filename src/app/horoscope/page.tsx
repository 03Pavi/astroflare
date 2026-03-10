'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Container, Skeleton } from '@mui/material';
import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '@/context/auth-context';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { fetchUserCharts } from '@/store/slices/charts-slice';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ExploreIcon from '@mui/icons-material/Explore';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import FavoriteIcon from '@mui/icons-material/Favorite';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Link from 'next/link';
import styles from './page.module.scss';
import { signs } from '@/constants/zodiac';

const ThreeBackground = dynamic(() => import('@/components/home/three-background'), { ssr: false });

export default function HoroscopePage() {
  const { user, loading: authLoading } = useAuth();
  const dispatch = useAppDispatch();
  const { charts, loading: chartsLoading } = useAppSelector((state) => state.charts);

  const [selectedSign, setSelectedSign] = useState<string | null>(null);
  const [horoscopeData, setHoroscopeData] = useState<any>(null);
  const [fetchingHoroscope, setFetchingHoroscope] = useState(false);

  useEffect(() => {
    if (user) {
      dispatch(fetchUserCharts(user.uid));
    }
  }, [user, dispatch]);

  useEffect(() => {
    if (charts.length > 0 && !selectedSign) {
      const primaryChart = charts[0];
      if (primaryChart.sunSign) {
        setSelectedSign(primaryChart.sunSign);
      }
    }
  }, [charts, selectedSign]);

  useEffect(() => {
    if (selectedSign) {
      getHoroscope(selectedSign);
    }
  }, [selectedSign]);

  const getHoroscope = async (sign: string) => {
    setFetchingHoroscope(true);
    try {
      const res = await fetch('/api/daily-horoscope', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sign })
      });
      const data = await res.json();
      setHoroscopeData(data);
    } catch (error) {
      console.error('Failed to fetch horoscope:', error);
      setHoroscopeData({ error: "Celestial alignments are fuzzy. Please try again later." });
    } finally {
      setFetchingHoroscope(false);
    }
  };

  if (authLoading) return null;

  const currentSignData = signs.find(s => s.name.toLowerCase() === selectedSign?.toLowerCase());

  // Determine if we should show structured sections or raw markdown
  const showStructured = horoscopeData?.overall && horoscopeData?.career && horoscopeData?.love;
  const rawContent = horoscopeData?.response || horoscopeData?.horoscope || horoscopeData?.error;

  return (
    <div className={styles.page}>
      <ThreeBackground />
      <div className={styles.gridOverlay} />

      <Container maxWidth="lg" className={styles.container}>
        <div className={styles.header}>
          <motion.div
            className={styles.aiBadge}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <AutoAwesomeIcon fontSize="small" />
            <span>Daily Insights</span>
          </motion.div>
          <h1>Daily Horoscope</h1>
          <p>Personalized celestial guidance based on your sun sign.</p>
        </div>

        {!selectedSign && !chartsLoading ? (
          <motion.div
            className={styles.noSign}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <ExploreIcon sx={{ fontSize: '3rem', color: '#94a3b8', mb: 2 }} />
            <h2>No Birth Sign Found</h2>
            <p>Create a birth chart to get personalized daily horoscopes, or select a sign below.</p>
            <div className={styles.actions}>
              <Link href="/birthchart" className={styles.primaryBtn}>Create Birth Chart</Link>
            </div>

            <div className={styles.signPicker}>
              <h3>Browse All Signs</h3>
              <div className={styles.signGrid}>
                {signs.map(s => (
                  <button
                    key={s.name}
                    className={styles.signSmallBtn}
                    onClick={() => setSelectedSign(s.name)}
                  >
                    {s.icon}
                    <span>{s.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <div className={styles.horoscopeContent}>
            <div className={styles.signSelector}>
              {signs.map(s => (
                <button
                  key={s.name}
                  className={`${styles.signTab} ${selectedSign?.toLowerCase() === s.name.toLowerCase() ? styles.active : ''}`}
                  onClick={() => setSelectedSign(s.name)}
                >
                  {s.name}
                </button>
              ))}
            </div>

            <motion.div
              key={selectedSign}
              className={styles.horoscopeCard}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className={styles.cardHeader}>
                <div className={styles.signIconWrapper}>
                  <div className={styles.mainSignIcon}>
                    {currentSignData?.icon || <AutoAwesomeIcon />}
                    <div className={styles.sparkleIcon}>
                      <AutoAwesomeIcon sx={{ fontSize: '1rem' }} />
                    </div>
                  </div>
                </div>
                <div className={styles.signInfo}>
                  <div className={styles.titleRow}>
                    <h2>{selectedSign}</h2>
                    <span className={styles.kanyaBadge}>{currentSignData?.name}</span>
                  </div>
                  <div className={styles.dateRow}>
                    <AutoAwesomeIcon sx={{ fontSize: '0.9rem', color: '#a78bfa' }} />
                    <span>{currentSignData?.date} • Today</span>
                  </div>
                </div>
              </div>

              {fetchingHoroscope ? (
                <div className={styles.skeletonContainer}>
                  <div className={styles.lagnaSkeleton}>
                    <Skeleton variant="rectangular" width="100%" height={60} sx={{ borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.03)' }} />
                  </div>
                  <div className={styles.sectionSkeleton}>
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className={styles.skeletonItem}>
                        <div className={styles.skeletonHeader}>
                          <Skeleton variant="circular" width={40} height={40} sx={{ bgcolor: 'rgba(255,255,255,0.03)' }} />
                          <Skeleton variant="text" width="60%" height={30} sx={{ bgcolor: 'rgba(255,255,255,0.03)' }} />
                        </div>
                        <Skeleton variant="text" width="90%" height={20} sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.03)' }} />
                        <Skeleton variant="text" width="70%" height={20} sx={{ bgcolor: 'rgba(255,255,255,0.03)' }} />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className={styles.reading}>
                  {horoscopeData?.lagna && (
                    <div className={styles.lagnaBox}>
                      <div className={styles.lagnaIcon}>
                        <ExploreIcon sx={{ fontSize: '1.2rem' }} />
                      </div>
                      <div className={styles.lagnaInfo}>
                        <label>Today's Lagna</label>
                        <p>{horoscopeData.lagna}</p>
                      </div>
                    </div>
                  )}

                  {!showStructured && rawContent ? (
                    <div className={styles.markdownContent}>
                      <ReactMarkdown>{rawContent}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className={styles.sections}>
                      <div className={styles.section}>
                        <div className={styles.sectionIcon} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                          <ElectricBoltIcon />
                        </div>
                        <div className={styles.sectionContent}>
                          <h3>Overall Energy</h3>
                          {horoscopeData?.overall_quote && <p className={styles.quote}>"{horoscopeData.overall_quote}"</p>}
                          <div className={styles.markdownDesc}>
                            <ReactMarkdown>{horoscopeData?.overall || rawContent}</ReactMarkdown>
                          </div>
                        </div>
                      </div>

                      <div className={styles.section}>
                        <div className={styles.sectionIcon} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                          <BusinessCenterIcon />
                        </div>
                        <div className={styles.sectionContent}>
                          <h3>Career</h3>
                          {horoscopeData?.career_quote && <p className={styles.quote}>"{horoscopeData.career_quote}"</p>}
                          <div className={styles.markdownDesc}>
                            <ReactMarkdown>{horoscopeData?.career || 'Focus on your immediate tasks for steady progress today.'}</ReactMarkdown>
                          </div>
                        </div>
                      </div>

                      <div className={styles.section}>
                        <div className={styles.sectionIcon} style={{ background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899' }}>
                          <FavoriteIcon />
                        </div>
                        <div className={styles.sectionContent}>
                          <h3>Love</h3>
                          {horoscopeData?.love_quote && <p className={styles.quote}>"{horoscopeData.love_quote}"</p>}
                          <div className={styles.markdownDesc}>
                            <ReactMarkdown>{horoscopeData?.love || 'Connection with others brings warmth and understanding.'}</ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <Link href={`/zodiac/${selectedSign?.toLowerCase()}`} className={styles.learnMore}>
                <div className={styles.learnMoreContent}>
                  <InfoOutlinedIcon />
                  <span>Learn more about {selectedSign} traits</span>
                </div>
                <ArrowForwardIcon />
              </Link>
            </motion.div>
          </div>
        )}
      </Container>
    </div>
  );
}
