import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

// ThemeContext now handles CSS var application — no need to do it here too
export default function SiteLayout() {
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
        className="flex-1 pt-24 bg-transparent overflow-hidden focus:outline-none"
      >
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
