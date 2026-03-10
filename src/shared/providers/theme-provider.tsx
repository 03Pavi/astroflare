'use client';

import { ThemeProvider as MUIThemeProvider, CssBaseline } from '@mui/material';
import theme from '@/theme/theme';
import { ReactNode } from 'react';

export default function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <MUIThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MUIThemeProvider>
  );
}
