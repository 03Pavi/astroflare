'use client';

import { use, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Container, Grid, CircularProgress } from '@mui/material';
import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link'; // Added Link import
import { useAuth } from '@/context/auth-context';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { fetchUserCharts } from '@/store/slices/charts-slice';
import { type BirthChart } from '@/lib/charts';
import styles from './report.module.scss';

// Icons
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import NightsStayIcon from '@mui/icons-material/NightsStay';
import ExploreIcon from '@mui/icons-material/Explore';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PlaceIcon from '@mui/icons-material/Place';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

const ThreeBackground = dynamic(() => import('@/components/home/three-background'), { ssr: false });

export default function BirthChartReportPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const chartId = resolvedParams.id;

  const { user, loading: authLoading } = useAuth();
  const dispatch = useAppDispatch();
  const { charts, loading: chartsLoading } = useAppSelector((state) => state.charts);

  const [chart, setChart] = useState<any>(null);

  useEffect(() => {
    if (user) {
      dispatch(fetchUserCharts(user.uid));
    }
  }, [user, dispatch]);

  useEffect(() => {
    if (charts.length > 0) {
      const found = charts.find((c: BirthChart) => c.$id === chartId);
      if (found) {
        // Try to parse chartData if it exists
        let details = {};
        if (found.chartData) {
          try {
            details = JSON.parse(found.chartData);
          } catch (e) {
            console.error("Failed to parse chart data", e);
          }
        }
        setChart({ ...found, details });
      }
    }
  }, [charts, chartId]);

  if (authLoading || (chartsLoading && !chart)) {
    return (
      <div className={styles.loadingPage}>
        <ThreeBackground />
        <CircularProgress sx={{ color: '#7c3aed' }} />
        <p>Consulting the Akashic records...</p>
      </div>
    );
  }

  if (!chart) {
    return (
      <div className={styles.errorPage}>
        <ThreeBackground />
        <h1>Chart Not Found</h1>
        <p>This cosmic map seems to have vanished into a black hole.</p>
      </div>
    );
  }

  const { details } = chart;

  return (
    <div className={styles.page}>
      <ThreeBackground />
      <div className={styles.gridOverlay} />

      <Container maxWidth="lg" className={styles.container}>
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className={styles.badge}>Natal Report</div>
          <h1>{chart.label}'s Cosmic Blueprint</h1>
          <div className={styles.quickInfo}>
            <span><CalendarTodayIcon /> {new Date(chart.birthDate).toLocaleDateString('en-US', { dateStyle: 'long' })}</span>
            <span><AccessTimeIcon /> {chart.birthTime}</span>
            <span><PlaceIcon /> {chart.birthPlace}</span>
          </div>
        </motion.div>

        <Grid container spacing={4} className={styles.mainGrid}>
          {/* Big Three Cards */}
          <Grid item xs={12} md={4}>
            <motion.div className={styles.signCard} whileHover={{ y: -5 }} transition={{ type: 'spring', stiffness: 300 }}>
              <WbSunnyIcon className={styles.sunIcon} />
              <h3>Sun Sign</h3>
              <h2>{chart.sunSign || 'Unknown'}</h2>
              <p>Your core essence, personality, and the divine spark within you.</p>
            </motion.div>
          </Grid>
          <Grid item xs={12} md={4}>
            <motion.div className={styles.signCard} whileHover={{ y: -5 }} transition={{ type: 'spring', stiffness: 300 }}>
              <NightsStayIcon className={styles.moonIcon} />
              <h3>Moon Sign</h3>
              <h2>{chart.moonSign || 'Unknown'}</h2>
              <p>Your emotional landscape, subconscious patterns, and inner world.</p>
            </motion.div>
          </Grid>
          <Grid item xs={12} md={4}>
            <motion.div className={styles.signCard} whileHover={{ y: -5 }} transition={{ type: 'spring', stiffness: 300 }}>
              <ExploreIcon className={styles.risingIcon} />
              <h3>Rising Sign</h3>
              <h2>{chart.risingSign || 'Unknown'}</h2>
              <p>Your social mask, how others perceive you, and your approach to life.</p>
            </motion.div>
          </Grid>

          {/* Detailed Summary */}
          <Grid item xs={12}>
            <motion.div
              className={styles.summaryCard}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className={styles.cardHeader}>
                <AutoAwesomeIcon />
                <h2>Celestial Synthesis</h2>
              </div>
              <div className={styles.summaryContent}>
                <ReactMarkdown>
                  {details.summary || details.response || "No detailed interpretation available for balanced cosmic energies."}
                </ReactMarkdown>
              </div>
            </motion.div>
          </Grid>

          {/* Technical Details */}
          {(details.nakshatra || details.lagna) && (
            <Grid item xs={12}>
              <motion.div
                className={styles.techGrid}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {details.lagna && (
                  <div className={styles.techItem}>
                    <label>Ascendant (Lagna)</label>
                    <span>{details.lagna}</span>
                  </div>
                )}
                {details.nakshatra && (
                  <div className={styles.techItem}>
                    <label>Birth Nakshatra</label>
                    <span>{details.nakshatra}</span>
                  </div>
                )}
                {details.sunSign && (
                  <div className={styles.techItem}>
                    <label>Solar Mansion</label>
                    <span>{details.sunSign}</span>
                  </div>
                )}
              </motion.div>
            </Grid>
          )}
        </Grid>
      </Container>
    </div>
  );
}
