'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { handleOAuthCallback } from '@/lib/auth';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    handleOAuthCallback()
      .then(() => router.replace('/'))
      .catch(() => router.replace('/login'));
  }, [router]);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', color: '#fff', background: '#070a14', fontFamily: 'sans-serif'
    }}>
      <p>Signing you in…</p>
    </div>
  );
}
