'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined';
import PsychologyAltIcon from '@mui/icons-material/PsychologyAlt';
import TipsAndUpdatesOutlinedIcon from '@mui/icons-material/TipsAndUpdatesOutlined';
import { Container } from '@mui/material';
import { useAuth } from '@/context/auth-context';
import { useZodiac } from '@/context/zodiac-context';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchUserCharts } from '@/store/slices/charts-slice';
import { buildCareerInsight } from '@/lib/career';
import styles from './page.module.scss';

const ThreeBackground = dynamic(() => import('@/components/home/three-background'), { ssr: false });

const OPTIONS = [
  { value: 'overview', label: 'Career direction', icon: <WorkOutlineIcon fontSize="small" /> },
  { value: 'roles', label: 'Career options', icon: <AccountTreeIcon fontSize="small" /> },
  { value: 'wealth', label: 'Money pattern', icon: <PaidOutlinedIcon fontSize="small" /> },
  { value: 'style', label: 'Work style', icon: <PsychologyAltIcon fontSize="small" /> },
] as const;

export default function CareerPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, loading: authLoading } = useAuth();
  const { charts, loading } = useAppSelector((state) => state.charts);
  const { activeChart, setActiveChart } = useZodiac();
  const [selectedChartId, setSelectedChartId] = useState('');
  const [selectedView, setSelectedView] = useState<(typeof OPTIONS)[number]['value']>('overview');

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
      return;
    }
    if (user && charts.length === 0) {
      dispatch(fetchUserCharts(user.uid));
    }
  }, [authLoading, user, charts.length, dispatch, router]);

  useEffect(() => {
    if (activeChart?.$id) {
      setSelectedChartId(activeChart.$id);
    } else if (charts[0]?.$id) {
      setSelectedChartId(charts[0].$id);
    }
  }, [activeChart, charts]);

  const selectedChart = useMemo(
    () => charts.find((chart:any) => chart.$id === selectedChartId) ?? null,
    [charts, selectedChartId]
  );
  const insight = useMemo(
    () => (selectedChart ? buildCareerInsight(selectedChart) : null),
    [selectedChart]
  );
  const activeSection = insight ? insight.sections[selectedView] : null;

  const handleChartChange = (chartId: string) => {
    setSelectedChartId(chartId);
    const chart = charts.find((item:any) => item.$id === chartId) ?? null;
    setActiveChart(chart);
  };

  if (authLoading || loading) return null;

  return (
    <div className={styles.page}>
      <ThreeBackground />
      <div className={styles.overlay} />
      <Container maxWidth="lg" className={styles.container}>
        <motion.div className={styles.panel} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
          <button className={styles.backLink} onClick={() => router.back()}>
            <ArrowBackIcon fontSize="small" />
            <span>Career and Wealth</span>
          </button>

          {charts.length === 0 ? (
            <div className={styles.emptyState}>
              <h2>No chart available</h2>
              <p>Create a birth chart first to unlock career suggestions.</p>
              <button className={styles.primaryButton} onClick={() => router.push('/birthchart')}>Create birth chart</button>
            </div>
          ) : (
            <>
              <div className={styles.topRow}>
                <div className={styles.titleBlock}>
                  <h1>Career Compass</h1>
                  <p className={styles.subtext}>Pick a saved chart and inspect the strongest vocational patterns hidden within your alignment.</p>
                </div>
                <div className={styles.controls}>
                  <label className={styles.control}>
                    <span>Choose chart</span>
                    <select value={selectedChartId} onChange={(event) => handleChartChange(event.target.value)}>
                      {charts.map((chart: any) => (
                        <option key={chart.$id} value={chart.$id}>
                          {chart.label} ({chart.birthDate})
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={styles.control}>
                    <span>Choose insight</span>
                    <select value={selectedView} onChange={(event) => setSelectedView(event.target.value as (typeof OPTIONS)[number]['value'])}>
                      {OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              {insight && activeSection && (
                <div className={styles.content}>
                  <div className={styles.heroCard}>
                    <span className={styles.badge}>Profile: {insight.chartLabel}</span>
                    <h2>{activeSection.title}</h2>
                    <p>{insight.headline}</p>
                  </div>

                  <div className={styles.optionRail}>
                    {OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        className={`${styles.optionButton} ${selectedView === option.value ? styles.optionActive : ''}`}
                        onClick={() => setSelectedView(option.value)}
                      >
                        {option.icon}
                        <span>{option.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className={styles.grid}>
                    <section className={styles.primaryCard}>
                      <h3>Deep Dive Analysis</h3>
                      <p>{activeSection.summary}</p>
                      <ul>
                        {activeSection.bullets.map((bullet) => (
                          <li key={bullet}>{bullet}</li>
                        ))}
                      </ul>
                    </section>

                    <aside className={styles.sideCard}>
                      <div className={styles.sideHeader}>
                        <TipsAndUpdatesOutlinedIcon fontSize="small" />
                        <span>Top Career Matches</span>
                      </div>
                      <div className={styles.pathList}>
                        {insight.topPaths.map((path) => (
                          <span key={path} className={styles.pathTag}>{path}</span>
                        ))}
                      </div>
                      <div className={styles.meta}>
                        <span><strong>Sun</strong><em>{selectedChart?.sunSign || 'Unknown'}</em></span>
                        <span><strong>Moon</strong><em>{selectedChart?.moonSign || 'Unknown'}</em></span>
                        <span><strong>Rising</strong><em>{selectedChart?.risingSign || 'Unknown'}</em></span>
                      </div>
                    </aside>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      </Container>
    </div>
  );
}
