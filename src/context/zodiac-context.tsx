'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { type BirthChart } from '@/lib/charts';
import { useAppSelector } from '@/store/hooks';

interface ZodiacContextType {
  activeChart: BirthChart | null;
  setActiveChart: (chart: BirthChart | null) => void;
}

const ZodiacContext = createContext<ZodiacContextType | undefined>(undefined);

export function ZodiacProvider({ children }: { children: ReactNode }) {
  const { charts } = useAppSelector((state) => state.charts);
  const [activeChart, setActiveChart] = useState<BirthChart | null>(null);

  // Load from localStorage or default to first chart
  useEffect(() => {
    const savedId = localStorage.getItem('activeChartId');
    if (savedId && charts.length > 0) {
      const savedChart = charts.find((c: BirthChart) => c.$id === savedId);
      if (savedChart) {
        setActiveChart(savedChart);
        return;
      }
    }

    if (charts.length > 0 && !activeChart) {
      setActiveChart(charts[0]);
    }
  }, [charts]);

  useEffect(() => {
    if (activeChart) {
      localStorage.setItem('activeChartId', activeChart.$id);
    }
  }, [activeChart]);

  return (
    <ZodiacContext.Provider value={{ activeChart, setActiveChart }}>
      {children}
    </ZodiacContext.Provider>
  );
}

export function useZodiac() {
  const context = useContext(ZodiacContext);
  if (context === undefined) {
    throw new Error('useZodiac must be used within a ZodiacProvider');
  }
  return context;
}
