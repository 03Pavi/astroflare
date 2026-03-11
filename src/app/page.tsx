'use client';

import Analysis from '@/components/home/analysis';
import Features from '@/components/home/features';
import Footer from '@/components/home/footer';
import Hero from '@/components/home/hero';
import Zodiac from '@/components/home/zodiac';
import styles from './page.module.scss';
import Bot from '@/components/bot';

export default function Page() {
  return (
    <div className={styles.pageWrapper}>
      <main>
        <Hero />
        <Zodiac />
        <Analysis />
        <Features />
      </main>
      <Footer />
      <Bot /> 
    </div>
  );
}