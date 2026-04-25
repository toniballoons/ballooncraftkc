import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

// ThemeContext now handles CSS var application — no need to do it here too
export default function SiteLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 bg-transparent overflow-hidden">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
