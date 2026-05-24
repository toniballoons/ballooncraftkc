import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';

import { isFlashSaleActive, normalizeFlashSale } from '@/lib/flashSale';
import { useSiteContent } from '@/lib/useSiteContent';

import Navbar from './Navbar';
import Footer from './Footer';

export default function SiteLayout() {
  const { content: navContent } = useSiteContent('navbar');
  const [now, setNow] = useState(() => new Date());
  const flashSaleActive = isFlashSaleActive(normalizeFlashSale(navContent.flash_sale), now);

  useEffect(() => {
    if (!flashSaleActive) return undefined;

    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 30000);

    return () => window.clearInterval(timer);
  }, [flashSaleActive]);

  return (
    <div className="min-h-screen flex flex-col">
      <a
        href="#main-content"
        className="skip-link sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-background focus:px-4 focus:py-2 focus:text-foreground focus:shadow-lg"
      >
        Skip to main content
      </a>
      <Navbar />
      <main
        id="main-content"
        data-route-main="true"
        tabIndex={-1}
        className="flex-1 focus:outline-none"
        style={{ paddingTop: flashSaleActive ? '8.75rem' : '5rem' }}
      >
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
