'use client';

import { use, useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Container, Grid, CircularProgress } from '@mui/material';
import dynamic from 'next/dynamic';
import { useAuth } from '@/context/auth-context';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { fetchUserCharts } from '@/store/slices/charts-slice';
import { type BirthChart } from '@/lib/charts';
import styles from './report.module.scss';

// Icons
import ExploreIcon from '@mui/icons-material/Explore';

import { signs } from '@/constants/zodiac';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import dayjs from 'dayjs';
import NatalChart from '@/components/charts/western-chart';

const NAKSHATRAS = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
  "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
  "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
  "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha",
  "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
];

const SIGN_MAP: Record<string, number> = {
  "Aries": 0, "Taurus": 1, "Gemini": 2, "Cancer": 3, "Leo": 4, "Virgo": 5,
  "Libra": 6, "Scorpio": 7, "Sagittarius": 8, "Capricorn": 9, "Aquarius": 10, "Pisces": 11
};

function getDisplayNakshatra(sign: string, degree: string | number, existingNak?: string) {
  if (existingNak) return existingNak;
  const s = SIGN_MAP[sign] || 0;
  const d = parseFloat(String(degree)) || 0;
  const absLon = (s * 30) + d;
  const index = Math.floor(absLon / (360 / 27));
  return NAKSHATRAS[index % 27];
}

function normalizeDetails(raw: any) {
  if (!raw || typeof raw !== 'object') return {};

  const planets = Array.isArray(raw.planets)
    ? raw.planets
        .filter((planet: any) => planet?.name && planet.name !== 'ayanamsa')
        .map((planet: any) => ({
          ...planet,
          retrograde: Boolean(planet.retrograde),
        }))
    : [];

  return {
    ...raw,
    ascendant: raw.ascendant || raw.rising_sign || '',
    ascendant_degree: raw.ascendant_degree ?? null,
    planets,
    aspects: Array.isArray(raw.aspects) ? raw.aspects : [],
    dashas: Array.isArray(raw.dashas) ? raw.dashas : [],
  };
}

const ThreeBackground = dynamic(() => import('@/components/home/three-background'), { ssr: false });

