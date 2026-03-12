'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Container, Skeleton, IconButton } from '@mui/material';
import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '@/context/auth-context';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { fetchUserCharts } from '@/store/slices/charts-slice';
import { fetchHoroscope } from '@/store/slices/horoscope-slice';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ExploreIcon from '@mui/icons-material/Explore';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import SyncIcon from '@mui/icons-material/Sync';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PeopleIcon from '@mui/icons-material/People';
import FavoriteIcon from '@mui/icons-material/Favorite';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import Link from 'next/link';
import Image from 'next/image';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import styles from './page.module.scss';
import { signs } from '@/constants/zodiac';
import { getZodiacRangesTillToday, getTodayHoroscopeDate } from '@/lib/zodiac';
import { useZodiac } from '@/context/zodiac-context';

const ThreeBackground = dynamic(() => import('@/components/home/three-background'), { ssr: false });

function UserProfileBanner({ user, activeChart, charts }: {
  user: any;
  activeChart: any;
  charts: any[];
}) {
  const router = useRouter();
  const { setActiveChart } = useZodiac();
  const [showSwitcher, setShowSwitcher] = useState(false);

  if (!user) return null;

  const currentSignData = signs.find(s => s.name.toLowerCase() === activeChart?.sunSign?.toLowerCase());

  return (
    <motion.div
      className={styles.profileBanner}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className={styles.profileBannerMain}>
        <div className={styles.bannerLeftSection}>
          <button className={styles.backBtnWrapper} onClick={() => router.back()}>
            <ArrowBackIcon sx={{ fontSize: '1.2rem' }} />
          </button>

          <div className={styles.profileBannerLeft}>
            {user.photoURL ? (
              <Image
                src={user.photoURL}
                alt={user.displayName ?? 'avatar'}
                width={36}
                height={36}
                className={styles.profileAvatar}
              />
            ) : (
              <div className={styles.profileAvatarFallback}>
                <AccountCircleIcon sx={{ fontSize: 36, color: '#a490c2' }} />
              </div>
            )}
            <div className={styles.profileInfo}>
              <span className={styles.profileName}>{user.displayName ?? 'Explorer'}</span>
              <span className={styles.profileEmail}>{user.email}</span>
            </div>
          </div>
        </div>

        <div className={styles.profileBannerRight}>
          <AnimatePresence mode="wait">
            {!showSwitcher ? (
              <div className={styles.controlsGroup}>
                <motion.div
                  key="badge"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={styles.currentSignBadge}
                >
                  <WbSunnyIcon sx={{ fontSize: '1rem', color: '#f59e0b' }} />
                  <span>{activeChart?.sunSign || 'Unknown'} Sun</span>
                  <span className={styles.signEmoji}>{currentSignData?.icon}</span>
                </motion.div>

                <motion.button
                  key="switchBtn"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={styles.profileSwitchBtn}
                  onClick={() => setShowSwitcher(true)}
                >
                  <PeopleIcon sx={{ fontSize: '1.1rem' }} />
                  <span>Switch Profile</span>
                </motion.button>
              </div>
            ) : (
              <motion.div
                key="switcher"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={styles.horizontalSwitcher}
              >
                {charts.map((chart) => (
                  <button
                    key={chart.$id}
                    className={`${styles.switcherItem} ${activeChart?.$id === chart.$id ? styles.switcherActive : ''}`}
                    onClick={() => {
                      setActiveChart(chart);
                      setShowSwitcher(false);
                    }}
                  >
                    <span>{chart.label}</span>
                  </button>
                ))}
                <button className={styles.closeSwitcher} onClick={() => setShowSwitcher(false)}>
                  <CloseIcon sx={{ fontSize: '1rem' }} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

export default function HoroscopePage() {
  const dispatch = useAppDispatch();
  const { user, loading: authLoading } = useAuth();
  const { charts, loading: chartsLoading } = useAppSelector((state) => state.charts);
  const { persistentHoroscopeData, horoscopeLoading } = useAppSelector((state) => ({
    persistentHoroscopeData: state.horoscope?.data || {},
    horoscopeLoading: state.horoscope?.loading || false
  }));
  const { activeChart } = useZodiac();
  const [selectedSign, setSelectedSign] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      dispatch(fetchUserCharts());
    }
  }, [user, dispatch]);

  useEffect(() => {
    if (activeChart?.sunSign) {
      setSelectedSign(activeChart.sunSign);
    }
  }, [activeChart]);

  useEffect(() => {
    if (selectedSign) {
      const today = new Date().toISOString().split('T')[0];
      const cached = persistentHoroscopeData[selectedSign.toLowerCase()];

      if (!cached || cached.lastFetched !== today) {
        dispatch(fetchHoroscope(selectedSign));
      }
    }
  }, [selectedSign, persistentHoroscopeData, dispatch]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth / 2 : scrollLeft + clientWidth / 2;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  if (authLoading) return null;

  const horoscopeData = selectedSign ? persistentHoroscopeData[selectedSign.toLowerCase()]?.horoscope : null;
  const currentSignData = signs.find(s =>
    s.name.toLowerCase() === selectedSign?.toLowerCase() ||
    s.sanskritName.toLowerCase() === selectedSign?.toLowerCase()
  );

  const rawContent = horoscopeData?.response || horoscopeData?.horoscope || horoscopeData?.error;

  const extractFieldValue = (keywords: string[]) => {
    if (!rawContent) return null;
    for (const keyword of keywords) {
      const regex = new RegExp(`\\*\\*[^\\*]*?${keyword}[^\\*]*?\\*\\*:?\\s*([\\s\\S]*?)(?=\\*\\*|$)`, 'i');
      const match = rawContent.match(regex);
      if (match?.[1]) {
        const cleaned = match[1].trim()
          .replace(/^[:\s\*\|\)\(>\-0-9\.]+/, '')
          .replace(/[\n\s]+$/, '');
        if (cleaned && cleaned.length > 3) return cleaned;
      }
    }
    return null;
  };

  const overall = horoscopeData?.overall || extractFieldValue(['Overall Energy', 'Samanya Shakti', 'General Insight', 'Summary', 'Dainik']);
  const career = horoscopeData?.career || extractFieldValue(['Career', 'Karmik Shakti', 'Karyavastha', 'Naukri', 'Business', 'Work']);
  const love = horoscopeData?.love || extractFieldValue(['Love', 'Prem', 'Relationship', 'Pyaar', 'Romance']);
  const health = horoscopeData?.health || extractFieldValue(['Health', 'Swasthya', 'Fitness']);
  const luck = horoscopeData?.luck || extractFieldValue(['Lucky Tip', 'Tip', 'Upay', 'Suggestion']);
  const lagna = horoscopeData?.lagna && !horoscopeData.lagna.includes('not specified') ? horoscopeData.lagna : null;

  const showStructured = !!(overall || career || love || health || luck);
  const dynamicRanges = getZodiacRangesTillToday();
  const currentDynamicRange = dynamicRanges.find(r => r.name.toLowerCase() === selectedSign?.toLowerCase())?.formatted;
  const todayInfo = getTodayHoroscopeDate();

  return (
    <div className={styles.page}>
      <ThreeBackground />
      <div className={styles.gridOverlay} />

      <Container maxWidth="md" className={styles.container}>
        <UserProfileBanner user={user} activeChart={activeChart} charts={charts} />

        <div className={styles.header}>
          <motion.div
            className={styles.aiBadge}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <AutoAwesomeIcon fontSize="small" sx={{ mr: 1 }} />
            <span>DAILY INSIGHTS</span>
          </motion.div>
          <h1>Daily Horoscope</h1>
          <p>Celestial insights for {todayInfo.full}</p>
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
                  <button key={s.name} className={styles.signSmallBtn} onClick={() => setSelectedSign(s.name)}>
                    {s.icon} <span>{s.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <div className={styles.horoscopeContent}>
            <div className={styles.selectorWrapper}>
              <IconButton className={styles.scrollBtn} onClick={() => scroll('left')} size="small" sx={{ color: '#fff' }}>
                <ChevronLeftIcon />
              </IconButton>
              <div className={styles.signSelector} ref={scrollRef}>
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
              <IconButton className={styles.scrollBtn} onClick={() => scroll('right')} size="small" sx={{ color: '#fff' }}>
                <ChevronRightIcon />
              </IconButton>
            </div>

            <motion.div
              key={selectedSign}
              className={styles.horoscopeCard}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
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

                <div className={styles.headerInfo}>
                  <div className={styles.signTitleRow}>
                    <h1>{selectedSign}</h1>
                    {currentSignData?.sanskritName && (
                      <span className={styles.sanskritName}>{currentSignData.sanskritName}</span>
                    )}
                  </div>
                  <div className={styles.dateMeta}>
                    <ExploreIcon />
                    <span>{currentDynamicRange || currentSignData?.date} — {currentSignData?.symbol}</span>
                  </div>
                </div>
              </div>

              {horoscopeLoading ? (
                <div className={styles.loader}>
                  <Skeleton variant="text" width="100%" height={30} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
                  <Skeleton variant="text" width="90%" height={30} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
                  <Skeleton variant="text" width="95%" height={30} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
                </div>
              ) : (
                <div className={styles.contentBody}>
                  {lagna && (
                    <div className={styles.lagnaBox}>
                      <div className={styles.lagnaItem}>
                        <label>Today's Lagna</label>
                        <p>{lagna}</p>
                      </div>
                    </div>
                  )}

                  {!showStructured && rawContent ? (
                    <div className={styles.markdownContent}>
                      <ReactMarkdown>{rawContent}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className={styles.sections}>
                      {overall && (
                        <div className={styles.section}>
                          <div className={styles.sectionIcon} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                            <ElectricBoltIcon />
                          </div>
                          <div className={styles.sectionContent}>
                            <h3>Overall Energy</h3>
                            {horoscopeData?.overall_quote && <p className={styles.quote}>"{horoscopeData.overall_quote}"</p>}
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
                    </div>
                  )}
                </div>
              )}

              <Link href={`/zodiac/${selectedSign?.toLowerCase()}`} className={styles.learnMore}>
                <div className={styles.learnMoreContent}>
                  <InfoOutlinedIcon />
                  <span>Learn more about {selectedSign} traits</span>
                </div>
                <ArrowForwardIosIcon />
              </Link>
            </motion.div>
          </div>
        )}
      </Container>
    </div>
  );
}
