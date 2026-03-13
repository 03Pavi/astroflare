'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Skeleton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '@/context/auth-context';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchUserCharts } from '@/store/slices/charts-slice';
import { analyzeCareerByAI, fetchCareerD10, setActiveCareerD10, resetCareerState } from '@/store/slices/career-slice';
import type { BirthChart } from '@/lib/charts';
import styles from './page.module.scss';

type D10Entry = {
  name?: string;
  current_sign?: number;
  house_number?: number;
  isRetro?: string | boolean;
};

const SIGN_NAMES = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces',
];

function extractMarkdown(text: string) {
  const raw = (text || '').trim();
  if (!raw) return '';

  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed?.response === 'string') return parsed.response;
    if (typeof parsed?.answer === 'string') return parsed.answer;
    if (typeof parsed?.text === 'string') return parsed.text;
  } catch {
    // not JSON
  }

  return raw;
}

export default function CareerPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, loading: authLoading } = useAuth();
  const charts = useAppSelector((state) => state.charts.charts) as BirthChart[];
  const chartsLoading = useAppSelector((state) => state.charts.loading);
  const { d10Data, d10ByUser, d10Loading, d10Error, aiText, aiLoading, aiError } = useAppSelector(
    (state) => state.career
  );

  const [selectedChartId, setSelectedChartId] = useState('');

  useEffect(() => {
    if (user?.uid) {
      dispatch(fetchUserCharts(user.uid));
    }
    return () => {
      dispatch(resetCareerState());
    }
  }, [dispatch, user?.uid]);

  useEffect(() => {
    if (!selectedChartId && charts.length > 0) {
      setSelectedChartId(charts[0].$id);
    }
  }, [charts, selectedChartId]);

  const selectedChart = useMemo(
    () => charts.find((chart) => chart.$id === selectedChartId) || null,
    [charts, selectedChartId]
  );

  const selectedCachedD10 = useMemo(() => {
    if (!selectedChart) return null;
    const userId = String(selectedChart.userId ?? '');
    const chartId = String(
      selectedChart.$id ??
      `${selectedChart.birthDate ?? ''}-${selectedChart.birthTime ?? ''}-${selectedChart.label ?? ''}`
    );
    return d10ByUser?.[userId]?.[chartId] ?? null;
  }, [selectedChart, d10ByUser]);

  useEffect(() => {
    if (!selectedChart) return;

    if (selectedCachedD10) {
      dispatch(setActiveCareerD10(selectedCachedD10));
      return;
    }

    dispatch(fetchCareerD10(selectedChart));
  }, [dispatch, selectedChart, selectedCachedD10]);

  const d10Rows = useMemo(() => {
    if (!d10Data || typeof d10Data !== 'object') return [] as D10Entry[];
    return Object.values(d10Data as Record<string, D10Entry>).filter(
      (value) => value && typeof value === 'object' && !!value.name
    );
  }, [d10Data]);

  const topSigns = useMemo(() => {
    const names = [selectedChart?.sunSign, selectedChart?.moonSign, selectedChart?.risingSign]
      .filter(Boolean)
      .map((value) => String(value).toLowerCase());

    return Array.from(new Set(names)).slice(0, 5);
  }, [selectedChart]);

  const aiMarkdown = useMemo(() => extractMarkdown(aiText), [aiText]);

  const runAiAnalysis = () => {
    if (!selectedChart || !d10Data) return;

    dispatch(
      analyzeCareerByAI(d10Data)
    );
  };

  const shareOrPrintAnalysis = async () => {
    if (!selectedChart || !aiMarkdown) return;

    const shareText = [
      `Career Analysis - ${selectedChart.label}`,
      `Sun: ${selectedChart.sunSign || 'Unknown'}`,
      `Moon: ${selectedChart.moonSign || 'Unknown'}`,
      `Rising: ${selectedChart.risingSign || 'Unknown'}`,
      '',
      aiMarkdown,
    ].join('\n');

    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: `${selectedChart.label} Career Analysis`,
          text: shareText,
        });
        return;
      }
    } catch {
      // If user cancels share sheet, do nothing else.
      return;
    }

    try {
      if (typeof window !== 'undefined') {
        window.print();
        return;
      }
    } catch {
      // continue
    }

    try {
      await navigator.clipboard.writeText(shareText);
      alert('Analysis copied to clipboard');
    } catch {
      // no-op
    }
  };

  if (authLoading) return null;

  return (
    <div className={styles.page}>
      <div className={styles.overlay} />

      <Container maxWidth="lg" className={styles.container}>
        <div className={styles.panel}>
          <button className={styles.backLink} onClick={() => router.back()}>
            <ArrowBackIcon fontSize="small" />
            Back
          </button>

          <div className={styles.topRow}>
            <div className={styles.titleBlock}>
              <h1>Career Compass</h1>
              <p className={styles.subtext}>
                Pick a saved chart to inspect vocational patterns and run an AI career analysis.
              </p>
            </div>

            <div className={styles.controls}>
              <label className={styles.control}>
                <span>Choose Chart</span>
                <select
                  value={selectedChartId}
                  onChange={(event) => setSelectedChartId(event.target.value)}
                  disabled={chartsLoading || charts.length === 0}
                >
                  {charts.length === 0 && <option value="">No chart found</option>}
                  {charts.map((chart) => (
                    <option key={chart.$id} value={chart.$id}>
                      {chart.label} ({chart.birthDate})
                    </option>
                  ))}
                </select>
              </label>

              <div className={styles.controlActions}>
                <button
                  className={styles.primaryButton}
                  onClick={runAiAnalysis}
                  disabled={!selectedChart || !d10Data || aiLoading}
                >
                  <AutoAwesomeIcon fontSize="small" />
                  {aiLoading ? 'Analyzing...' : 'Analyze by AI'}
                </button>
                <button
                  className={styles.secondaryButton}
                  onClick={shareOrPrintAnalysis}
                  disabled={!aiMarkdown}
                >
                  Share / Print
                </button>
              </div>
            </div>
          </div>

          {!selectedChart ? (
            <div className={styles.emptyState}>
              <h2>No chart selected</h2>
              <p>Create or pick a birth chart to view D10 career data.</p>
            </div>
          ) : (
            <div className={styles.content}>
              <div className={styles.heroCard}>
                <span className={styles.badge}>Profile: {selectedChart.label}</span>
                <h2>Career Direction</h2>
                <p>
                  {selectedChart.label} has Sun in {selectedChart.sunSign || 'Unknown'}, Moon in{' '}
                  {selectedChart.moonSign || 'Unknown'}, and Rising in{' '}
                  {selectedChart.risingSign || 'Unknown'}.
                </p>
              </div>

              <div className={styles.grid}>
                <div className={styles.primaryCard}>
                  <h3>D10 Career Data</h3>
                  {d10Loading ? (
                    <div>
                      <Skeleton variant="rounded" height={48} />
                      <Skeleton variant="rounded" height={48} sx={{ mt: 1 }} />
                      <Skeleton variant="rounded" height={48} sx={{ mt: 1 }} />
                      <Skeleton variant="rounded" height={48} sx={{ mt: 1 }} />
                    </div>
                  ) : d10Error ? (
                    <p className={styles.errorText}>{d10Error}</p>
                  ) : d10Rows.length === 0 ? (
                    <p>No D10 entries available.</p>
                  ) : (
                    <div className={styles.tableWrap}>
                      <table className={styles.d10Table}>
                        <thead>
                          <tr>
                            <th>Planet</th>
                            <th>Sign</th>
                            <th>House</th>
                            <th>Retro</th>
                          </tr>
                        </thead>
                        <tbody>
                          {d10Rows.map((entry, index) => {
                            const signIndex = Number(entry.current_sign) - 1;
                            const signName = SIGN_NAMES[signIndex] || `Sign ${entry.current_sign ?? '-'}`;
                            const retro =
                              String(entry.isRetro).toLowerCase() === 'true' || entry.isRetro === true
                                ? 'Yes'
                                : 'No';
                            return (
                              <tr key={`${entry.name}-${index}`}>
                                <td>{entry.name || '-'}</td>
                                <td>{signName}</td>
                                <td>{entry.house_number ?? '-'}</td>
                                <td>{retro}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className={styles.sideCard}>
                  <div className={styles.sideHeader}>
                    <WorkOutlineIcon fontSize="small" />
                    Top Career Matches
                  </div>
                  <div className={styles.pathList}>
                    {topSigns.length > 0 ? (
                      topSigns.map((tag) => <span key={tag} className={styles.pathTag}>{tag}</span>)
                    ) : (
                      <span className={styles.pathTag}>No sign data</span>
                    )}
                  </div>

                  <div className={styles.meta}>
                    <span>
                      <strong>Sun</strong>
                      <em>{selectedChart.sunSign || 'Unknown'}</em>
                    </span>
                    <span>
                      <strong>Moon</strong>
                      <em>{selectedChart.moonSign || 'Unknown'}</em>
                    </span>
                    <span>
                      <strong>Rising</strong>
                      <em>{selectedChart.risingSign || 'Unknown'}</em>
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.analysisCard}>
                <div className={styles.analysisHeader}>
                  <LightbulbOutlinedIcon fontSize="small" />
                  <h3>AI Career Analysis</h3>
                </div>

                {aiLoading ? (
                  <div>
                    <Skeleton variant="text" height={36} width="40%" />
                    <Skeleton variant="rounded" height={82} sx={{ mt: 1 }} />
                    <Skeleton variant="rounded" height={82} sx={{ mt: 1 }} />
                  </div>
                ) : aiError ? (
                  <p className={styles.errorText}>{aiError}</p>
                ) : !aiMarkdown ? (
                  <p>Click “Analyze by AI” to generate structured career insights.</p>
                ) : (
                  <div className={styles.markdownBody}>
                    <ReactMarkdown>{aiMarkdown}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
