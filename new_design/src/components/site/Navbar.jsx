import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

import { useSiteContent } from '@/lib/useSiteContent';
import { useTheme } from '@/lib/ThemeContext';

export default function Navbar() {
  const { content } = useSiteContent('navbar');
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const navBg = theme?.nav?.bg || 'rgba(255,255,255,0.92)';
  const textColor = theme?.nav?.textColor || '#1a1a1a';
  const logoColor = theme?.nav?.logoColor || '#e91e63';
  const navStyle = theme?.nav?.style || 'default';
  const isGlass = navStyle === 'glassmorphism' || navStyle === 'transparent-elegant';

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 shadow-sm"
      style={{
        background: navBg,
        backdropFilter: isGlass ? 'blur(12px)' : undefined,
        WebkitBackdropFilter: isGlass ? 'blur(12px)' : undefined,
        borderBottom: `1px solid ${textColor}18`,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt={content.logo_text || 'BalloonCraft KC'}
              className="h-14 w-auto object-contain"
            />
            <span className="sr-only">{content.logo_text || 'BalloonCraft KC'}</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {(content.links || []).map((link, index) => {
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={index}
                  to={link.href}
                  className="px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200"
                  style={{
                    color: isActive
                      ? (navStyle === 'pill' ? '#fff' : logoColor)
                      : textColor,
                    background: isActive
                      ? (navStyle === 'pill' ? `${logoColor}` : `${logoColor}22`)
                      : 'transparent',
                    borderBottom:
                      navStyle === 'serif-bar' || navStyle === 'deco'
                        ? (isActive ? `2px solid ${logoColor}` : '2px solid transparent')
                        : undefined,
                    borderRadius:
                      navStyle === 'serif-bar' || navStyle === 'deco'
                        ? 0
                        : undefined,
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <button
            type="button"
            className="md:hidden p-2 rounded-lg"
            style={{ color: textColor }}
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div
          className="md:hidden border-t pb-4"
          style={{ background: navBg, borderColor: `${textColor}18` }}
        >
          {(content.links || []).map((link, index) => (
            <Link
              key={index}
              to={link.href}
              onClick={() => setOpen(false)}
              className="block px-6 py-3 font-semibold text-sm transition-colors"
              style={{
                color: location.pathname === link.href ? logoColor : textColor,
                background:
                  location.pathname === link.href ? `${logoColor}15` : 'transparent',
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
