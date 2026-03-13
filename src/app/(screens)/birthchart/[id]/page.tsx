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
        setChart({ ...found, details });
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

  const { details } = chart;
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
            <h1>Celestial <span>Synthesis</span></h1>
          </div>
          <div className={styles.actions}>
            <button className={styles.btnOutline} onClick={handleDownloadPDF}>Export Data</button>
            <button className={styles.btnPrimary}>Comprehensive Analysis</button>
          </div>
        </motion.div>

        <div ref={reportRef} className={styles.reportBody}>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={4}>
              <motion.div className={styles.chartPanel} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                  {details.chart_svg ? (
                    <div className={styles.svgWrapper} dangerouslySetInnerHTML={{ __html: details.chart_svg }} />
                  ) : (
                    <div className={styles.svgWrapper}>
                      <NatalChart details={details} />
                    </div>
                  )}
              </motion.div>
            </Grid>

            <Grid item xs={12} lg={8}>
              <div className={styles.rightCol}>
                <div className={styles.statsTiles}>
                  {[
                    { key: 'asc', label: 'ASCENDANT', value: details.ascendant || 'Unknown', icon: 'As' },
                    { key: 'sun', label: 'SOUL SIGNIFICATOR', value: `Sun in ${details.sun_sign || 'Unknown'}`, icon: 'Su' },
                    { key: 'moon', label: 'MIND SIGNIFICATOR', value: `Moon in ${details.moon_sign || 'Unknown'}`, icon: 'Mo' },
                  ].map((item) => (
                    <motion.div
                      key={item.key}
                      className={styles.statTile}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                    >
                      <span className={styles.tileIcon}>{item.icon}</span>
                      <span className={styles.tileLabel}>{item.label}</span>
                      <span className={styles.tileValue}>{item.value}</span>
                    </motion.div>
                  ))}
                </div>

                <motion.div className={styles.tableCard} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
                  <div className={styles.tableHeader}>
                    <h3>Planetary Details</h3>
                    <span className={styles.liveBadge}>LIVE ENGINE</span>
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
                            <td className={styles.degreeTextCyan}>{p.degree.toFixed(2)}&deg;</td>
                            <td className={styles.nakshatraText}>{getDisplayNakshatra(p.sign, p.degree, p.nakshatra)}</td>
                            <td className={styles.houseText}>{p.house}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
