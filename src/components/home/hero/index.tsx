'use client';

import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

const ThreeBackground = dynamic(() => import('../three-background'), {
  ssr: false, // Important: Canvas can only run client-side
});

const LightRays = dynamic(() => import('../light-rays'), {
  ssr: false,
});

import HomeIcon from '@mui/icons-material/Home';
import StyleIcon from '@mui/icons-material/Style';
import PublicIcon from '@mui/icons-material/Public';
import SettingsIcon from '@mui/icons-material/Settings';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import DarknessIcon from '@mui/icons-material/Brightness2';
import ExploreIcon from '@mui/icons-material/Explore';
import PersonIcon from '@mui/icons-material/Person';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import styles from './hero.module.scss';
import { heroContent } from '@/constants/hero';
import Dock from '../dock';

export default function Hero() {
  const router = useRouter();

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        color: 'text.primary',
      }}
    >
      <ThreeBackground />
      <div className={styles.gridOverlay} />

      <div className={styles.lightRaysWrapper}>
        <LightRays
          raysOrigin="top-center"
          raysColor="#a490c2"
          raysSpeed={1.5}
          lightSpread={0.8}
          rayLength={3}
          followMouse={true}
          mouseInfluence={0.1}
          noiseAmount={0}
          distortion={0}
          pulsating={true}
          fadeDistance={1}
          saturation={1}
        />
      </div>

      <Box
        sx={{
          width: '100%',
          maxWidth: '1200px',
          mx: 'auto',
          px: { xs: 2, sm: 3 },
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          pt: { xs: 15, md: 12 },
          pb: { xs: 8, md: 4 },
          pr: '0px !important'
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className={styles.badge} style={{ marginBottom: '1.5rem' }}>{heroContent.badge}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '2.5rem', md: '5rem' },
              fontWeight: 800,
              mb: 3,
              maxWidth: '900px',
              mx: 'auto',
              color: '#fff',
              lineHeight: { xs: 1.2, md: 1.1 },
            }}
          >
            {heroContent.titlePart1} <br />
            {heroContent.titlePart2}
          </Typography>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
        >
          <Typography
            variant="h4"
            sx={{
              fontSize: { xs: '1.1rem', md: '1.25rem' },
              color: '#94a3b8',
              mb: 0,
              maxWidth: '600px',
              mx: 'auto',
              fontWeight: 400,
              lineHeight: 1.6,
            }}
          >
            {heroContent.subtitle}
          </Typography>
        </motion.div>

        <motion.div
          className={styles.cardsContainer}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <div className={styles.card}>
            <div className={styles.iconWrapper}>
              <WbSunnyIcon fontSize="medium" />
            </div>
            <h3>{heroContent.features[0].title}</h3>
            <p>{heroContent.features[0].description}</p>
          </div>

          <div className={styles.card}>
            <div className={styles.iconWrapper}>
              <DarknessIcon fontSize="medium" />
            </div>
            <h3>{heroContent.features[1].title}</h3>
            <p>{heroContent.features[1].description}</p>
          </div>

          <div className={styles.card}>
            <div className={styles.iconWrapper}>
              <ExploreIcon fontSize="medium" />
            </div>
            <h3>{heroContent.features[2].title}</h3>
            <p>{heroContent.features[2].description}</p>
          </div>
        </motion.div>
      </Box>

      <Dock
        items={[
          { icon: <HomeIcon fontSize="small" />, label: 'Home', onClick: () => router.push('/') },
          { icon: <WbSunnyIcon fontSize="small" />, label: 'Horoscope', onClick: () => router.push('/horoscope') },
          { icon: <AutoAwesomeIcon fontSize="small" />, label: 'AI Oracle', onClick: () => router.push('/chat') },
          { icon: <PublicIcon fontSize="small" />, label: 'Charts', onClick: () => router.push('/birthchart') },
          { icon: <PersonIcon fontSize="small" />, label: 'Profile', onClick: () => router.push('/profile') },
        ]}
        panelHeight={68}
        baseItemSize={50}
        magnification={70}
      />
    </Box>
  );
}
