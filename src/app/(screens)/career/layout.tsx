'use client';

import { Suspense } from 'react';
import Bot from '@/components/bot';

export default function CareerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        {children}
      </Suspense>
      <Bot />
    </>
  );
}
