'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { CircularProgress } from '@mui/material';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      const callback = encodeURIComponent(pathname);
      router.replace(`/login?callback=${callback}`);
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#070a14',
        }}
      >
        <CircularProgress sx={{ color: '#a78bfa' }} />
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
