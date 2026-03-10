'use client';

import { Box, Container, Grid } from '@mui/material';
import { motion } from 'framer-motion';
import Link from 'next/link';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import FavoriteIcon from '@mui/icons-material/Favorite';
import StyleIcon from '@mui/icons-material/Style';
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import PublicIcon from '@mui/icons-material/Public';
import { featuresContent } from '@/constants/features';
import styles from './features.module.scss';
import TiltedCard from '../tilted-card';

export default function Features() {
  return (
    <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: 'transparent' }}>
      <Container maxWidth="lg">
        <Grid container spacing={3} sx={{ alignItems: 'stretch' }}>

          {/* Left Column - Daily Horoscopes */}
          <Grid item xs={12} md={4}>
            <motion.div
              className={styles.card}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className={styles.iconWrapper}>
                <WbSunnyIcon sx={{ color: '#eab308', fontSize: 16 }} />
              </div>
              <h3>{featuresContent.dailyHoroscopes.title}</h3>
              <p>
                {featuresContent.dailyHoroscopes.description}
              </p>

              <Link href="/horoscope" className={styles.link}>
                {featuresContent.dailyHoroscopes.linkText} <ArrowRightAltIcon fontSize="small" />
              </Link>
            </motion.div>
          </Grid>

          {/* Right Column */}
          <Grid item xs={12} md={8}>
            <Grid container spacing={3} sx={{ height: '100%' }}>

              {/* Top Row - Birth Charts */}
              <Grid item xs={12}>
                <motion.div
                  className={styles.card}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  <div className={styles.birthChartTop}>
                    <div>
                      <div className={styles.iconWrapper}>
                        <RadioButtonUncheckedIcon sx={{ color: '#60a5fa', fontSize: 16 }} />
                      </div>
                      <h3>{featuresContent.birthCharts.title}</h3>
                      <p style={{ maxWidth: '400px' }}>
                        {featuresContent.birthCharts.description}
                      </p>
                    </div>
                    <div className={styles.mappingBox}>
                      <PublicIcon sx={{ fontSize: 72, color: 'rgba(255, 255, 255, 0.4)' }} />
                    </div>
                  </div>
                </motion.div>
              </Grid>

              {/* Bottom Row */}
              <Grid item xs={12} sm={6}>
                <motion.div
                  className={styles.card}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <div className={styles.iconWrapper}>
                    <FavoriteIcon sx={{ color: '#f472b6', fontSize: 16 }} />
                  </div>
                  <h3>{featuresContent.compatibility.title}</h3>
                  <p>
                    {featuresContent.compatibility.description}
                  </p>
                </motion.div>
              </Grid>

              <Grid item xs={12} sm={6}>
                <motion.div
                  className={styles.card}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <div className={styles.iconWrapper}>
                    <StyleIcon sx={{ color: '#a78bfa', fontSize: 16 }} />
                  </div>
                  <h3>{featuresContent.tarotReadings.title}</h3>
                  <p>
                    {featuresContent.tarotReadings.description}
                  </p>
                </motion.div>
              </Grid>

            </Grid>
          </Grid>

          {/* Bottom Row - Natal Geometry Analysis Full Width */}
          <Grid item xs={12}>
            <motion.div
              className={styles.card}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              style={{ padding: '2.5rem' }}
            >
              <h3 style={{ fontSize: '1.8rem' }}>{featuresContent.natalGeometry.title}</h3>
              <p style={{ maxWidth: '80%', marginBottom: 0 }}>
                {featuresContent.natalGeometry.description}
              </p>
            </motion.div>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
