'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useAppDispatch } from '@/store/hooks';
import { setUser, appLogout } from '@/store/slices/user-slice';

export default function AuthBridge() {
  const { user, loading } = useAuth();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!loading) {
      if (user) {
        dispatch(setUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL
        }));
      } else {
        dispatch(appLogout());
      }
    }
  }, [user, loading, dispatch]);

  return null;
}
