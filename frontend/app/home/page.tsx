'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import KeyLeadership from '@/components/KeyLeadership';
import StorytellingCarousel from '@/components/StorytellingCarousel';
import { useLanguage } from '@/context/LanguageContext';
import { getLocalizedSchemeName, getLocalizedSchemeDesc } from '@/lib/translations';
import {
  MessageCircle,
  Calculator,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Layers,
  Compass,
  GraduationCap,
  Users,
  Sparkles,
} from 'lucide-react';

export default function PortalOverviewPage() {
  const { t, language } = useLanguage();
  const [currentMsgIndex, setCurrentMsgIndex] = useState(0);
  const [fade, setFade] = useState(true);

  const rotatingMessages = useMemo(() => [
    t('home.rotate_msg_1', 'Explore government-supported concessional loan schemes and financial assistance.'),
    t('home.rotate_msg_2', 'Check your eligibility and discover schemes suited to your needs.'),
    t('home.rotate_msg_3', 'Understand loan terms, interest rates, and repayment options.'),
    t('home.rotate_msg_4', 'Calculate your estimated monthly EMI with ease.'),
    t('home.rotate_msg_5', 'Find channel partners available near you.'),
    t('home.rotate_msg_6', 'Get assistance through the PradarshakAI AI Assistant.'),
    t('home.rotate_msg_7', 'Access scheme information in a simple and transparent way.'),
    t('home.rotate_msg_8', 'Connect with channel partners and understand the next steps.'),
  ], [t]);

  useEffect(() => {
    const timer = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentMsgIndex((prev) => (prev + 1) % rotatingMessages.length);
        setFade(true);
      }, 500);
    }, 4500);

    return () => clearInterval(timer);
  }, [rotatingMessages.length]);

  const featuredSchemes = useMemo(() => [
    {
      title: getLocalizedSchemeName('Mahila Samriddhi Yojana (MSY)', language),
      category: t('home.featured_cat_micro', t('category.micro_finance', 'Micro Finance')),
      rate: '4% p.a.',
      maxLoan: '₹1.40 Lakh',
      tenure: '3.5 Years',
      moratorium: '3 Months',
      desc: t('home.featured_msy_desc', getLocalizedSchemeDesc('Mahila Samriddhi Yojana (MSY)', 'Micro-credit assistance program for women entrepreneurs in petty trade, tailoring, dairy, and artisanal crafts.', language)),
    },
    {
      title: getLocalizedSchemeName('Term Loan Scheme', language),
      category: t('home.featured_cat_term', t('category.term_loan', 'Term Loan')),
      rate: '6% – 8% p.a.',
      maxLoan: '₹50.00 Lakh',
      tenure: '5 – 10 Years',
      moratorium: '6 – 12 Months',
      desc: t('home.featured_term_desc', getLocalizedSchemeDesc('Term Loan Scheme', 'Project financing for viable ventures in manufacturing, agricultural machinery, transport, and service sectors.', language)),
    },
    {
      title: getLocalizedSchemeName('Education Loan Scheme (ELS)', language),
      category: t('home.featured_cat_edu', t('category.education_loan', 'Education Loan')),
      rate: '4% p.a.',
      maxLoan: '₹20.00 Lakh',
      tenure: '5 Years post study',
      moratorium: 'Course + 6m',
      desc: t('home.featured_edu_desc', getLocalizedSchemeDesc('Education Loan Scheme (ELS)', 'Concessional education credit for professional and technical higher education courses in India and abroad.', language)),
    },
  ], [t, language]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F5F6F8', color: '#1e293b' }}>
      <NavBar />

      {/* ── 1. CLEAN OFFICIAL HERO SECTION WITH VISUAL STORYTELLING ────── */}
      <section
        style={{
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          padding: '24px 0 32px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            maxWidth: 920,
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '0 24px',
          }}
        >
          {/* Hero Heading */}
          <h1
            style={{
              fontSize: 'clamp(24px, 2.8vw, 34px)',
              fontWeight: 800,
              color: '#003366',
              lineHeight: 1.25,
              letterSpacing: '-0.02em',
              margin: '0 0 8px 0',
            }}
          >
            {t('home.hero_title', 'Find the Right Government Financial Scheme')}
          </h1>

          {/* Rotating Informational Text */}
          <div
            style={{
              minHeight: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              maxWidth: 760,
              padding: '0 16px',
            }}
          >
            <p
              style={{
                fontSize: 'clamp(14px, 1.5vw, 16px)',
                fontWeight: 500,
                color: '#0b5a8f',
                margin: 0,
                lineHeight: 1.4,
                textAlign: 'center',
                opacity: fade ? 1 : 0,
                transform: fade ? 'translateY(0)' : 'translateY(2px)',
                transition: 'opacity 500ms cubic-bezier(0.4, 0, 0.2, 1), transform 500ms cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {rotatingMessages[currentMsgIndex % rotatingMessages.length]}
            </p>
          </div>
        </div>

        {/* ── 7-IMAGE STORYTELLING CAROUSEL ── */}
        <div style={{ width: '100%', marginTop: '16px' }}>
          <StorytellingCarousel />
        </div>
      </section>

      {/* ── 2. QUICK SERVICES SECTION ("What would you like to do?") ───── */}
      <section
        className="home-services-section"
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          width: '100%',
          padding: '52px 24px 56px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <h2
            style={{
              fontSize: 'clamp(22px, 2.6vw, 30px)',
              fontWeight: 800,
              color: '#003366',
              margin: '0 0 10px 0',
              letterSpacing: '-0.015em',
            }}
          >
            {t('home.services_title', 'What would you like to do?')}
          </h2>
          <p
            style={{
              fontSize: 'clamp(14px, 1.5vw, 16px)',
              color: '#64748b',
              margin: 0,
              maxWidth: 620,
              marginLeft: 'auto',
              marginRight: 'auto',
              lineHeight: 1.5,
            }}
          >
            {t('home.services_sub', t('home.services_subtitle', 'Select an option below to get started with PradarshakAI'))}
          </p>
        </div>

        <div className="action-cards-grid">
          {/* Card 1: Explore Schemes */}
          <Link href="/schemes" style={{ textDecoration: 'none' }} className="action-card-link">
            <div
              className="action-card-inner"
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: '32px 22px 28px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: 16,
                boxShadow: '0 2px 8px rgba(0, 30, 64, 0.04)',
                height: '100%',
                transition: 'all 200ms ease',
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: '#eff6ff',
                  border: '1px solid #dbeafe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Layers size={30} color="#003366" />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#003366', margin: '0 0 8px 0', lineHeight: 1.3 }}>
                  {t('home.card_explore_title', 'Explore Schemes')}
                </h3>
                <p style={{ fontSize: 14, color: '#475569', margin: 0, lineHeight: 1.5 }}>
                  {t('home.card_explore_desc', 'View available concessional loan schemes')}
                </p>
              </div>
            </div>
          </Link>

          {/* Card 2: Chat with AI Assistant */}
          <Link href="/chat" style={{ textDecoration: 'none' }} className="action-card-link">
            <div
              className="action-card-inner"
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: '32px 22px 28px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: 16,
                boxShadow: '0 2px 8px rgba(0, 30, 64, 0.04)',
                height: '100%',
                transition: 'all 200ms ease',
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: '#eef2ff',
                  border: '1px solid #e0e7ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <MessageCircle size={30} color="#3730a3" />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#003366', margin: '0 0 8px 0', lineHeight: 1.3 }}>
                  {t('home.card_chat_title', 'Chat with AI Assistant')}
                </h3>
                <p style={{ fontSize: 14, color: '#475569', margin: 0, lineHeight: 1.5 }}>
                  {t('home.card_chat_desc', 'Get personalized scheme recommendations through AI.')}
                </p>
              </div>
            </div>
          </Link>

          {/* Card 3: Calculate EMI */}
          <Link href="/chat?tab=emi" style={{ textDecoration: 'none' }} className="action-card-link">
            <div
              className="action-card-inner"
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: '32px 22px 28px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: 16,
                boxShadow: '0 2px 8px rgba(0, 30, 64, 0.04)',
                height: '100%',
                transition: 'all 200ms ease',
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: '#fef3c7',
                  border: '1px solid #fde68a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Calculator size={30} color="#d97706" />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#003366', margin: '0 0 8px 0', lineHeight: 1.3 }}>
                  {t('home.card_emi_title', 'Calculate EMI')}
                </h3>
                <p style={{ fontSize: 14, color: '#475569', margin: 0, lineHeight: 1.5 }}>
                  {t('home.card_emi_desc', 'Estimate your monthly repayment')}
                </p>
              </div>
            </div>
          </Link>

          {/* Card 4: Find a Partner */}
          <Link href="/partners" style={{ textDecoration: 'none' }} className="action-card-link">
            <div
              className="action-card-inner"
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: '32px 22px 28px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: 16,
                boxShadow: '0 2px 8px rgba(0, 30, 64, 0.04)',
                height: '100%',
                transition: 'all 200ms ease',
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: '#dcfce7',
                  border: '1px solid #bbf7d0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <MapPin size={30} color="#15803d" />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#003366', margin: '0 0 8px 0', lineHeight: 1.3 }}>
                  {t('home.card_partner_title', 'Find a Partner')}
                </h3>
                <p style={{ fontSize: 14, color: '#475569', margin: 0, lineHeight: 1.5 }}>
                  {t('home.card_partner_desc', 'Locate nearby channel partners')}
                </p>
              </div>
            </div>
          </Link>

          {/* Card 5: Find a Scheme */}
          <Link href="/find-scheme" style={{ textDecoration: 'none' }} className="action-card-link">
            <div
              className="action-card-inner"
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: '32px 22px 28px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: 16,
                boxShadow: '0 2px 8px rgba(0, 30, 64, 0.04)',
                height: '100%',
                transition: 'all 200ms ease',
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Compass size={30} color="#0284c7" />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#003366', margin: '0 0 8px 0', lineHeight: 1.3 }}>
                  {t('home.card_find_title', 'Find a Scheme')}
                </h3>
                <p style={{ fontSize: 14, color: '#475569', margin: 0, lineHeight: 1.5 }}>
                  {t('home.card_find_desc', 'Answer a few questions to find schemes that may suit you.')}
                </p>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* ── 3. FEATURED SCHEMES ─────────────────────────────────────────── */}
      <section
        className="home-featured-section"
        style={{
          background: '#ffffff',
          borderTop: '1px solid #e2e8f0',
          borderBottom: '1px solid #e2e8f0',
          padding: '56px 24px 64px',
          width: '100%',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
          {/* Section Header (Centered) */}
          <div
            style={{
              textAlign: 'center',
              marginBottom: 36,
              maxWidth: 720,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            <div
              style={{
                display: 'inline-block',
                fontSize: 11,
                fontWeight: 700,
                color: '#b45309',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 8,
              }}
            >
              {t('home.featured_badge', 'OFFICIAL NSFDC CONCESSIONAL CREDIT')}
            </div>
            <h2
              style={{
                fontSize: 'clamp(22px, 2.6vw, 30px)',
                fontWeight: 800,
                color: '#003366',
                margin: '0 0 8px 0',
                letterSpacing: '-0.015em',
              }}
            >
              {t('home.featured_title', 'Featured Schemes')}
            </h2>
            <p style={{ fontSize: 'clamp(14px, 1.5vw, 16px)', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
              {t('home.featured_sub', t('home.featured_subtitle', 'Popular concessional loan programs'))}
            </p>
          </div>

          {/* Centered 3-Card Grid */}
          <div
            className="featured-schemes-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 24,
            }}
          >
            {featuredSchemes.map((scheme, idx) => (
              <div
                key={idx}
                className="featured-scheme-card"
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: '28px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  background: '#ffffff',
                  boxShadow: '0 2px 8px rgba(0, 30, 64, 0.04)',
                  transition: 'all 200ms ease',
                  height: '100%',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'inline-block',
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#b45309',
                      backgroundColor: '#fffbeb',
                      border: '1px solid #fde68a',
                      borderRadius: 4,
                      padding: '3px 8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      marginBottom: 8,
                    }}
                  >
                    {scheme.category}
                  </div>
                  <h3
                    style={{
                      fontSize: 19,
                      fontWeight: 700,
                      color: '#003366',
                      margin: 0,
                      lineHeight: 1.35,
                      minHeight: 52,
                    }}
                  >
                    {scheme.title}
                  </h3>
                </div>

                {/* Key Financial Parameters Box */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 16,
                    padding: '14px 16px',
                    borderRadius: 8,
                    background: '#f8fafc',
                    border: '1px solid #edf2f7',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em', marginBottom: 2 }}>
                      {t('home.max_assistance', 'Max Assistance')}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#003366' }}>{scheme.maxLoan}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em', marginBottom: 2 }}>
                      {t('schemes.interest_rate', t('home.interest_rate', 'Interest Rate'))}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#15803d' }}>{scheme.rate}</div>
                  </div>
                </div>

                <p
                  style={{
                    fontSize: 14,
                    color: '#475569',
                    margin: 0,
                    lineHeight: 1.55,
                    flex: 1,
                  }}
                >
                  {scheme.desc}
                </p>

                <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
                  <Link
                    href="/schemes"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      color: '#003366',
                      fontWeight: 700,
                      fontSize: 14,
                      textDecoration: 'none',
                    }}
                  >
                    <span>{t('home.view_details', 'View Details')}</span>
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* View All Schemes Button - Centered Below 3 Cards */}
          <div style={{ marginTop: 36, textAlign: 'center' }}>
            <Link
              href="/schemes"
              className="featured-view-all-link"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                color: '#003366',
                fontWeight: 700,
                fontSize: 15,
                textDecoration: 'none',
                padding: '11px 24px',
                borderRadius: 8,
                backgroundColor: '#f8fafc',
                border: '1px solid #cbd5e1',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                transition: 'all 180ms ease',
              }}
            >
              <span>{t('home.view_all_schemes', 'View All Schemes')}</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 4. HOW PRADARSHAKAI HELPS (Simple 3-Step Process) ──────────── */}
      <section
        className="home-how-section"
        style={{
          padding: '52px 24px 56px',
          maxWidth: 1200,
          margin: '0 auto',
          width: '100%',
          textAlign: 'center',
        }}
      >
        <div style={{ marginBottom: 36 }}>
          <h2
            style={{
              fontSize: 'clamp(22px, 2.6vw, 30px)',
              fontWeight: 800,
              color: '#003366',
              margin: '0 0 10px 0',
              letterSpacing: '-0.015em',
            }}
          >
            {t('home.how_helps_title', 'How PradarshakAI Helps')}
          </h2>
          <p
            style={{
              fontSize: 'clamp(14px, 1.5vw, 16px)',
              color: '#64748b',
              margin: 0,
              maxWidth: 620,
              marginLeft: 'auto',
              marginRight: 'auto',
              lineHeight: 1.5,
            }}
          >
            {t('home.how_helps_sub', 'Three simple steps to discover, evaluate, and apply for government financial assistance')}
          </p>
        </div>

        <div
          className="how-steps-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 24,
            textAlign: 'center',
          }}
        >
          {/* Step 1 */}
          <div
            className="how-step-card"
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              padding: '32px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
              boxShadow: '0 2px 8px rgba(0, 30, 64, 0.03)',
              transition: 'all 200ms ease',
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: '#003366',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                fontWeight: 800,
                boxShadow: '0 4px 12px rgba(0, 51, 102, 0.2)',
                flexShrink: 0,
              }}
            >
              1
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#003366', margin: 0 }}>
              {t('home.step1_title', t('home.how_step1_title', 'Check Eligibility'))}
            </h3>
            <p style={{ fontSize: 14, color: '#475569', margin: 0, lineHeight: 1.55 }}>
              {t('home.step1_desc', t('home.how_step1_desc', 'Provide your project purpose and income to instantly verify your eligibility.'))}
            </p>
          </div>

          {/* Step 2 */}
          <div
            className="how-step-card"
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              padding: '32px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
              boxShadow: '0 2px 8px rgba(0, 30, 64, 0.03)',
              transition: 'all 200ms ease',
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: '#003366',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                fontWeight: 800,
                boxShadow: '0 4px 12px rgba(0, 51, 102, 0.2)',
                flexShrink: 0,
              }}
            >
              2
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#003366', margin: 0 }}>
              {t('home.step2_title', t('home.how_step2_title', 'Find a Suitable Scheme'))}
            </h3>
            <p style={{ fontSize: 14, color: '#475569', margin: 0, lineHeight: 1.55 }}>
              {t('home.step2_desc', t('home.how_step2_desc', 'Our system identifies the best concessional programs with the lowest subsidized interest rates.'))}
            </p>
          </div>

          {/* Step 3 */}
          <div
            className="how-step-card"
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              padding: '32px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
              boxShadow: '0 2px 8px rgba(0, 30, 64, 0.03)',
              transition: 'all 200ms ease',
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: '#003366',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                fontWeight: 800,
                boxShadow: '0 4px 12px rgba(0, 51, 102, 0.2)',
                flexShrink: 0,
              }}
            >
              3
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#003366', margin: 0 }}>
              {t('home.step3_title', t('home.how_step3_title', 'Connect & Apply'))}
            </h3>
            <p style={{ fontSize: 14, color: '#475569', margin: 0, lineHeight: 1.55 }}>
              {t('home.step3_desc', t('home.how_step3_desc', 'Connect directly to your nearest State Channelising Agency or nominated bank branch.'))}
            </p>
          </div>
        </div>
      </section>

      {/* ── 5. ABOUT PRADARSHAKAI ─────────────────────────────────────── */}
      <section
        className="home-about-section"
        style={{
          background: '#ffffff',
          borderTop: '1px solid #e2e8f0',
          borderBottom: '1px solid #e2e8f0',
          padding: '56px 24px 60px',
          width: '100%',
        }}
      >
        <div style={{ maxWidth: 1040, margin: '0 auto', textAlign: 'center' }}>
          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <h2
              style={{
                fontSize: 'clamp(22px, 2.6vw, 30px)',
                fontWeight: 800,
                color: '#003366',
                margin: '0 0 10px 0',
                letterSpacing: '-0.015em',
              }}
            >
              {t('home.about_title', 'About PradarshakAI')}
            </h2>
            <p
              style={{
                fontSize: 'clamp(14px, 1.5vw, 16px)',
                color: '#64748b',
                margin: 0,
                maxWidth: 720,
                marginLeft: 'auto',
                marginRight: 'auto',
                lineHeight: 1.55,
              }}
            >
              {t(
                'home.about_subtitle',
                'PradarshakAI is a student-built initiative designed to make government financial assistance easier to discover, understand, and navigate.'
              )}
            </p>
          </div>

          {/* Main Explanatory Paragraph */}
          <div
            style={{
              maxWidth: 860,
              margin: '0 auto 28px',
              padding: '0 12px',
            }}
          >
            <p
              style={{
                fontSize: 'clamp(14.5px, 1.1vw, 15.5px)',
                color: '#334155',
                lineHeight: 1.75,
                margin: '0 0 20px 0',
              }}
            >
              {t(
                'home.about_desc',
                'PradarshakAI is developed by a team of undergraduate students from Pune Institute of Computer Technology (PICT), Pune, with a shared goal of making government financial assistance easier for citizens to discover and understand. We built PradarshakAI to help people navigate the large and often complex landscape of concessional loan and financial-assistance schemes through personalized AI-based recommendations, multilingual interaction, voice assistance, and channel-partner discovery.'
              )}
            </p>

            {/* Mission Statement */}
            <div
              style={{
                display: 'inline-block',
                background: '#f8fafc',
                borderLeft: '3px solid #003366',
                borderRadius: '0 8px 8px 0',
                padding: '12px 20px',
                textAlign: 'left',
                maxWidth: 720,
              }}
            >
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#003366',
                  margin: 0,
                  lineHeight: 1.55,
                }}
              >
                {t(
                  'home.about_mission',
                  'Our aim is simple: help citizens find the right scheme, understand their options, and take the next step with confidence.'
                )}
              </p>
            </div>
          </div>

          {/* Three Supporting Highlights */}
          <div
            className="about-highlights-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 20,
              marginTop: 36,
              textAlign: 'center',
            }}
          >
            {/* Highlight 1: Student-Built */}
            <div
              className="about-highlight-card"
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: '24px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: 10,
                boxShadow: '0 2px 6px rgba(0, 30, 64, 0.02)',
                transition: 'all 180ms ease',
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: '#eff6ff',
                  border: '1px solid #dbeafe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#003366',
                  flexShrink: 0,
                }}
              >
                <GraduationCap size={22} />
              </div>
              <h4
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#003366',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  margin: 0,
                }}
              >
                {t('home.about_h1_title', 'Student-Built')}
              </h4>
              <p style={{ fontSize: 13.5, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                {t('home.about_h1_desc', 'Developed by undergraduate students from PICT, Pune.')}
              </p>
            </div>

            {/* Highlight 2: Citizen-Centric */}
            <div
              className="about-highlight-card"
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: '24px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: 10,
                boxShadow: '0 2px 6px rgba(0, 30, 64, 0.02)',
                transition: 'all 180ms ease',
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: '#eff6ff',
                  border: '1px solid #dbeafe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#003366',
                  flexShrink: 0,
                }}
              >
                <Users size={22} />
              </div>
              <h4
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#003366',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  margin: 0,
                }}
              >
                {t('home.about_h2_title', 'Citizen-Centric')}
              </h4>
              <p style={{ fontSize: 13.5, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                {t('home.about_h2_desc', 'Designed to simplify scheme discovery through clear, accessible interactions.')}
              </p>
            </div>

            {/* Highlight 3: Technology-Enabled */}
            <div
              className="about-highlight-card"
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: '24px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: 10,
                boxShadow: '0 2px 6px rgba(0, 30, 64, 0.02)',
                transition: 'all 180ms ease',
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: '#eff6ff',
                  border: '1px solid #dbeafe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#003366',
                  flexShrink: 0,
                }}
              >
                <Sparkles size={22} />
              </div>
              <h4
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#003366',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  margin: 0,
                }}
              >
                {t('home.about_h3_title', 'Technology-Enabled')}
              </h4>
              <p style={{ fontSize: 13.5, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                {t('home.about_h3_desc', 'Combines AI, multilingual interaction, voice assistance, and partner discovery.')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. NEED HELP / AI ASSISTANT SECTION ────────────────────────── */}
      <section style={{ padding: '48px 24px 60px', width: '100%' }}>
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            background: 'linear-gradient(135deg, #002244 0%, #003366 100%)',
            borderRadius: 16,
            padding: '44px 32px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: 18,
            boxShadow: '0 10px 30px rgba(0, 51, 102, 0.12)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <h2 style={{ fontSize: 'clamp(22px, 2.6vw, 30px)', fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.015em' }}>
            {t('home.need_help_title', 'Need Help?')}
          </h2>
          <p style={{ fontSize: 'clamp(14px, 1.5vw, 16px)', color: '#cbd5e1', margin: 0, maxWidth: 620, lineHeight: 1.55 }}>
            {t('home.need_help_desc', 'Get assistance finding schemes, understanding eligibility, or calculating your repayment.')}
          </p>
          <Link
            href="/chat"
            className="need-help-chat-btn"
            style={{
              background: '#F58220',
              color: '#ffffff',
              padding: '12px 28px',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 16,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 6,
              boxShadow: '0 4px 14px rgba(245, 130, 32, 0.35)',
              transition: 'all 180ms ease',
            }}
          >
            <MessageCircle size={18} />
            <span>{t('home.ask_ai_assistant', 'Ask AI Assistant')}</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── 6. KEY LEADERSHIP ───────────────────────────────────────────── */}
      <KeyLeadership />

      <Footer />

      <style jsx>{`
        :global(.action-cards-grid) {
          display: flex !important;
          flex-wrap: wrap !important;
          justify-content: center !important;
          gap: 24px !important;
          width: 100% !important;
        }

        :global(.action-card-link) {
          display: flex !important;
          flex-direction: column !important;
          transition: transform 200ms ease;
        }

        :global(.action-card-inner) {
          flex: 1 !important;
          width: 100% !important;
          min-height: 220px;
        }

        :global(.action-card-inner:hover) {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 51, 102, 0.08) !important;
          border-color: #cbd5e1 !important;
        }

        :global(.featured-scheme-card:hover) {
          transform: translateY(-4px);
          box-shadow: 0 10px 24px rgba(0, 51, 102, 0.08) !important;
          border-color: #cbd5e1 !important;
        }

        :global(.how-step-card:hover) {
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(0, 51, 102, 0.06) !important;
          border-color: #cbd5e1 !important;
        }

        :global(.featured-view-all-link:hover) {
          background-color: #003366 !important;
          color: #ffffff !important;
          border-color: #003366 !important;
        }

        :global(.need-help-chat-btn:hover) {
          background-color: #ea580c !important;
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(245, 130, 32, 0.45) !important;
        }

        :global(.about-highlight-card:hover) {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 51, 102, 0.06) !important;
          border-color: #cbd5e1 !important;
        }

        @media (min-width: 1024px) {
          :global(.action-card-link) {
            flex: 0 0 calc((100% - 72px) / 4) !important;
            max-width: calc((100% - 72px) / 4) !important;
            min-width: 220px !important;
          }
          :global(.featured-schemes-grid) {
            grid-template-columns: repeat(3, 1fr) !important;
          }
          :global(.how-steps-grid) {
            grid-template-columns: repeat(3, 1fr) !important;
          }
          :global(.about-highlights-grid) {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }

        @media (min-width: 640px) and (max-width: 1023px) {
          :global(.action-card-link) {
            flex: 0 0 calc((100% - 24px) / 2) !important;
            max-width: calc((100% - 24px) / 2) !important;
          }
          :global(.featured-schemes-grid) {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          :global(.how-steps-grid) {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          :global(.about-highlights-grid) {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }

        @media (max-width: 639px) {
          :global(.action-card-link) {
            flex: 1 1 100% !important;
            max-width: 100% !important;
            width: 100% !important;
          }
          :global(.featured-schemes-grid) {
            grid-template-columns: 1fr !important;
          }
          :global(.how-steps-grid) {
            grid-template-columns: 1fr !important;
          }
          :global(.about-highlights-grid) {
            grid-template-columns: 1fr !important;
          }
          :global(.home-services-section),
          :global(.home-featured-section),
          :global(.home-how-section),
          :global(.home-about-section) {
            padding-left: 16px !important;
            padding-right: 16px !important;
          }
        }
      `}</style>
    </div>
  );
}
