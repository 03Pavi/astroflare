'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FavoriteIcon from '@mui/icons-material/Favorite';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import NightsStayIcon from '@mui/icons-material/NightsStay';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ShareIcon from '@mui/icons-material/Share';
import SyncIcon from '@mui/icons-material/Sync';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import styles from './page.module.scss';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { calculateAshtakoot, AshtakootResult } from '@/lib/ashtakoot';

const ThreeBackground = dynamic(() => import('@/components/home/three-background'), { ssr: false });

// Helper to calculate exact Nakshatra if historic charts didn't save it
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

function extractMoonData(chartDataString?: string) {
  if (!chartDataString) return null;
  try {
    const data = JSON.parse(chartDataString);
    const moon = data.planets?.find((p: any) => p.name === 'Moon');
    if (!moon) return null;

    let nak = moon.nakshatra;
    if (!nak) {
      const s = SIGN_MAP[moon.sign] || 0;
      const d = parseFloat(String(moon.degree)) || 0;
      nak = NAKSHATRAS[Math.floor(((s * 30) + d) / (360 / 27)) % 27];
    }
    return { sign: moon.sign, nakshatra: nak };
  } catch (e) {
    return null;
  }
}

export default function CompatibilityPage() {
  const router = useRouter();
  const { charts } = useAppSelector((state) => state.charts);

  const [chartId1, setChartId1] = useState<string>('');
  const [chartId2, setChartId2] = useState<string>('');
  const [result, setResult] = useState<AshtakootResult | null>(null);

  const handleCalculate = () => {
    if (!chartId1 || !chartId2 || chartId1 === chartId2) return;

    const c1 = charts.find((c: any) => c.$id === chartId1);
    const c2 = charts.find((c: any) => c.$id === chartId2);
    if (!c1 || !c2) return;

    const m1 = extractMoonData(c1.chartData);
    const m2 = extractMoonData(c2.chartData);

    if (m1 && m2) {
      const res = calculateAshtakoot(m1.sign, m1.nakshatra, m2.sign, m2.nakshatra);
      setResult(res);
    }
  };

  const getCompatibilityLevel = (total: number) => {
    if (total >= 26) return { label: 'Excellent Match', color: '#10b981' };
    if (total >= 18) return { label: 'Good Match', color: '#06b6d4' };
    if (total >= 10) return { label: 'Average Match', color: '#f59e0b' };
    return { label: 'Challenging Match', color: '#ef4444' };
  };

  return (
    <div className={styles.page}>
      <ThreeBackground />
      <div className={styles.gridOverlay} />

      <ContainerWrapper>
        <div className={styles.headerRow}>
          <button className={styles.iconBtn} onClick={() => router.back()} title="Go Back">
            <ArrowBackIcon fontSize="small" />
          </button>
          <div className={styles.mainIconWrapper}>
            <FavoriteIcon sx={{ fontSize: 28, color: '#000' }} />
          </div>
          <button className={styles.iconBtn} title="Info">
            <InfoOutlinedIcon fontSize="small" />
          </button>
        </div>

        <h1 className={styles.title}>Synastry <span>Engine</span></h1>
        <p className={styles.subtitle}>
          Traditional Vedic Ashtakoot calculations for deep relationship insights and compatibility analysis.
        </p>

        {!result ? (
          <>
            <div className={styles.selectionLayout}>
              <div className={styles.selectColumn}>
                <label className={styles.labelYellow}>PARTNER 1 (NATIVE)</label>
                <div className={styles.inputWrapper}>
                  <select value={chartId1} onChange={e => setChartId1(e.target.value)}>
                    <option value="">Select a chart...</option>
                    {charts.map((c: any) => (
                      <option key={c.$id} value={c.$id} disabled={c.$id === chartId2}>{c.label} ({c.birthDate})</option>
                    ))}
                  </select>
                  <WbSunnyIcon className={styles.inputIcon} sx={{ color: '#64748b', fontSize: 18 }} />
                </div>
              </div>

              <div className={styles.syncIconBlock}>
                <SyncIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
              </div>

              <div className={styles.selectColumn}>
                <label className={styles.labelCyan}>PARTNER 2</label>
                <div className={styles.inputWrapper}>
                  <select value={chartId2} onChange={e => setChartId2(e.target.value)}>
                    <option value="">Select a chart...</option>
                    {charts.map((c: any) => (
                      <option key={c.$id} value={c.$id} disabled={c.$id === chartId1}>{c.label} ({c.birthDate})</option>
                    ))}
                  </select>
                  <NightsStayIcon className={styles.inputIcon} sx={{ color: '#64748b', fontSize: 18 }} />
                </div>
              </div>
            </div>

            <button
              className={styles.calculateBtnSecondary}
              disabled={!chartId1 || !chartId2 || chartId1 === chartId2}
              onClick={handleCalculate}
            >
              Calculate Compatibility &gt;
            </button>

            <div className={styles.footerTags}>
              <span className={styles.tagYellow}><StarBorderIcon sx={{ fontSize: 14 }} /> 36 GUNAS</span>
              <span className={styles.tagCyan}><StarBorderIcon sx={{ fontSize: 14 }} /> DOSHA ANALYSIS</span>
            </div>
          </>
        ) : (
          <motion.div
            className={styles.resultsContainer}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className={styles.topResultHeader}>
              <span className={styles.resultTypeLabel}>COMPATIBILITY ANALYSIS</span>
              <div className={styles.bigScore}>
                <span className={styles.scoreNumber}>{Math.round(result.total * 10) / 10}</span>
                <span className={styles.scoreMax}>/36</span>
              </div>
              <div className={styles.matchBadge}>
                <StarIcon sx={{ fontSize: 14 }} /> {getCompatibilityLevel(result.total).label.toUpperCase()}
              </div>
            </div>

            <div className={styles.gunasGrid}>
              {['varna', 'vashya', 'tara', 'yoni', 'grahaMaitri', 'gana', 'bhakoot', 'nadi'].map((key) => {
                const guna = (result as any)[key];
                const pct = guna.score / guna.max;
                return (
                  <div key={guna.name} className={styles.gunaCard}>
                    <div className={styles.gunaTop}>
                      <span className={styles.gunaName}>{guna.name.toUpperCase()}</span>
                      <span className={styles.gunaScore}>
                        {guna.score}/{guna.max}
                      </span>
                    </div>
                    <div className={styles.gunaTrack}>
                      <div className={styles.gunaFill} style={{ width: `${Math.max(5, pct * 100)}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>

            <div className={styles.bottomActions}>
              <button className={styles.newComparisonBtn} onClick={() => setResult(null)}>
                New Comparison
              </button>
              <button className={styles.shareBtn}>
                <ShareIcon fontSize="small" />
              </button>
            </div>
          </motion.div>
        )}
      </ContainerWrapper>
    </div>
  );
}

function ContainerWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.scrollWrapper}>
      <motion.div
        className={styles.container}
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, type: 'spring' }}
      >
        {children}
      </motion.div>
    </div>
  );
}