export default function BirthChartReportPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const chartId = resolvedParams.id;

  const { user, loading: authLoading } = useAuth();
  const dispatch = useAppDispatch();
  const { charts, loading: chartsLoading } = useAppSelector((state) => state.charts);

  const [chart, setChart] = useState<any>(null);
  const [showAllAspects, setShowAllAspects] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;

    // Show loading or something if needed
    const canvas = await html2canvas(reportRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#0B111D',
      logging: false
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`BirthChart_${chart.label}.pdf`);
  };

  useEffect(() => {
    if (user) {
      dispatch(fetchUserCharts(user.uid));
    }
  }, [user, dispatch]);

  useEffect(() => {
    if (charts.length > 0) {
      const found = charts.find((c: BirthChart) => c.$id === chartId);
      if (found) {
        let details = {};
        if (found.chartData) {
          try {
            details = normalizeDetails(JSON.parse(found.chartData));
          } catch (e) {
            console.error("Failed to parse chart data", e);
          }
        }
        setChart({ details });
      }
    }
  }, [charts, chartId]);

  if (authLoading || (chartsLoading && !chart)) {
    return (
      <div className={styles.loadingPage}>
        <ThreeBackground />
        <CircularProgress sx={{ color: '#F59E0B' }} />
      </div>
    );
  }

  if (!chart) {
    return (
      <div className={styles.errorPage}>
        <ThreeBackground />
        <h1>Engine Unavailable</h1>
      </div>
    );
  }

  console.log(chart,'helllo')
  const { details } = chart;

  const getZodiacIcon = (signName: string) => {
    const s = signs.find(s => s.name === signName);
    return s ? s.icon : '✧';
  };

  // Roman numerals for domains (Houses)
  const toRoman = (n: number) => {
    const map = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
    return map[n] || n;
  };

  return (
    <div className={styles.page}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;700&display=swap" rel="stylesheet" />
      <ThreeBackground />
      <div className={styles.gridOverlay} />

      <Container maxWidth="xl" className={styles.container}>
        {/* STELLAR NAVY HEADER */}
        <motion.div
          className={styles.engineHeaderPro}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className={styles.headerContent}>
            <div className={styles.labelRow}>
              <ExploreIcon fontSize="small" sx={{ color: '#06b6d4' }} />
              <span className={styles.label}>CELESTIAL ENGINE PRO</span>
            </div>
            <h1>Celestial Synthesis</h1>
            <div className={styles.subText}>
              Native Chart Analysis &bull; <span>{chart.birthPlace}</span>
            </div>
          </div>
          <div className={styles.actions}>
            <button className={styles.btnOutline} onClick={handleDownloadPDF}>Export Data</button>
            <button className={styles.btnPrimary}>Comprehensive Analysis</button>
          </div>
        </motion.div>

        <div ref={reportRef} style={{ background: '#0B111D', paddingBottom: '2rem' }}>
          <Grid container spacing={3}>
            {/* LEFT COLUMN: Chart + Stats + Details */}
            <Grid item xs={12} lg={8}>
              <Grid container spacing={3}>

                {/* NATAL CHART */}
                <Grid item xs={12} md={6}>
                  <motion.div className={styles.dashboardCard} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                    <div className={styles.cardHeader}>
                      <h2>NATAL CHART (D-1)</h2>
                      <span className={styles.badgeOrange}>NORTH INDIAN</span>
                    </div>
                    {details.chart_svg ? (
                      <div className={styles.svgWrapper} dangerouslySetInnerHTML={{ __html: details.chart_svg }} />
                    ) : (
                      <div className={styles.svgWrapper}>
                        <NatalChart details={details} />
                      </div>
                    )}
                  </motion.div>
                </Grid>

                {/* CORE STATISTICS */}
                <Grid item xs={12} md={6}>
                  <motion.div className={styles.dashboardCard} style={{ display: 'flex', flexDirection: 'column', height: '100%' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                    <div className={styles.cardHeader}>
                      <h2>CORE STATISTICS</h2>
                    </div>
                    <div className={styles.statsList}>
                      <div className={styles.statRow}>
                        <div className={styles.statIcon} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>As</div>
                        <div className={styles.statText}>
                          <span className={styles.statLabel}>ASCENDANT</span>
                          <span className={styles.statValue}>
                            {details.ascendant}
                            {details.ascendant_degree !== null && details.ascendant_degree !== undefined ? (
                              <span className={styles.deg}>{details.ascendant_degree}&deg;</span>
                            ) : null}
                          </span>
                        </div>
                      </div>
                      <div className={styles.statRow}>
                        <div className={styles.statIcon} style={{ background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4' }}>Su</div>
                        <div className={styles.statText}>
                          <span className={styles.statLabel}>SOUL SIGNIFICATOR</span>
                          <span className={styles.statValue}>Sun in {details.sun_sign}</span>
                        </div>
                      </div>
                      <div className={styles.statRow}>
                        <div className={styles.statIcon} style={{ background: 'rgba(148, 163, 184, 0.1)', color: '#cbd5e1' }}>Mo</div>
                        <div className={styles.statText}>
                          <span className={styles.statLabel}>MIND SIGNIFICATOR</span>
                          <span className={styles.statValue}>Moon in {details.moon_sign}</span>
                        </div>
                      </div>
                    </div>
                    <div className={styles.statsFooter}>
                      <span>AYANAMSA: LAHIRI</span>
                      <span>DAY: {(details.day_of_week as string)?.toUpperCase() || 'UNKNOWN'}</span>
                    </div>
                  </motion.div>
                </Grid>

                {/* PLANETARY DETAILS */}
                <Grid item xs={12}>
                  <motion.div className={styles.dashboardCard} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                    <div className={styles.cardHeader} style={{ marginBottom: 0, paddingBottom: 0 }}>
                      <h2>PLANETARY DETAILS</h2>
                      <div className={styles.dots} />
                    </div>
                    <div className={styles.tableResponsive}>
                      <table className={styles.planetTable}>
                        <thead>
                          <tr>
                            <th>PLANET</th>
                            <th>SIGN</th>
                            <th>DEGREE</th>
                            <th>NAKSHATRA</th>
                            <th>HOUSE</th>
                          </tr>
                        </thead>
                        <tbody>
                          {details.planets?.map((p: any) => (
                            <tr key={p.name}>
                              <td className={styles.boldWhite}>{p.name}{p.retrograde ? ' ᴿ' : ''}</td>
                              <td className={styles.signText}>{p.sign}</td>
                              <td className={styles.degreeTextCyan}>{p.degree}&deg;</td>
                              <td className={styles.nakshatraText}>{getDisplayNakshatra(p.sign, p.degree, p.nakshatra)}</td>
                              <td className={styles.houseText}>{p.house}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                </Grid>

              </Grid>
            </Grid>

            {/* RIGHT COLUMN: Geometry + Dasha */}
            <Grid item xs={12} lg={4}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                {/* GEOMETRY (ASPECTS) */}
                <motion.div className={styles.dashboardCard} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                  <div className={styles.cardHeader}>
                    <h2>GEOMETRY</h2>
                    <span className={styles.badgeCyan}>MAJOR ASPECTS</span>
                  </div>
                  <div className={styles.aspectList}>
                    {details.aspects?.slice(0, showAllAspects ? undefined : 3).map((a: any, i: number) => {
                      const orbVal = parseFloat(a.orb);
                      const strength = Math.max(10, 100 - (orbVal * 12));
                      return (
                        <div key={i} className={styles.aspectCardPro}>
                          <div className={styles.aspectTop}>
                            <span className={styles.aspectPair}>{a.body1} &mdash; {a.body2}</span>
                            <span className={styles.aspectType}>{a.type}</span>
                          </div>
                          <div className={styles.aspectMid}>
                            <div className={styles.strengthTrack}>
                              <div className={styles.strengthFill} style={{ width: `${strength}%`, background: strength > 70 ? '#F59E0B' : '#06b6d4' }} />
                            </div>
                          </div>
                          <div className={styles.aspectBot}>
                            <span>STRENGTH: {Math.round(strength)}%</span>
                            <span>ORB: {a.orb}&deg;</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <button className={styles.matrixBtn} onClick={() => setShowAllAspects(!showAllAspects)}>
                    {showAllAspects ? "COLLAPSE VISUALIZATION" : "FULL MATRIX VISUALIZATION"}
                  </button>
                </motion.div>

                {/* VIMSOTTARI DASHA */}
                <motion.div className={styles.dashboardCard} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                  <div className={styles.cardHeader}>
                    <h2>CURRENT VIMSOTTARI DASHA</h2>
                  </div>
                  <div className={styles.dashaList}>
                    {details.dasha?.slice(0, 2).map((d: any, i: number) => {
                      const isActive = i === 0;
                      return (
                        <div key={i} className={`${styles.dashaItem} ${isActive ? styles.dashaActive : ''}`}>
                          <div className={styles.dashaInfo}>
                            <div className={styles.dashaTitle}>{d.planet} {isActive ? 'PERIOD' : 'ANTAR'}</div>
                            <div className={styles.dashaDate}>{isActive ? `Until ${dayjs(d.end).format('MMM YYYY')}` : 'Current Phase'}</div>
                          </div>
                          <div className={styles.dashaSymbol}>{d.planet.substring(0, 2)}</div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>

              </div>
            </Grid>
          </Grid>
        </div>
      </Container>
    </div>
  );
}
