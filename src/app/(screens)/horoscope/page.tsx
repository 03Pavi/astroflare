'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Container, Skeleton } from '@mui/material';
import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '@/context/auth-context';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { fetchUserCharts } from '@/store/slices/charts-slice';
import { fetchHoroscope } from '@/store/slices/horoscope-slice';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ExploreIcon from '@mui/icons-material/Explore';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import FavoriteIcon from '@mui/icons-material/Favorite';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import Link from 'next/link';
import { useRef } from 'react';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { IconButton } from '@mui/material';
import styles from './page.module.scss';
import { signs } from '@/constants/zodiac';
import { getZodiacRangesTillToday, getTodayHoroscopeDate } from '@/lib/zodiac';
import Image from 'next/image';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import WbSunnyIcon from '@mui/icons-material/WbSunny';

const ThreeBackground = dynamic(() => import('@/components/home/three-background'), { ssr: false });

function UserProfileBanner({ user, primarySunSign, primarySignData }: {
  user: any;
  primarySunSign: string | null;
  primarySignData: any;
}) {
  if (!user) return null;
  return (
    <motion.div
      className={styles.profileBanner}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className={styles.profileBannerLeft}>
        {user.photoURL ? (
          <Image
            src={user.photoURL}
            alt={user.displayName ?? 'avatar'}
            width={44}
            height={44}
            className={styles.profileAvatar}
          />
        ) : (
          <div className={styles.profileAvatarFallback}>
            <AccountCircleIcon sx={{ fontSize: 44, color: '#a490c2' }} />
          </div>
        )}
        <div className={styles.profileInfo}>
          <span className={styles.profileName}>{user.displayName ?? 'Explorer'}</span>
          <span className={styles.profileEmail}>{user.email}</span>
        </div>
      </div>
      {primarySunSign && (
        <div className={styles.profileSignBadge}>
          <WbSunnyIcon sx={{ fontSize: '1rem', color: primarySignData?.color || '#f59e0b' }} />
          <span style={{ color: primarySignData?.color || '#f59e0b' }}>{primarySunSign} Sun</span>
          <span className={styles.signIcon}>{primarySignData?.icon}</span>
        </div>
      )}
    </motion.div>
  );
}

export default function HoroscopePage() {
  const { user, loading: authLoading } = useAuth();
  const dispatch = useAppDispatch();
  const { charts, loading: chartsLoading } = useAppSelector((state) => state.charts);
  const { data: persistentHoroscopeData, loading: fetchingHoroscope } = useAppSelector((state) => state.horoscope);
  const [selectedSign, setSelectedSign] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - 200 : scrollLeft + 200;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

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
      const today = new Date().toISOString().split('T')[0];
      const cached = persistentHoroscopeData[selectedSign.toLowerCase()];

      if (!cached || cached.lastFetched !== today) {
        dispatch(fetchHoroscope(selectedSign));
      }
    }
  }, [selectedSign, persistentHoroscopeData, dispatch]);

  const primarySunSign = charts.length > 0 ? (charts[0] as any).sunSign ?? null : null;
  const primarySignData = signs.find(s => s.name.toLowerCase() === primarySunSign?.toLowerCase());

  if (authLoading) return null;

  const horoscopeData = selectedSign ? persistentHoroscopeData[selectedSign.toLowerCase()]?.horoscope : null;
  const currentSignData = signs.find(s =>
    s.name.toLowerCase() === selectedSign?.toLowerCase() ||
    s.sanskritName.toLowerCase() === selectedSign?.toLowerCase()
  );

  // Determine if we should show structured sections or raw markdown
  const rawContent = horoscopeData?.response || horoscopeData?.horoscope || horoscopeData?.error;

  // More robust extraction logic
  const extractFieldValue = (keywords: string[]) => {
    if (!rawContent) return null;
    for (const keyword of keywords) {
      // Look for bolded headers containing the keyword
      // Supports types like **Keyword:**, **Hindi (Keyword):**, **Keyword**
      // Stops at the next bolded header **
      const regex = new RegExp(`\\*\\*[^\\*]*?${keyword}[^\\*]*?\\*\\*:?\\s*([\\s\\S]*?)(?=\\*\\*|$)`, 'i');
      const match = rawContent.match(regex);
      if (match?.[1]) {
        const cleaned = match[1].trim()
          .replace(/^[:\s\*\|\)\(>\-0-9\.]+/, '') // Clear junk at start (including numbers like 1.)
          .replace(/[\n\s]+$/, ''); // Clear junk at end

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

      <Container maxWidth="lg" className={styles.container}>
        <div className={styles.header}>
          <UserProfileBanner user={user} primarySunSign={primarySunSign} primarySignData={primarySignData} />
          <motion.div
            className={styles.aiBadge}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <AutoAwesomeIcon fontSize="small" />
            <span>Daily Insights</span>
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
            <div className={styles.selectorWrapper}>
              <IconButton className={styles.scrollBtn} onClick={() => scroll('left')} size="small">
                <ChevronLeftIcon />
              </IconButton>
              <div className={styles.signSelector} ref={scrollRef}>
                {signs.map(s => (
                  <button
                    key={s.name}
                    className={`${styles.signTab} ${selectedSign?.toLowerCase() === s.name.toLowerCase() || selectedSign?.toLowerCase() === s.sanskritName.toLowerCase() ? styles.active : ''}`}
                    onClick={() => setSelectedSign(s.name)}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
              <IconButton className={styles.scrollBtn} onClick={() => scroll('right')} size="small">
                <ChevronRightIcon />
              </IconButton>
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
                    <h2>{(currentSignData as any)?.sanskritName || selectedSign}</h2>
                    <span className={styles.kanyaBadge}>{currentSignData?.name}</span>
                  </div>
                  <div className={styles.dateRow}>
                    <AutoAwesomeIcon sx={{ fontSize: '0.9rem', color: '#a78bfa' }} />
                    <span>{todayInfo.display}</span>
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
                  <div className={styles.signNature}>
                    <p className={styles.signDescription}>{(currentSignData as any)?.description}</p>
                    <div className={styles.traits}>
                      {(currentSignData as any)?.traits?.map((trait: string) => (
                        <span key={trait} className={styles.traitBadge} style={{ borderColor: (currentSignData as any)?.color + '40', color: (currentSignData as any)?.color }}>
                          {trait}
                        </span>
                      ))}
                    </div>
                  </div>

                  {lagna && (
                    <div className={styles.lagnaBox}>
                      <div className={styles.lagnaIcon}>
                        <ExploreIcon sx={{ fontSize: '1.2rem' }} />
                      </div>
                      <div className={styles.lagnaInfo}>
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
                            {horoscopeData?.career_quote && <p className={styles.quote}>"{horoscopeData.career_quote}"</p>}
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
                            {horoscopeData?.love_quote && <p className={styles.quote}>"{horoscopeData.love_quote}"</p>}
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
