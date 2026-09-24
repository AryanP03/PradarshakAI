'use client';

import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Globe,
  ChevronDown,
  Menu,
  X,
  MessageSquare,
  Layers,
  Compass,
  MapPin,
  User,
  Calculator,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { UserProfile, getUserProfile, logoutUser } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';
import { SUPPORTED_LANGUAGES, getLanguageConfig } from '@/lib/languages';
import EmblemOfIndia from './EmblemOfIndia';

function NavBarContent() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lang, selectedMode, isAuto, setLang, t } = useLanguage();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  useEffect(() => {
    // 1. Initial render from cached display user to prevent visual layout shifts
    const u = localStorage.getItem('auth_user');
    if (u) {
      try {
        setUser(JSON.parse(u) as UserProfile);
      } catch {}
    }

    // 2. Validate session truth via backend cookie
    getUserProfile()
      .then((profile) => {
        if (profile && !profile.guest) {
          setUser(profile);
          localStorage.setItem('auth_user', JSON.stringify({
            id: profile.id,
            name: profile.name,
            email: profile.email,
            phone: profile.phone,
          }));
        } else {
          setUser(null);
          localStorage.removeItem('auth_user');
        }
      })
      .catch(() => {
        setUser(null);
        localStorage.removeItem('auth_user');
      });
  }, [pathname]);

  useEffect(() => {
    if (langOpen) {
      const close = () => setLangOpen(false);
      window.addEventListener('click', close);
      return () => window.removeEventListener('click', close);
    }
  }, [langOpen]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setMobileOpen(false);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [mobileOpen]);

  // Auto-close mobile drawer if resized to laptop/desktop width (>= 1024px)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  async function logout() {
    await logoutUser();
    setUser(null);
    router.push('/');
  }

  const isActive = (href: string) => {
    const isChatPage = pathname === '/chat' || pathname === '/';
    if (href === '/chat?tab=emi') {
      return isChatPage && searchParams.get('tab') === 'emi';
    }
    if (href === '/chat') {
      return isChatPage && searchParams.get('tab') !== 'emi';
    }
    return pathname === href || (href !== '/' && pathname.startsWith(href));
  };

  const currentLangObj = getLanguageConfig(lang) || SUPPORTED_LANGUAGES[0];

  const navLinks = useMemo(() => [
    { label: t('nav.schemes', 'Explore Schemes'), href: '/schemes', icon: Layers },
    { label: t('nav.find_scheme', 'Find a Scheme'), href: '/find-scheme', icon: Compass },
    { label: t('nav.chat', 'AI Assistant'), href: '/chat', icon: MessageSquare },
    { label: t('nav.emi', 'EMI Calculator'), href: '/chat?tab=emi', icon: Calculator },
    { label: t('nav.partners', 'Partner Locator'), href: '/partners', icon: MapPin },
  ], [t]);

  const [isNavOverflowing, setIsNavOverflowing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const brandRef = useRef<HTMLAnchorElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const measureNavRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animationFrameId: number;

    const checkFit = () => {
      const container = containerRef.current;
      const brand = brandRef.current;
      const measureNav = measureNavRef.current;

      if (!container || !brand) return;

      const containerWidth = container.clientWidth;

      // 1. Exact nav width from off-screen measurement node in current language
      let requiredNavWidth = 0;
      if (measureNav) {
        requiredNavWidth = measureNav.scrollWidth;
      }
      if (requiredNavWidth === 0) {
        // Fallback proportional estimate: ~6.5px per char + 40px (icon + padding + gaps)
        requiredNavWidth = navLinks.reduce(
          (sum, l) => sum + Math.round(l.label.length * 6.5) + 40,
          0
        );
      }

      // 2. Brand width (emblem + title + subtitle if visible)
      const brandWidth = brand.offsetWidth || 160;

      // 3. Desktop controls required width:
      // Language dropdown (~115px) + Auth buttons (~165px) = ~280px
      // If user is logged in: Language (~115px) + Profile/Signout (~145px) = ~260px
      const requiredControlsWidth = user ? 260 : 280;

      // Total needed with comfortable inter-element margins (16px)
      const totalNeeded = brandWidth + requiredNavWidth + requiredControlsWidth + 16;
      const shouldOverflow = totalNeeded > containerWidth;

      setIsNavOverflowing((prev) => (prev !== shouldOverflow ? shouldOverflow : prev));
    };

    const scheduleCheck = () => {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(checkFit);
    };

    scheduleCheck();

    // ResizeObserver for reliable container measurement across all viewports & zoom levels
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      observer = new ResizeObserver(() => {
        scheduleCheck();
      });
      observer.observe(containerRef.current);
    }

    window.addEventListener('resize', scheduleCheck);

    // Re-check once web fonts are fully loaded so character widths are exact
    if (typeof document !== 'undefined' && (document as any).fonts?.ready) {
      (document as any).fonts.ready.then(() => {
        scheduleCheck();
      });
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', scheduleCheck);
      if (observer) {
        observer.disconnect();
      }
    };
  }, [lang, navLinks, user]);

  return (
    <header className="w-full sticky top-0 z-50">
      {/* ── Off-screen measurement element to accurately detect required widths in any language ── */}
      <div
        ref={measureNavRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: -9999,
          left: -9999,
          visibility: 'hidden',
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          whiteSpace: 'nowrap',
          zIndex: -100,
        }}
      >
        {navLinks.map((link) => {
          const Icon = link.icon;
          return (
            <div
              key={link.href}
              className="navbar-nav-link"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '7px 10px',
                fontSize: 12.5,
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              <Icon size={15} style={{ flexShrink: 0 }} />
              <span>{link.label}</span>
            </div>
          );
        })}
      </div>

      {/* ── Main Clean Blue Navbar (Matching Footer #00132b) ─────────── */}
      <div
        className={`material-toolbar ${isNavOverflowing ? 'navbar-collapsed-mode' : ''}`}
        style={{
          background: '#00132b',
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
          width: '100%',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          color: '#ffffff',
        }}
      >
        <div
          ref={containerRef}
          style={{
            maxWidth: 1360,
            margin: '0 auto',
            padding: '0 16px',
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          {/* ── Brand Emblem & Title ───────────────────────────────────────── */}
          <Link
            ref={brandRef}
            href="/home"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              textDecoration: 'none',
              flexShrink: 0,
              minWidth: 0,
            }}
          >
            <div
              style={{
                width: 64,
                height: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                background: '#ffffff',
                borderRadius: 8,
                padding: '2px 4px',
                overflow: 'hidden',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              <img
                src="/Pradarshak_logo_full.jpeg"
                alt="PradarshakAI Logo"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    fontSize: 'clamp(14.5px, 2vw, 16.5px)',
                    fontWeight: 800,
                    color: '#ffffff',
                    letterSpacing: '-0.01em',
                    lineHeight: 1.15,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {t('brand.name', 'PradarshakAI')}
                </span>
              </div>
              <span
                className="hidden xl:inline-block"
                style={{
                  fontSize: 10,
                  color: '#cbd5e1',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.01em',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: 'clamp(160px, 35vw, 360px)',
                }}
              >
                {t('brand.subtitle', 'Ministry of Social Justice and Empowerment')}
              </span>
            </div>
          </Link>

          {/* ── Desktop Navigation Tabs (Light-on-Dark Theme) ──────────────── */}
          <nav ref={navRef} className="navbar-desktop-nav items-center gap-1" style={{ marginLeft: 8 }}>
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="navbar-nav-link"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '7px clamp(8px, 1vw, 12px)',
                    borderRadius: 6,
                    fontSize: 'clamp(12px, 1.1vw, 13px)',
                    fontWeight: active ? 700 : 500,
                    color: active ? '#ffffff' : '#cbd5e1',
                    background: active ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                    transition: 'background-color 120ms ease, color 120ms ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.08)';
                      (e.currentTarget as HTMLElement).style.color = '#ffffff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                      (e.currentTarget as HTMLElement).style.color = '#cbd5e1';
                    }
                  }}
                >
                  <Icon size={15} color={active ? '#ffffff' : '#94a3b8'} style={{ flexShrink: 0 }} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* ── Right Controls: Language Selector & User Auth ───────────────── */}
          <div ref={controlsRef} style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {/* Single Global Language Selector Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLangOpen((prev) => !prev);
                }}
                className="interactive-control focus-ring"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '6px 10px',
                  borderRadius: 6,
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: '#ffffff',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
                aria-label="Select language"
              >
                <Globe size={13} color="#ffdcc2" />
                <span className="max-w-[75px] md:max-w-[110px] truncate">{currentLangObj.nativeName}</span>
                <ChevronDown size={12} style={{ transform: langOpen ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }} />
              </button>

              {langOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    right: 0,
                    width: 190,
                    maxHeight: 360,
                    overflowY: 'auto',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    padding: '4px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                    zIndex: 100,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748b', padding: '4px 8px', textTransform: 'uppercase' }}>
                    {t('nav.select_lang', 'Select Language')}
                  </div>

                  {/* Auto (Detect) Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setLang('auto');
                      setLangOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '7px 10px',
                      borderRadius: 4,
                      fontSize: 12.5,
                      fontWeight: isAuto ? 700 : 500,
                      color: isAuto ? '#003366' : '#334155',
                      background: isAuto ? '#f1f5f9' : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span>Auto (Detect)</span>
                    {isAuto && <span style={{ color: '#003366', fontSize: 12 }}>✓</span>}
                  </button>

                  <div style={{ height: 1, background: '#e2e8f0', margin: '2px 0' }} />

                  {SUPPORTED_LANGUAGES.map((item) => {
                    const isSelected = !isAuto && selectedMode === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setLang(item.id);
                          setLangOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '7px 10px',
                          borderRadius: 4,
                          fontSize: 12.5,
                          fontWeight: isSelected ? 700 : 500,
                          color: isSelected ? '#003366' : '#334155',
                          background: isSelected ? '#f1f5f9' : 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <span>{item.nativeName}</span>
                        {isSelected && <span style={{ color: '#003366', fontSize: 12 }}>✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Desktop Auth Controls (Hidden on mobile/tablets, full horizontal display on laptop/desktop) */}
            {user ? (
              <div className="navbar-desktop-auth items-center gap-2">
                <Link
                  href="/profile"
                  className="btn-bounce focus-ring"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 11px',
                    borderRadius: 6,
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: '#ffffff',
                    background: '#003366',
                    textDecoration: 'none',
                  }}
                >
                  <User size={13} color="#ffdcc2" />
                  <span>{user.name?.split(' ')[0] || 'Citizen'}</span>
                </Link>
                <button
                  onClick={logout}
                  className="btn-bounce focus-ring"
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#ffffff',
                    background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                    border: 'none',
                    boxShadow: '0 2px 6px rgba(220, 38, 38, 0.25)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    transition: 'all 180ms ease',
                  }}
                  title={t('nav.signout', 'Sign Out')}
                >
                  <LogOut size={12} color="#ffffff" />
                  <span className="hidden md:inline">{t('nav.signout', 'Sign Out')}</span>
                </button>
              </div>
            ) : (
              <div className="navbar-desktop-auth items-center gap-2">
                <Link
                  href="/auth"
                  className="btn-bounce focus-ring"
                  style={{
                    fontSize: 12.5,
                    padding: '6px 12px',
                    borderRadius: 6,
                    fontWeight: 600,
                    color: '#ffffff',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <User size={12} color="#ffdcc2" />
                  <span>{t('nav.signin', 'Sign In')}</span>
                </Link>
                <Link
                  href="/register"
                  className="btn-bounce focus-ring"
                  style={{
                    fontSize: 12.5,
                    padding: '6px 14px',
                    borderRadius: 6,
                    fontWeight: 700,
                    color: '#ffffff',
                    background: '#f58220',
                    border: '1px solid transparent',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <ShieldCheck size={13} />
                  <span>{t('nav.register', 'Register')}</span>
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Menu Button (Touch-Friendly >= 44x44px) - Strictly hidden on Laptop/Desktop */}
            <button
              type="button"
              className="navbar-hamburger-btn interactive-control focus-ring"
              onClick={() => setMobileOpen((prev) => !prev)}
              style={{
                width: 42,
                height: 42,
                borderRadius: 8,
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                cursor: 'pointer',
                flexShrink: 0,
              }}
              aria-label={mobileOpen ? 'Close mobile menu' : 'Open navigation menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Navigation Drawer & Backdrop ─────────────────────────── */}
      {mobileOpen && (
        <div className="navbar-mobile-drawer-root" role="dialog" aria-modal="true" aria-label="Mobile navigation">
          {/* Smooth Backdrop Overlay */}
          <div
            className="mobile-nav-backdrop"
            onClick={() => setMobileOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 19, 43, 0.65)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              zIndex: 998,
            }}
          />

          {/* Slide-over Drawer Panel */}
          <div
            className="mobile-nav-drawer"
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: 'min(320px, 86vw)',
              background: '#00132b',
              borderLeft: '1px solid rgba(255, 255, 255, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '-8px 0 28px rgba(0,0,0,0.5)',
              zIndex: 999,
              overflowY: 'auto',
              padding: '20px 18px',
              gap: 16,
            }}
          >
            {/* Drawer Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 56, height: 38, background: '#ffffff', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2px 4px', overflow: 'hidden', boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)' }}>
                  <img
                    src="/Pradarshak_logo_full.jpeg"
                    alt="PradarshakAI Logo"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      display: 'block',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#ffffff' }}>PradarshakAI</span>
                  <span style={{ fontSize: 10, color: '#cbd5e1' }}>Citizen Portal</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 6,
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
                aria-label="Close navigation"
              >
                <X size={18} />
              </button>
            </div>

            {/* Navigation Links */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 14px',
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: active ? 700 : 500,
                      color: active ? '#ffffff' : '#cbd5e1',
                      background: active ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                      textDecoration: 'none',
                      minHeight: 44,
                    }}
                  >
                    <Icon size={18} color={active ? '#fbbf24' : '#94a3b8'} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Profile & Auth Controls Section */}
            <div style={{ paddingTop: 12, borderTop: '1px solid rgba(255, 255, 255, 0.12)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {user ? (
                <>
                  <Link
                    href="/profile"
                    onClick={() => setMobileOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 14px',
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#ffffff',
                      background: 'rgba(0, 51, 102, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      textDecoration: 'none',
                      minHeight: 44,
                    }}
                  >
                    <User size={18} color="#ffdcc2" />
                    <span>{user.name || 'Citizen Profile'}</span>
                  </Link>

                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      logout();
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 8,
                      textAlign: 'center',
                      fontSize: 13.5,
                      fontWeight: 700,
                      color: '#ffffff',
                      background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                      border: 'none',
                      boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      minHeight: 44,
                    }}
                  >
                    <LogOut size={16} color="#ffffff" />
                    <span>{t('nav.signout', 'Sign Out')}</span>
                  </button>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Link
                    href="/auth"
                    onClick={() => setMobileOpen(false)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 8,
                      textAlign: 'center',
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#ffffff',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                      textDecoration: 'none',
                      minHeight: 44,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    <User size={16} color="#ffdcc2" />
                    <span>{t('nav.signin', 'Sign In')}</span>
                  </Link>

                  <Link
                    href="/register"
                    onClick={() => setMobileOpen(false)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 8,
                      textAlign: 'center',
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#ffffff',
                      background: '#f58220',
                      textDecoration: 'none',
                      minHeight: 44,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    <ShieldCheck size={16} />
                    <span>{t('nav.register', 'Register (Verified)')}</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Language Selection Inside Mobile Drawer */}
            <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: '1px solid rgba(255, 255, 255, 0.12)' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 8 }}>
                {t('nav.select_lang', 'Language / भाषा')}
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => {
                    setLang('auto');
                    setMobileOpen(false);
                  }}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: isAuto ? 700 : 500,
                    color: isAuto ? '#fbbf24' : '#cbd5e1',
                    background: isAuto ? 'rgba(251, 191, 36, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    border: isAuto ? '1px solid #fbbf24' : '1px solid rgba(255, 255, 255, 0.1)',
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  Auto
                </button>
                {SUPPORTED_LANGUAGES.slice(0, 7).map((item) => {
                  const isSelected = !isAuto && selectedMode === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setLang(item.id);
                        setMobileOpen(false);
                      }}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: isSelected ? 700 : 500,
                        color: isSelected ? '#fbbf24' : '#cbd5e1',
                        background: isSelected ? 'rgba(251, 191, 36, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                        border: isSelected ? '1px solid #fbbf24' : '1px solid rgba(255, 255, 255, 0.1)',
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      {item.nativeName}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default function NavBar() {
  return (
    <Suspense fallback={<header style={{ minHeight: '68px', background: '#00132b', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }} />}>
      <NavBarContent />
    </Suspense>
  );
}
