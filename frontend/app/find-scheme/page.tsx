'use client';

import './find-scheme.css';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import SchemeResultCard from '@/components/SchemeResultCard';
import { useLanguage } from '@/context/LanguageContext';
import {
  findSchemesGuided,
  getUserProfile,
  type Scheme,
  type GuidedFinderRequest,
  type UserProfile,
} from '@/lib/api';
import { JOB_CATEGORIES, ALL_JOB_OPTIONS_MAP } from '@/lib/jobCategories';
import {
  getLocalizedPurpose,
  getLocalizedEducation,
  getLocalizedJobGroup,
  getLocalizedJobOption,
  getLocalizedState,
  getFinderUIString,
} from '@/lib/finderLocalization';
import {
  Compass,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Edit3,
  AlertTriangle,
  CheckCircle2,
  IndianRupee,
  Briefcase,
  User,
  MapPin,
  Loader2,
  Check,
  ChevronDown,
  Layers,
  ShieldCheck,
  Scale,
} from 'lucide-react';
import ComparisonCard from '@/components/ComparisonCard';

const PURPOSE_OPTIONS = [
  { id: 'Start a Business', label: 'Start a Business', category_hint: 'business_loan' },
  { id: 'Expand an Existing Business', label: 'Expand an Existing Business', category_hint: 'business_loan' },
  { id: 'Self-Employment / Micro Enterprise', label: 'Self-Employment / Micro Enterprise', category_hint: 'business_loan' },
  { id: 'Agriculture / Farming', label: 'Agriculture / Farming', category_hint: 'business_loan' },
  { id: 'Dairy / Poultry / Allied Agriculture', label: 'Dairy / Poultry / Allied Agriculture', category_hint: 'business_loan' },
  { id: 'Transport / Logistics', label: 'Transport / Logistics (Auto, E-Rickshaw, Commercial Vehicle)', category_hint: 'business_loan' },
  { id: 'Skilled Trade / Artisan Activity', label: 'Skilled Trade / Artisan / Handicraft Activity', category_hint: 'business_loan' },
  { id: 'Education / Higher Education', label: 'Education / Higher Education (Professional / Technical)', category_hint: 'education_loan' },
  { id: 'Vocational Education / Training', label: 'Vocational Education / Training / ITI', category_hint: 'education_loan' },
  { id: 'Skill Development', label: 'Skill Development Programme', category_hint: 'education_loan' },
  { id: 'Green / Environment-Friendly Business', label: 'Green / Environment-Friendly Business (Solar / EV)', category_hint: 'business_loan' },
  { id: 'Sanitation / Waste Management Equipment', label: 'Sanitation / Waste Management Equipment', category_hint: 'business_loan' },
  { id: 'Other', label: 'Other Activity / Need', category_hint: undefined },
];

const EDUCATION_LEVELS = [
  { id: 'school', label: 'Schooling / Matriculate', desc: '10th / 12th Pass, Basic Literacy' },
  { id: 'diploma', label: 'Vocational Diploma / ITI', desc: 'Polytechnic, ITI or Technical Cert' },
  { id: 'undergraduate', label: "Graduate / Bachelor's", desc: 'B.A, B.Sc, B.Com, B.Tech, etc.' },
  { id: 'postgraduate', label: 'Postgraduate / Professional', desc: 'M.A, M.Sc, MBA, MBBS, LLB, etc.' },
];

const GENDER_OPTIONS = [
  { id: 'male', labelKey: 'finder.gender_male', defaultLabel: 'Male' },
  { id: 'female', labelKey: 'finder.gender_female', defaultLabel: 'Female' },
  { id: 'other', labelKey: 'finder.gender_other', defaultLabel: 'Other' },
  { id: 'prefer_not_to_say', labelKey: 'finder.gender_prefer_not_to_say', defaultLabel: 'Prefer not to say' },
];

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Chandigarh',
  'Puducherry', 'Dadra & Nagar Haveli', 'Andaman & Nicobar Islands', 'Lakshadweep'
];

