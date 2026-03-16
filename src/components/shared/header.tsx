'use client';

import Link from 'next/link';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import LogoutIcon from '@mui/icons-material/Logout';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import styles from './header.module.scss';
import { usePathname, useRouter } from 'next/navigation';
import { appDetails } from '@/constants/app-details';
import { useAuth } from '@/context/auth-context';
import { logout } from '@/lib/auth';
import { motion, AnimatePresence } from 'framer-motion';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { useState } from 'react';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    { label: 'Home', href: '/' },
    { label: 'Birth Charts', href: '/birthchart' },
    { label: 'Chat with AI', href: '/chat' },
    { label: 'Profile', href: '/profile' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        staggerChildren: 0.05,
        staggerDirection: -1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  };

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
        {/* <div className={styles.divider} /> */}

        <button
          className={styles.menuToggle}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle Menu"
        >
          {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              className={styles.menuOverlay}
              initial="hidden"
              animate="show"
              exit="exit"
              variants={containerVariants}
            >
              {menuItems.map((item, index) => (
                <motion.div key={index} variants={itemVariants}>
                  <Link
                    href={item.href}
                    className={`${styles.menuItem} ${pathname === item.href ? styles.active : ''}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
              {user && (
                <motion.button
                  variants={itemVariants}
                  className={styles.logoutBtnMenu}
                  onClick={handleLogout}
                >
                  <LogoutIcon fontSize="small" />
                  Logout
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
