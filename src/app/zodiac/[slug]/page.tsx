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
import styles from './sign.module.scss';

const ThreeBackground = dynamic(() => import('@/components/home/three-background'), {
  ssr: false,
});

const signData: Record<string, any> = {
  aries: { name: 'Aries', date: 'Mar 21 - Apr 19', element: 'Fire', traits: ['Courageous', 'Determined', 'Confident', 'Enthusiastic'], description: 'As the first sign of the zodiac, Aries is always the first to start anything. They are pioneers and leaders, known for their fiery energy and passion.', color: '#ef4444' },
  taurus: { name: 'Taurus', date: 'Apr 20 - May 20', element: 'Earth', traits: ['Reliable', 'Patient', 'Practical', 'Devoted'], description: 'Taurus is an earth sign, represented by the bull. Like their celestial spirit animal, Taureans enjoy relaxing in serene, bucolic environments.', color: '#10b981' },
  gemini: { name: 'Gemini', date: 'May 21 - Jun 20', element: 'Air', traits: ['Adaptable', 'Outgoing', 'Intelligent', 'Curious'], description: 'Gemini is the sign of the twins. They are social butterflies, known for their wit and ability to adapt to any situation with ease.', color: '#3b82f6' },
  cancer: { name: 'Cancer', date: 'Jun 21 - Jul 22', element: 'Water', traits: ['Tenacious', 'Highly Imaginative', 'Loyal', 'Emotional'], description: 'Cancer is a cardinal water sign. Represented by the crab, this oceanic crustacean seamlessly weaves between the sea and shore.', color: '#6366f1' },
  leo: { name: 'Leo', date: 'Jul 23 - Aug 22', element: 'Fire', traits: ['Creative', 'Passionate', 'Generous', 'Warm-hearted'], description: 'Leo is the lion of the zodiac. They are natural leaders, confident and bright, often the center of attention in any room.', color: '#f59e0b' },
  virgo: { name: 'Virgo', date: 'Aug 23 - Sep 22', element: 'Earth', traits: ['Loyal', 'Analytical', 'Kind', 'Hard-working'], description: 'Virgo is an earth sign historically represented by the goddess of wheat and agriculture, an association that speaks to Virgo\'s deep-rooted presence in the material world.', color: '#059669' },
  libra: { name: 'Libra', date: 'Sep 23 - Oct 22', element: 'Air', traits: ['Cooperative', 'Diplomatic', 'Gracious', 'Fair-minded'], description: 'Libra is an air sign represented by the scales, reflecting Libra\'s fixation on balance and harmony.', color: '#ec4899' },
  scorpio: { name: 'Scorpio', date: 'Oct 23 - Nov 21', element: 'Water', traits: ['Resourceful', 'Brave', 'Passionate', 'A true friend'], description: 'Scorpio is a water sign that uses emotional energy as fuel, cultivating powerful wisdom through both the physical and unseen realms.', color: '#7c3aed' },
  sagittarius: { name: 'Sagittarius', date: 'Nov 22 - Dec 21', element: 'Fire', traits: ['Generous', 'Idealistic', 'Great sense of humor'], description: 'Represented by the archer, Sagittarians are always on a quest for knowledge. They love to travel and explore the unknown.', color: '#f43f5e' },
  capricorn: { name: 'Capricorn', date: 'Dec 22 - Jan 19', element: 'Earth', traits: ['Responsible', 'Disciplined', 'Self-control', 'Good managers'], description: 'The last earth sign of the zodiac, Capricorn is represented by the sea-goat, a mythological creature with the body of a goat and the tail of a fish.', color: '#475569' },
  aquarius: { name: 'Aquarius', date: 'Jan 20 - Feb 18', element: 'Air', traits: ['Progressive', 'Original', 'Independent', 'Humanitarian'], description: 'Despite the "aqua" in its name, Aquarius is actually the last air sign of the zodiac. They are intellectuals who value community and progress.', color: '#06b6d4' },
  pisces: { name: 'Pisces', date: 'Feb 19 - Mar 20', element: 'Water', traits: ['Compassionate', 'Artistic', 'Intuitive', 'Gentle', 'Wise'], description: 'Pisces, a water sign, is the last constellation of the zodiac. It\'s symbolized by two fish swimming in opposite directions, representing the constant division of Pisces\'s attention between fantasy and reality.', color: '#8b5cf6' },
};

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
  const sign = signData[resolvedParams.slug];

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

      <Container maxWidth="lg" className={styles.content}>
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
              <span className={styles.dateRange}>{sign.date}</span>
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
            ) : (
              <p className={styles.horoscopeText}>{horoscope}</p>
            )}
          </div>
        </motion.div>
      </Container>
    </div>
  );
}