function formatIndianCurrencyWords(numStr: string): string {
  const clean = numStr.replace(/[^0-9]/g, '');
  if (!clean) return '';
  const n = parseInt(clean, 10);
  if (isNaN(n) || n === 0) return '';
  if (n >= 10000000) {
    const cr = (n / 10000000).toFixed(2).replace(/\.00$/, '');
    return `₹${cr} Crore`;
  }
  if (n >= 100000) {
    const l = (n / 100000).toFixed(2).replace(/\.00$/, '');
    return `₹${l} Lakh`;
  }
  if (n >= 1000) {
    const k = (n / 1000).toFixed(1).replace(/\.0$/, '');
    return `₹${k} Thousand`;
  }
  return `₹${n.toLocaleString('en-IN')}`;
}

export default function FindSchemePage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const ui = (key: string, fallback: string) => getFinderUIString(key, language) || t(key, fallback);

  // Form State
  const [purpose, setPurpose] = useState('');
  const [occupation, setOccupation] = useState('');
  const [occupationOther, setOccupationOther] = useState('');
  const [educationLevel, setEducationLevel] = useState('');
  const [familyIncome, setFamilyIncome] = useState('');
  const [fundingRequired, setFundingRequired] = useState('');
  const [gender, setGender] = useState('');
  const [location, setLocation] = useState('');

  // UI / Workflow States
  const [viewState, setViewState] = useState<'form' | 'results' | 'no_match'>('form');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPrefilled, setIsPrefilled] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showComparison, setShowComparison] = useState(false);

  // Result Data
  const [matchedSchemes, setMatchedSchemes] = useState<Scheme[]>([]);
  const [disqualificationReason, setDisqualificationReason] = useState<string | null>(null);
  const [submittedQuery, setSubmittedQuery] = useState<Record<string, any>>({});

  // Prefill for Authenticated Users
  useEffect(() => {
    let isMounted = true;
    getUserProfile()
      .then((profile) => {
        if (!isMounted || !profile || profile.guest) return;
        let anyPrefilled = false;

        if (profile.salary) {
          const incNum = String(profile.salary).replace(/[^0-9]/g, '');
          if (incNum) {
            setFamilyIncome(incNum);
            anyPrefilled = true;
          }
        }
        if (profile.education_level) {
          setEducationLevel(profile.education_level);
          anyPrefilled = true;
        }
        if (profile.trade_category) {
          setOccupation(profile.trade_category);
          anyPrefilled = true;
        }
        if (profile.job_business_other) {
          setOccupationOther(profile.job_business_other);
        }
        if (profile.gender) {
          const g = profile.gender.toLowerCase();
          if (['male', 'female', 'other', 'prefer_not_to_say'].includes(g)) {
            setGender(g);
            anyPrefilled = true;
          }
        }
        if (profile.state) {
          setLocation(profile.state);
          anyPrefilled = true;
        }

        if (anyPrefilled) {
          setIsPrefilled(true);
        }
      })
      .catch(() => {
        // Guest user or network failure - continue silently
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Validation
  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};

    if (!purpose) {
      errs.purpose = t('finder.err_purpose', 'Please select what you want to do.');
    }
    if (!occupation) {
      errs.occupation = t('finder.err_occupation', 'Please select your current occupation.');
    } else if (occupation === 'other' && !occupationOther.trim()) {
      errs.occupationOther = t('finder.err_occupation_other', 'Please specify your current occupation/business.');
    }
    if (!educationLevel) {
      errs.educationLevel = t('finder.err_education', 'Please select your highest education level.');
    }

    const incNum = parseInt(familyIncome.replace(/[^0-9]/g, ''), 10);
    if (!familyIncome || isNaN(incNum) || incNum <= 0) {
      errs.familyIncome = t('finder.err_income', 'Please enter a valid annual family income.');
    }

    const fundNum = parseInt(fundingRequired.replace(/[^0-9]/g, ''), 10);
    if (!fundingRequired || isNaN(fundNum) || fundNum <= 0) {
      errs.fundingRequired = t('finder.err_funding', 'Please enter a valid loan amount required.');
    }

    if (!gender) {
      errs.gender = t('finder.err_gender', 'Please select your gender.');
    }

    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!validateForm()) {
      const firstErrorField = document.querySelector('.fs-error');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setLoading(true);

    const incNum = parseInt(familyIncome.replace(/[^0-9]/g, ''), 10);
    const fundNum = parseInt(fundingRequired.replace(/[^0-9]/g, ''), 10);

    const selectedPurposeMeta = PURPOSE_OPTIONS.find((p) => p.id === purpose);

    const payload: GuidedFinderRequest = {
      purpose,
      occupation: occupation === 'other' ? (occupationOther.trim() || 'other') : occupation,
      occupation_other: occupation === 'other' ? occupationOther.trim() : undefined,
      education_level: educationLevel,
      family_income_rs: incNum,
      loan_amount_rs: fundNum,
      gender,
      location: location || undefined,
      category_hint: selectedPurposeMeta?.category_hint,
    };

    setSubmittedQuery(payload);

    try {
      const res = await findSchemesGuided(payload);

      if (res.isDisqualified) {
        setDisqualificationReason(res.disqualificationReason || 'You do not meet the core eligibility criteria for the requested category.');
        setMatchedSchemes([]);
        setViewState('no_match');
      } else {
        const schemes = Array.isArray(res.schemes) ? res.schemes : [];
        if (schemes.length === 0) {
          setDisqualificationReason('No active schemes matched your specific combination of parameters.');
          setMatchedSchemes([]);
          setViewState('no_match');
        } else {
          // Strictly cap at Top 3 Best-Matching Schemes
          const top3Schemes = schemes.slice(0, 3);
          setMatchedSchemes(top3Schemes);
          setViewState('results');
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'A network error occurred while finding schemes. Please try again.');
    } finally {
      setLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Reset / Clear Handler
  const handleStartOver = () => {
    setPurpose('');
    setOccupation('');
    setOccupationOther('');
    setEducationLevel('');
    setFamilyIncome('');
    setFundingRequired('');
    setGender('');
    setLocation('');
    setValidationErrors({});
    setErrorMsg(null);
    setMatchedSchemes([]);
    setDisqualificationReason(null);
    setShowComparison(false);
    setViewState('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditAnswers = () => {
    setShowComparison(false);
    setViewState('form');
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  };

  const handleCompareClick = () => {
    setShowComparison((prev) => {
      const next = !prev;
      if (next) {
        setTimeout(() => {
          const el = document.getElementById('fs-comparison-section');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }
      return next;
    });
  };

  const handleOpenPartners = () => {
    if (location) {
      router.push(`/partners?location=${encodeURIComponent(location)}`);
    } else {
      router.push('/partners');
    }
  };

  const handleAskPradarshakAI = () => {
    const occLabel = occupation === 'other' ? (occupationOther || 'self-employed') : (ALL_JOB_OPTIONS_MAP[occupation] || occupation);
    const purposeText = purpose || 'business financial assistance';
    const incWords = formatIndianCurrencyWords(familyIncome);
    const fundWords = formatIndianCurrencyWords(fundingRequired);

    const promptText = `I am a ${occLabel || 'citizen'}, my annual family income is ${incWords || 'around ₹2.5 Lakh'}, and I need a loan of ${fundWords || '₹2 Lakh'} for ${purposeText}. What official NSFDC government schemes can I get, and how do I apply?`;

    router.push(`/chat?q=${encodeURIComponent(promptText)}&inquiry=1`);
  };

  return (
    <div className="finder-page" style={{ background: '#f8fafc' }}>
      <NavBar />

      <main className="finder-main">

        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <div className="fs-header">
          {/* Eyebrow */}
          <div className="fs-eyebrow">
            <Compass size={13.5} strokeWidth={2.2} style={{ color: '#0284c7', flexShrink: 0 }} aria-hidden="true" />
            <span>{ui('finder.eyebrow', 'GUIDED SCHEME FINDER')}</span>
          </div>

          <h1 className="fs-h1">
            {t('finder.title', 'Find a Scheme That Fits Your Needs')}
          </h1>

          <p className="fs-subtitle">
            {t('finder.subtitle', 'Answer a few simple questions to discover schemes that may suit your needs.')}
            {' '}{t('finder.adjust_hint', 'You can adjust any answer before searching.')}
          </p>

          {/* Secondary note line with AI link */}
          <p className="fs-desc-note">
            {t('finder.ask_ai_link', 'Prefer to explain your needs in your own words?')}{' '}
            <Link href="/chat" className="fs-ai-link">
              {t('hero.cta_chat', 'Talk to AI Assistant')}
            </Link>
            {' '}{t('finder.ask_ai_suffix', 'to get personalized scheme recommendations based on your full situation.')}
          </p>
        </div>

        {/* ── Global Error Banner ─────────────────────────────────────────── */}
        {errorMsg && (
          <div className="fs-error-banner" role="alert">
            <AlertTriangle size={18} className="fs-error-icon" aria-hidden="true" />
            <p className="fs-error-text">{errorMsg}</p>
            <button
              onClick={() => setErrorMsg(null)}
              className="fs-error-dismiss"
              aria-label="Dismiss error"
            >
              ✕
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            VIEW 1 — GUIDED FINDER FORM
        ═══════════════════════════════════════════════════════════════════ */}
        {viewState === 'form' && (
          <div className="fs-form-card">
            {/* Card Header */}
            <div className="fs-card-header">
              <div>
                <h2 className="fs-card-title">
                  {t('finder.card_title', 'Tell Us About Your Requirements')}
                </h2>
                <p className="fs-card-subtitle">
                  {t('finder.card_subtitle', 'Enter your activity and financial requirement to match with eligible central and state schemes.')}
                </p>
              </div>
            </div>

            {/* Prefill banner */}
            {isPrefilled && (
              <div style={{ padding: '16px 28px 0' }}>
                <div className="fs-info-banner fs-info-banner-blue" role="note">
                  <CheckCircle2 size={16} className="fs-banner-icon" aria-hidden="true" />
                  <span className="fs-banner-text">
                    {t('finder.prefill_notice', 'Prefilled from your registered profile. You can adjust any detail before finding schemes.')}
                  </span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="fs-form-body">

              {/* ── SECTION BOX 1: Activity & Purpose ──────────────────────── */}
              <div className="fs-section-box">
                <div className="fs-section-header">
                  <div className="fs-section-header-left">
                    <div className="fs-section-icon-badge">
                      <Briefcase size={16} aria-hidden="true" />
                    </div>
                    <h3 className="fs-section-title">{ui('finder.section_activity', 'Activity & Occupation')}</h3>
                  </div>
                  <span className="fs-section-step-tag">{ui('finder.step_1_of_4', 'Step 1 of 4')}</span>
                </div>

                <div className="fs-field-stack">
                  {/* Q1: Purpose */}
                  <div>
                    <label htmlFor="finder-purpose" className="fs-label">
                      1. {t('finder.q1_label', 'What do you want to do?')}
                      <span className="fs-required-star" aria-label="required">*</span>
                    </label>
                    <div className="fs-select-wrap">
                      <select
                        id="finder-purpose"
                        value={purpose}
                        onChange={(e) => {
                          setPurpose(e.target.value);
                          if (validationErrors.purpose) {
                            setValidationErrors((prev) => ({ ...prev, purpose: '' }));
                          }
                        }}
                        className={`fs-select${validationErrors.purpose ? ' fs-error' : ''}`}
                        required
                      >
                        <option value="" disabled>
                          {t('finder.q1_placeholder', '-- Select What You Want to Do --')}
                        </option>
                        {PURPOSE_OPTIONS.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {getLocalizedPurpose(opt.id, language)}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={15} className="fs-chevron" aria-hidden="true" />
                    </div>
                    {validationErrors.purpose && (
                      <p className="fs-field-error" role="alert">{validationErrors.purpose}</p>
                    )}
                  </div>

                  {/* Q2: Occupation */}
                  <div>
                    <label htmlFor="finder-occupation" className="fs-label">
                      2. {t('finder.q2_label', 'What is your current occupation?')}
                      <span className="fs-required-star" aria-label="required">*</span>
                    </label>
                    <div className="fs-select-wrap">
                      <select
                        id="finder-occupation"
                        value={occupation}
                        onChange={(e) => {
                          setOccupation(e.target.value);
                          if (validationErrors.occupation) {
                            setValidationErrors((prev) => ({ ...prev, occupation: '', occupationOther: '' }));
                          }
                        }}
                        className={`fs-select${validationErrors.occupation ? ' fs-error' : ''}`}
                        required
                      >
                        <option value="" disabled>
                          {t('finder.q2_placeholder', '-- Select Your Current Occupation --')}
                        </option>
                        {JOB_CATEGORIES.map((cat) => (
                          <optgroup key={cat.group} label={getLocalizedJobGroup(cat.group, language)}>
                            {cat.options.map((opt) => (
                              <option key={opt.id} value={opt.id}>
                                {getLocalizedJobOption(opt.id, opt.label, language)}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                        <option value="other">
                          {getLocalizedJobOption('other', t('finder.job_other', 'Other (specify below)'), language)}
                        </option>
                      </select>
                      <ChevronDown size={15} className="fs-chevron" aria-hidden="true" />
                    </div>
                    {validationErrors.occupation && (
                      <p className="fs-field-error" role="alert">{validationErrors.occupation}</p>
                    )}

                    {occupation === 'other' && (
                      <div className="fs-other-panel">
                        <label htmlFor="finder-occupation-other" className="fs-other-label">
                          {ui('finder.q2_other_label', 'Please specify your current occupation or business:')}
                          <span className="fs-required-star" aria-label="required">*</span>
                        </label>
                        <input
                          id="finder-occupation-other"
                          type="text"
                          value={occupationOther}
                          onChange={(e) => {
                            setOccupationOther(e.target.value);
                            if (validationErrors.occupationOther) {
                              setValidationErrors((prev) => ({ ...prev, occupationOther: '' }));
                            }
                          }}
                          placeholder={ui('finder.q2_other_placeholder', 'e.g. Pottery, Organic Farming, Welding Workshop')}
                          className={`fs-input fs-input-plain${validationErrors.occupationOther ? ' fs-error' : ''}`}
                          required
                        />
                        {validationErrors.occupationOther && (
                          <p className="fs-field-error" role="alert">{validationErrors.occupationOther}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── SECTION BOX 2: Personal Profile ────────────────────────── */}
              <div className="fs-section-box">
                <div className="fs-section-header">
                  <div className="fs-section-header-left">
                    <div className="fs-section-icon-badge">
                      <User size={16} aria-hidden="true" />
                    </div>
                    <h3 className="fs-section-title">{ui('finder.section_profile', 'Personal Profile & Eligibility')}</h3>
                  </div>
                  <span className="fs-section-step-tag">{ui('finder.step_2_of_4', 'Step 2 of 4')}</span>
                </div>

                <div className="fs-field-row">
                  {/* Q3: Education Level */}
                  <div>
                    <label htmlFor="finder-education" className="fs-label">
                      3. {t('finder.q3_label', 'Highest Education Level')}
                      <span className="fs-required-star" aria-label="required">*</span>
                    </label>
                    <div className="fs-select-wrap">
                      <select
                        id="finder-education"
                        value={educationLevel}
                        onChange={(e) => {
                          setEducationLevel(e.target.value);
                          if (validationErrors.educationLevel) {
                            setValidationErrors((prev) => ({ ...prev, educationLevel: '' }));
                          }
                        }}
                        className={`fs-select${validationErrors.educationLevel ? ' fs-error' : ''}`}
                        required
                      >
                        <option value="" disabled>
                          {t('finder.q3_placeholder', '-- Select Highest Education Level --')}
                        </option>
                        {EDUCATION_LEVELS.map((edu) => {
                          const locEdu = getLocalizedEducation(edu.id, language);
                          return (
                            <option key={edu.id} value={edu.id}>
                              {locEdu.label} — {locEdu.desc}
                            </option>
                          );
                        })}
                      </select>
                      <ChevronDown size={15} className="fs-chevron" aria-hidden="true" />
                    </div>
                    {validationErrors.educationLevel && (
                      <p className="fs-field-error" role="alert">{validationErrors.educationLevel}</p>
                    )}
                  </div>

                  {/* Q4: Gender */}
                  <div>
                    <label htmlFor="finder-gender" className="fs-label">
                      4. {t('finder.q6_label', 'Gender')}
                      <span className="fs-required-star" aria-label="required">*</span>
                    </label>
                    <div className="fs-select-wrap">
                      <select
                        id="finder-gender"
                        value={gender}
                        onChange={(e) => {
                          setGender(e.target.value);
                          if (validationErrors.gender) {
                            setValidationErrors((prev) => ({ ...prev, gender: '' }));
                          }
                        }}
                        className={`fs-select${validationErrors.gender ? ' fs-error' : ''}`}
                        required
                      >
                        <option value="" disabled>
                          {t('finder.q6_placeholder', '-- Select Gender --')}
                        </option>
                        {GENDER_OPTIONS.map((g) => (
                          <option key={g.id} value={g.id}>
                            {t(g.labelKey, g.defaultLabel)}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={15} className="fs-chevron" aria-hidden="true" />
                    </div>
                    {validationErrors.gender && (
                      <p className="fs-field-error" role="alert">{validationErrors.gender}</p>
                    )}
                    {gender === 'female' && (
                      <span className="fs-hint-chip fs-hint-pink" role="note">
                        {ui('finder.women_benefit_note', '✨ Women applicants unlock exclusive concessional schemes (e.g. Mahila Samriddhi & Mahila Adhikarita).')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* ── SECTION BOX 3: Financial Requirement ───────────────────── */}
              <div className="fs-section-box">
                <div className="fs-section-header">
                  <div className="fs-section-header-left">
                    <div className="fs-section-icon-badge">
                      <IndianRupee size={16} aria-hidden="true" />
                    </div>
                    <h3 className="fs-section-title">{ui('finder.section_finance', 'Financial Requirement')}</h3>
                  </div>
                  <span className="fs-section-step-tag">{ui('finder.step_3_of_4', 'Step 3 of 4')}</span>
                </div>

                <div className="fs-field-row">
                  {/* Q5: Family Income */}
                  <div>
                    <label htmlFor="finder-income" className="fs-label">
                      5. {t('finder.q4_label', 'Annual Family Income')}
                      <span className="fs-required-star" aria-label="required">*</span>
                    </label>
                    <div className="fs-input-wrap">
                      <span className="fs-currency-prefix" aria-hidden="true">₹</span>
                      <input
                        id="finder-income"
                        type="text"
                        inputMode="numeric"
                        value={familyIncome}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setFamilyIncome(val);
                          if (validationErrors.familyIncome) {
                            setValidationErrors((prev) => ({ ...prev, familyIncome: '' }));
                          }
                        }}
                        placeholder="e.g. 250000"
                        className={`fs-input${validationErrors.familyIncome ? ' fs-error' : ''}`}
                        required
                      />
                    </div>
                    <div className="fs-field-meta">
                      <span className="fs-helper">
                        {t('finder.q4_hint', 'Universal NSFDC concessional eligibility limit is ₹5,00,000 / year')}
                      </span>
                      {familyIncome && (
                        <span className="fs-preview-badge" aria-live="polite">
                          {formatIndianCurrencyWords(familyIncome)}
                        </span>
                      )}
                    </div>
                    {validationErrors.familyIncome && (
                      <p className="fs-field-error" role="alert">{validationErrors.familyIncome}</p>
                    )}
                  </div>

                  {/* Q6: Funding Required */}
                  <div>
                    <label htmlFor="finder-funding" className="fs-label">
                      6. {t('finder.q5_label', 'How much funding do you need?')}
                      <span className="fs-required-star" aria-label="required">*</span>
                    </label>
                    <div className="fs-input-wrap">
                      <span className="fs-currency-prefix" aria-hidden="true">₹</span>
                      <input
                        id="finder-funding"
                        type="text"
                        inputMode="numeric"
                        value={fundingRequired}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setFundingRequired(val);
                          if (validationErrors.fundingRequired) {
                            setValidationErrors((prev) => ({ ...prev, fundingRequired: '' }));
                          }
                        }}
                        placeholder="e.g. 200000"
                        className={`fs-input${validationErrors.fundingRequired ? ' fs-error' : ''}`}
                        required
                      />
                    </div>
                    <div className="fs-field-meta">
                      <span className="fs-helper">
                        {t('finder.q5_hint', 'Enter the total loan amount required')}
                      </span>
                      {fundingRequired && (
                        <span className="fs-preview-badge fs-preview-green" aria-live="polite">
                          {formatIndianCurrencyWords(fundingRequired)}
                        </span>
                      )}
                    </div>
                    {validationErrors.fundingRequired && (
                      <p className="fs-field-error" role="alert">{validationErrors.fundingRequired}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* ── SECTION BOX 4: Location ────────────────────────────────── */}
              <div className="fs-section-box">
                <div className="fs-section-header">
                  <div className="fs-section-header-left">
                    <div className="fs-section-icon-badge">
                      <MapPin size={16} aria-hidden="true" />
                    </div>
                    <h3 className="fs-section-title">{ui('finder.section_location', 'Location (Optional)')}</h3>
                  </div>
                  <span className="fs-section-step-tag">{ui('finder.step_4_of_4', 'Step 4 of 4')}</span>
                </div>

                <div>
                  <label htmlFor="finder-location" className="fs-label">
                    7. {t('finder.q7_label', 'State / Location (Optional)')}
                  </label>
                  <div className="fs-select-wrap">
                    <select
                      id="finder-location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="fs-select"
                    >
                      <option value="">
                        {t('finder.q7_placeholder', '-- Select State / UT (Optional) --')}
                      </option>
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>
                          {getLocalizedState(st, language)}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={15} className="fs-chevron" aria-hidden="true" />
                  </div>
                  <p className="fs-helper" style={{ marginTop: 6 }}>
                    {ui('finder.location_hint', 'Helps identify state channelizing agencies (SCAs) and nearby partner bank branches.')}
                  </p>
                </div>
              </div>

              {/* ── Form Actions Box (Prominent Submit Area) ────────────────── */}
              <div className="fs-form-actions-box">
                <div className="fs-form-actions-row">
                  <button
                    type="button"
                    onClick={handleStartOver}
                    disabled={loading}
                    className="fs-btn-ghost"
                  >
                    <RotateCcw size={15} aria-hidden="true" />
                    <span>{t('finder.clear_btn', 'Clear Form')}</span>
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="fs-btn-primary"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                        <span>{t('finder.submitting', 'Finding Suitable Schemes...')}</span>
                      </>
                    ) : (
                      <>
                        <Compass size={18} aria-hidden="true" />
                        <span>{t('finder.submit_btn', 'Find Suitable Schemes')}</span>
                        <ArrowRight size={17} aria-hidden="true" />
                      </>
                    )}
                  </button>
                </div>

                <div className="fs-security-note">
                  <ShieldCheck size={15} color="#15803d" aria-hidden="true" />
                  <span>{ui('finder.security_note', 'Instant match against official central & state schemes • 100% Free Government Citizen Service')}</span>
                </div>
              </div>

            </form>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            VIEW 2 — MATCHING RESULTS
        ═══════════════════════════════════════════════════════════════════ */}
        {viewState === 'results' && (
          <div>
            {/* Results header */}
            <div className="fs-results-header">
              <div>
                <div className="fs-results-count-pill">
                  <Check size={11} aria-hidden="true" />
                  <span>{matchedSchemes.length} {t('finder.results_count', 'Matching Schemes Found')}</span>
                </div>
                <h2 className="fs-results-h2">
                  {t('finder.results_title', 'Schemes That May Suit Your Needs')}
                </h2>
                <p className="fs-results-subtitle">
                  {t('finder.results_subtitle', 'Showing top 3 best-matching schemes based on your requirements.')}
                </p>
              </div>

              <div className="fs-results-actions">
                <button
                  type="button"
                  onClick={handleEditAnswers}
                  className="fs-btn-secondary"
                >
                  <Edit3 size={14} aria-hidden="true" />
                  <span>{t('finder.edit_btn', 'Edit Answers')}</span>
                </button>
                <button
                  type="button"
                  onClick={handleStartOver}
                  className="fs-btn-ghost"
                  style={{ minHeight: 40 }}
                >
                  <RotateCcw size={14} aria-hidden="true" />
                  <span>{t('finder.reset_btn', 'Start Over')}</span>
                </button>
              </div>
            </div>

            {/* Top 3 Scheme Cards */}
            <div className="fs-results-grid">
              {matchedSchemes.map((scheme, index) => (
                <div key={scheme.id || index} className="w-full">
                  <SchemeResultCard
                    scheme={scheme as any}
                    rank={index + 1}
                    onCalculateEMI={(s) => {
                      router.push(`/chat?tab=emi&schemeId=${s.id}`);
                    }}
                    onKnowMore={(s) => {
                      router.push(`/chat?q=${encodeURIComponent(`Tell me more about ${s.name}`)}&inquiry=1`);
                    }}
                    onGetDocuments={(s) => {
                      router.push(`/chat?q=${encodeURIComponent(`What documents are required for ${s.name}?`)}&inquiry=1`);
                    }}
                    onFindPartners={() => {
                      router.push(`/partners?category=${encodeURIComponent(scheme.category || '')}`);
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Scheme Post-Result Actions: Compare Schemes & Find nearest Channel partner */}
            <div className="fs-results-post-actions">
              <button
                type="button"
                onClick={handleCompareClick}
                className="fs-btn-compare"
              >
                <Scale size={16} color="#fbbf24" aria-hidden="true" />
                <span>
                  {showComparison ? (language === 'hi' ? 'तुलना छुपाएं' : language === 'mr' ? 'तुलना लपवा' : 'Hide Scheme Comparison') : ui('finder.compare_btn', 'Compare schemes')} ({matchedSchemes.length})
                </span>
              </button>

              <button
                type="button"
                onClick={handleOpenPartners}
                className="fs-btn-partners"
              >
                <MapPin size={16} color="#e87722" aria-hidden="true" />
                <span>{ui('finder.find_partner_btn', 'Find nearest Channel partner')}</span>
              </button>
            </div>

            {/* Comparison Matrix Table (toggled on demand) */}
            {showComparison && (
              <div id="fs-comparison-section" className="fs-comparison-container">
                <ComparisonCard
                  schemes={matchedSchemes as any}
                  onCalculateEMI={(s) => {
                    router.push(`/chat?tab=emi&schemeId=${s.id}`);
                  }}
                  onKnowMore={(s) => {
                    router.push(`/chat?q=${encodeURIComponent(`Tell me more about ${s.name}`)}&inquiry=1`);
                  }}
                />
              </div>
            )}

            {/* Bottom AI assistance banner */}
            <div className="fs-bottom-banner">
              <div>
                <div className="fs-banner-eyebrow">
                  <Sparkles size={11} aria-hidden="true" />
                  <span>Want personalized assistance?</span>
                </div>
                <h3 className="fs-banner-title">Have specific questions or ready to apply?</h3>
                <p className="fs-banner-body">
                  Chat with PradarshakAI to evaluate your monthly EMI, identify verified channel partners in your district, or verify document requirements.
                </p>
              </div>

              <div className="fs-banner-actions">
                <button
                  type="button"
                  onClick={handleAskPradarshakAI}
                  className="fs-btn-amber"
                >
                  <Sparkles size={16} aria-hidden="true" />
                  <span>{t('finder.ask_ai_btn', 'Ask PradarshakAI')}</span>
                  <ArrowRight size={15} aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            VIEW 3 — NO MATCH / DISQUALIFIED
        ═══════════════════════════════════════════════════════════════════ */}
        {viewState === 'no_match' && (
          <div className="fs-no-match-card">
            <div className="fs-no-match-icon" aria-hidden="true">
              <AlertTriangle size={32} />
            </div>

            <h2 className="fs-no-match-h2">
              {t('finder.no_match_title', 'No Exact Matching Schemes Found')}
            </h2>

            {disqualificationReason && (
              <div className="fs-no-match-reason" role="note">
                <span className="fs-no-match-reason-label">
                  {t('finder.eligibility_note', 'Eligibility Information')}
                </span>
                <p className="fs-no-match-reason-text">{disqualificationReason}</p>
              </div>
            )}

            <p className="fs-no-match-desc">
              {t('finder.no_match_desc', 'Based on the criteria entered, no standard concessional scheme matched your requirements.')}
            </p>

            <div className="fs-suggestions">
              <span className="fs-suggestions-title">
                {t('finder.suggestions_title', 'Recommended next steps:')}
              </span>
              <ul className="fs-suggestions-list">
                <li>
                  {t('finder.suggestion_income', 'NSFDC concessional schemes generally require family income below ₹5,00,000 / year.')}
                </li>
                <li>
                  {t('finder.suggestion_purpose', 'Review your activity type or funding amount.')}
                </li>
                <li>
                  {t('finder.suggestion_ai', 'Consult the AI Assistant for customized recommendations.')}
                </li>
              </ul>
            </div>

            <div className="fs-no-match-actions">
              <button
                type="button"
                onClick={handleEditAnswers}
                className="fs-btn-navy"
              >
                <Edit3 size={15} aria-hidden="true" />
                <span>{t('finder.modify_answers', 'Modify Answers')}</span>
              </button>

              <button
                type="button"
                onClick={handleAskPradarshakAI}
                className="fs-btn-outline-navy"
              >
                <Sparkles size={15} color="#d97706" aria-hidden="true" />
                <span>{t('finder.ask_ai_instead', 'Ask AI Assistant')}</span>
              </button>

              <Link
                href="/schemes"
                className="fs-btn-ghost"
              >
                <span>{t('hero.cta_schemes', 'Browse All Schemes')}</span>
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
