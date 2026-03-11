'use client';

import Link from 'next/link';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import styles from './header.module.scss';
import { usePathname, useRouter } from 'next/navigation';
import { appDetails } from '@/constants/app-details';
import { useAuth } from '@/context/auth-context';
import { logout } from '@/lib/auth';
import Image from 'next/image';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const initials = user?.displayName
    ? user.displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'US';

  const isLoginPage = pathname === '/login' ? true : false;

  // Conditionally show back button on specific pages or nested routes
  const pathParts = pathname.split('/').filter(Boolean);
  const showBackButton = pathParts.length > 1 || (pathParts.length === 1 && ['birthchart', 'horoscope', 'zodiac', 'profile'].includes(pathParts[0]));

  return (
    <header className={styles.header}>
      <div className={styles.leftNav}>
        {showBackButton && (
          <button className={styles.backBtn} onClick={() => router.back()} title="Go Back">
            <ArrowBackIcon fontSize="small" />
          </button>
        )}
        <Link href="/" className={styles.logo}>
          <div className={styles.iconWrapper}>
            <AutoAwesomeIcon fontSize="small" />
          </div>
          {appDetails.name}
        </Link>
      </div>

      <div className={styles.nav}>
        <div className={styles.divider} />

        {loading ? null : user ? (
          <>
            <Link href="/birthchart" className={styles.link}>
              Birth Charts
            </Link>
            <Link href="/chat" className={styles.link}>
              AI Astrologer
            </Link>
            <Link href="/profile" className={styles.profileBtn}>
              {user.photoURL ? (
                <Image
                  src={user.photoURL}
                  alt={user.displayName ?? 'avatar'}
                  width={32}
                  height={32}
                  className={styles.avatarImg}
                />
              ) : (
                <div className={styles.avatar}>{initials}</div>
              )}
              {user.displayName?.split(' ')[0] ?? 'Profile'}
            </Link>

            <button className={styles.logoutBtn} onClick={handleLogout} title="Sign out">
              <LogoutIcon fontSize="small" />
            </button>
          </>
        ) : (
          <Link href={isLoginPage ? "/signup" : "/login"} className={styles.profileBtn}>
            <div className={styles.avatar}>
              <PersonIcon fontSize="small" />
            </div>
            {isLoginPage ? "Sign Up" : "Sign In"}
          </Link>
        )}
      </div>
    </header>
  );
}
