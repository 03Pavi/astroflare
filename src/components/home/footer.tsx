'use client';

import { Box, Typography, Container, Link, Grid } from '@mui/material';

export default function Footer() {
  return (
    <Box sx={{ bgcolor: '#0B0F19', py: 6, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <Container maxWidth="lg">
        <Grid container spacing={4} justifyContent="space-between">
          <Grid item xs={12} md={4}>
            <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600, mb: 2 }}>
              Cosmic Insight
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 300, mb: 4 }}>
              Unlock the secrets of the universe through beautiful, deep, and actionable astrology.
            </Typography>
          </Grid>

          <Grid item xs={12} md={2}>
            <Typography variant="subtitle1" sx={{ color: 'text.primary', fontWeight: 600, mb: 2 }}>
              Explore
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link href="#" color="text.secondary" underline="hover">Horoscopes</Link>
              <Link href="#" color="text.secondary" underline="hover">Birth Charts</Link>
              <Link href="#" color="text.secondary" underline="hover">Tarot</Link>
            </Box>
          </Grid>

          <Grid item xs={12} md={2}>
            <Typography variant="subtitle1" sx={{ color: 'text.primary', fontWeight: 600, mb: 2 }}>
              Company
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link href="#" color="text.secondary" underline="hover">About</Link>
              <Link href="#" color="text.secondary" underline="hover">Privacy</Link>
              <Link href="#" color="text.secondary" underline="hover">Terms</Link>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mt: 8, pt: 4, borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            © {new Date().getFullYear()} Cosmic Insight. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
