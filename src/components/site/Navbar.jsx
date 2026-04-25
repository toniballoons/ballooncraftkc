import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSiteContent } from '@/lib/useSiteContent';
import { useTheme } from '@/lib/ThemeContext';
import { useAuth } from '@/lib/AuthContext';
import { Menu, X, LayoutDashboard, LogOut } from 'lucide-react';

export default function Navbar() {
  const { content } = useSiteContent('navbar');
  const { theme } = useTheme();
  const { isAuthenticated, logout } = useAuth();
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
        <div className="flex items-center justify-between h-24">

          {/* Logo + tagline bubble */}
          <Link to="/" className="flex flex-col items-center gap-1 flex-shrink-0">
            <img
              src="/logo.png"
              alt={content.logo_text || 'BalloonCraft KC'}
              className="h-16 w-auto object-contain"
              style={{ maxWidth: '180px' }}
            />
              <span
                className="text-[10px] font-black tracking-wide px-3 py-0.5 rounded-full whitespace-nowrap"
                style={{
                  background: '#000',
                  color: '#fff',
                  textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.4), 0 0 0 1.5px rgba(255,255,255,0.3)',
                }}
              >
                Custom Balloon Decor
              </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {(content.links || []).map((link, i) => {
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={i}
                  to={link.href}
                  className="px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200"
                  style={{
                    color: isActive ? (navStyle === 'pill' ? '#fff' : logoColor) : textColor,
                    background: isActive ? `${logoColor}22` : 'transparent',
                    borderBottom: navStyle === 'serif-bar' || navStyle === 'deco'
                      ? (isActive ? `2px solid ${logoColor}` : '2px solid transparent')
                      : undefined,
                    borderRadius: navStyle === 'serif-bar' || navStyle === 'deco' ? 0 : undefined,
                  }}
                >
                  {link.label}
                </Link>
              );
            })}

            {/* Admin controls — only shown when logged in */}
            {isAuthenticated && (
              <div className="flex items-center gap-1 ml-2 pl-2 border-l" style={{ borderColor: `${textColor}30` }}>
                <Link
                  to="/admin"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all"
                  style={{ background: '#fff', color: '#111', borderColor: 'rgba(0,0,0,0.15)' }}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Admin
                </Link>
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all hover:opacity-80"
                  style={{ background: '#fff', color: '#111', borderColor: 'rgba(0,0,0,0.15)' }}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            className="md:hidden p-2 rounded-lg"
            style={{ color: textColor }}
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div
          className="md:hidden border-t pb-4"
          style={{ background: navBg, borderColor: `${textColor}18` }}
        >
          {(content.links || []).map((link, i) => (
            <Link
              key={i}
              to={link.href}
              onClick={() => setOpen(false)}
              className="block px-6 py-3 font-semibold text-sm transition-colors"
              style={{
                color: location.pathname === link.href ? logoColor : textColor,
                background: location.pathname === link.href ? `${logoColor}15` : 'transparent',
              }}
            >
              {link.label}
            </Link>
          ))}

          {/* Mobile admin controls */}
          {isAuthenticated && (
            <>
              <div className="mx-6 my-2 border-t" style={{ borderColor: `${textColor}20` }} />
              <Link
                to="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-6 py-3 font-semibold text-sm"
                style={{ color: logoColor }}
              >
                <LayoutDashboard className="w-4 h-4" /> Admin Panel
              </Link>
              <button
                onClick={() => { setOpen(false); logout(); }}
                className="flex items-center gap-2 px-6 py-3 font-semibold text-sm w-full text-left"
                style={{ color: textColor }}
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
