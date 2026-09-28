'use client';

import { Building2, Landmark, MapPin, Phone, CheckCircle2, Navigation, Globe } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export interface PartnerCardData {
  id: number;
  name: string;
  partner_type: string;
  city: string;
  state: string;
  district?: string | null;
  pin_code?: string | null;
  distance_km?: number;
  address?: string;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  fund_availability_status?: string;
  npa_percent?: number | null;
  supported_schemes?: string[];
  eligible_categories?: string[];
  verification_status?: string;
  tier?: 'GRASSROOTS' | 'APEX_SCA';
  is_escalated?: boolean;
}

const TYPE_CONFIG: Record<
  string,
  { key: string; defaultLabel: string; color: string; bg: string; border: string; Icon: React.ElementType }
> = {
  SCA:                 { key: 'partner.state_agency',        defaultLabel: 'State Agency (SCA)',        color: '#1e40af', bg: '#eff6ff', border: '#bfdbfe', Icon: Building2 },
  PSB:                 { key: 'partner.public_bank',         defaultLabel: 'Public Sector Bank',        color: '#065f46', bg: '#ecfdf5', border: '#a7f3d0', Icon: Landmark },
  RRB:                 { key: 'partner.rural_bank',          defaultLabel: 'Regional Rural Bank',       color: '#047857', bg: '#f0fdf4', border: '#bbf7d0', Icon: Landmark },
  NBFC_MFI:            { key: 'partner.nbfc_mfi',            defaultLabel: 'NBFC-MFI Partner',          color: '#6b21a8', bg: '#faf5ff', border: '#e9d5ff', Icon: Building2 },
  Cooperative_Bank:    { key: 'partner.cooperative_bank',    defaultLabel: 'Co-operative Bank',         color: '#c2410c', bg: '#fff7ed', border: '#ffedd5', Icon: Landmark },
  Other_Agency_SIDBI:  { key: 'partner.other_agency',        defaultLabel: 'Other Agencies & SIDBI',    color: '#0f766e', bg: '#f0fdfa', border: '#ccfbf1', Icon: Building2 },
  Small_Finance_Bank:  { key: 'partner.small_finance_bank',  defaultLabel: 'Small Finance Bank',        color: '#4338ca', bg: '#eef2ff', border: '#c7d2fe', Icon: Landmark },
  Cooperative_Society: { key: 'partner.cooperative_society', defaultLabel: 'Cooperative Society',       color: '#a16207', bg: '#fefce8', border: '#fef08a', Icon: Building2 },
  default:             { key: 'partner.authorized_partner',  defaultLabel: 'Authorized Partner',       color: '#334155', bg: '#f8fafc', border: '#e2e8f0', Icon: Building2 },
};

const CATEGORY_KEYS: Record<string, string> = {
  micro_finance: 'category.micro_finance',
  term_loan: 'category.term_loan',
  education_loan: 'category.education_loan',
  entrepreneurship: 'category.entrepreneurship',
  skill_development: 'category.skill_development',
};

interface PartnerResultCardProps {
  partner: PartnerCardData;
  isSelected?: boolean;
  onSelect?: () => void;
  rank?: number;
  searchedLocation?: string;
}

function GoogleMapsIcon({ size = 14 }: { size?: number }) {
  const height = size;
  const width = Math.round(size * (92.3 / 132.3));
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 92.3 132.3"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle' }}
      aria-hidden="true"
    >
      <path
        fill="#1a73e8"
        d="M60.2 2.2C55.8.8 51 0 46.1 0 32 0 19.3 6.4 10.8 16.5l21.8 18.3L60.2 2.2z"
      />
      <path
        fill="#ea4335"
        d="M10.8 16.5C4.1 24.5 0 34.9 0 46.1c0 8.7 1.7 15.7 4.6 22l28-33.3-21.8-18.3z"
      />
      <path
        fill="#4285f4"
        d="M46.2 28.5c9.8 0 17.7 7.9 17.7 17.7 0 4.3-1.6 8.3-4.2 11.4 0 0 13.9-16.6 27.5-32.7-5.6-10.8-15.3-19-27-22.7L32.6 34.8c3.3-3.8 8.1-6.3 13.6-6.3"
      />
      <path
        fill="#fbbc04"
        d="M46.2 63.8c-9.8 0-17.7-7.9-17.7-17.7 0-4.3 1.5-8.3 4.1-11.3l-28 33.3c4.8 10.6 12.8 19.2 21 29.9l34.1-40.5c-3.3 3.9-8.1 6.3-13.5 6.3"
      />
      <path
        fill="#34a853"
        d="M59.1 109.2c15.4-24.1 33.3-35 33.3-63 0-7.7-1.9-14.9-5.2-21.3L25.6 98c2.6 3.4 5.3 7.3 7.9 11.3 9.4 14.5 6.8 23.1 12.8 23.1s3.4-8.7 12.8-23.2"
      />
    </svg>
  );
}

export default function PartnerResultCard({ partner, isSelected, onSelect, searchedLocation }: PartnerResultCardProps) {
  const { t } = useLanguage();
  const meta = TYPE_CONFIG[partner.partner_type] || TYPE_CONFIG.default;
  const Icon = meta.Icon;
  const typeLabel = t(meta.key) !== meta.key ? t(meta.key) : meta.defaultLabel;

  const categories = partner.eligible_categories || partner.supported_schemes || [];
  const isVerified = !partner.verification_status || partner.verification_status === 'verified';

  const destinationAddress = [partner.name, partner.address, partner.city, partner.district, partner.state, partner.pin_code]
    .filter(Boolean)
    .join(', ');

  const isCurrentLocation = searchedLocation?.trim().toLowerCase() === 'current location';

  const mapsUrl = `https://www.google.com/maps/dir/?api=1${
    (searchedLocation && !isCurrentLocation) ? `&origin=${encodeURIComponent(searchedLocation)}` : ''
  }&destination=${encodeURIComponent(destinationAddress)}&travelmode=driving`;

  return (
    <div
      className="surface-card interactive-control focus-ring"
      tabIndex={onSelect ? 0 : undefined}
      role={onSelect ? 'button' : undefined}
      onKeyDown={(event) => {
        if (onSelect && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          onSelect();
        }
      }}
      onClick={onSelect}
      style={{
        background: '#ffffff',
        border: isSelected ? '2px solid #e87722' : '1.5px solid #e2e8f0',
        borderRadius: 18,
        padding: '20px 22px',
        boxShadow: isSelected ? '0 6px 24px rgba(232, 119, 34, 0.15)' : '0 2px 8px rgba(11,31,58,0.03)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        width: '100%',
        cursor: onSelect ? 'pointer' : 'default',
        transition: 'transform 180ms var(--ease-out), border-color 150ms ease, box-shadow 180ms var(--ease-out)',
        transform: isSelected ? 'translateY(-2px)' : 'none',
      }}
    >
      {/* ── Top Header Row: Badge & Distance ─────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: meta.bg,
              border: `1px solid ${meta.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: meta.color,
            }}
          >
            <Icon size={16} />
          </div>

          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: 20,
              background: meta.bg,
              color: meta.color,
              border: `1px solid ${meta.border}`,
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
            }}
          >
            {typeLabel}
          </span>

          {isVerified ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 10.5,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 20,
                background: '#ecfdf5',
                color: '#059669',
                border: '1px solid #a7f3d0',
              }}
            >
              <CheckCircle2 size={12} />
              <span>🟢 {t('partner.verified_branch')}</span>
            </span>
          ) : (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 10.5,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 20,
                background: '#fefce8',
                color: '#a16207',
                border: '1px solid #fef08a',
              }}
            >
              <span>🟡 {typeLabel}</span>
            </span>
          )}

          {partner.npa_percent != null && Number(partner.npa_percent) <= 7.0 && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 10.5,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 20,
                background: '#f0fdf4',
                color: '#15803d',
                border: '1px solid #bbf7d0',
              }}
            >
              <CheckCircle2 size={12} />
              <span>
                {t('partner.healthy_partner', 'HEALTHY PARTNER ({npa}% NPA)').replace(
                  '{npa}',
                  String(partner.npa_percent)
                )}
              </span>
            </span>
          )}

          {partner.tier === 'APEX_SCA' || partner.partner_type === 'SCA' ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 10.5,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 20,
                background: '#eff6ff',
                color: '#1e40af',
                border: '1px solid #bfdbfe',
              }}
            >
              <span>🏛️ {t('partner.apex_state_agency_badge', 'APEX STATE AGENCY (150 KM)')}</span>
            </span>
          ) : (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 10.5,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 20,
                background: '#f8fafc',
                color: '#475569',
                border: '1px solid #e2e8f0',
              }}
            >
              <span>🌱 {t('partner.grassroots_branch_badge', 'GRASSROOTS BRANCH (35 KM)')}</span>
            </span>
          )}

          {partner.is_escalated && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 10.5,
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: 20,
                background: '#fffbeb',
                color: '#b45309',
                border: '1px solid #fde68a',
              }}
            >
              <span>⚠️ {t('partner.escalated_channel', 'ESCALATED DIRECT CHANNEL')}</span>
            </span>
          )}
        </div>

        {partner.distance_km != null && !isNaN(Number(partner.distance_km)) && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              padding: '3px 10px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              color: '#0b1f3a',
            }}
          >
            <Navigation size={12} color="#ea580c" />
            <span>
              {Number(partner.distance_km) < 1
                ? `${Math.round(Number(partner.distance_km) * 1000)} m`
                : `${Number(partner.distance_km).toFixed(1)} km`}
            </span>
          </div>
        )}
      </div>

      {/* ── Partner Name & Address ────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0b1f3a', margin: 0, lineHeight: 1.3 }}>
          {partner.name}
        </h3>

        {partner.address && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 13, color: '#475569', lineHeight: 1.4 }}>
            <MapPin size={15} color="#94a3b8" style={{ flexShrink: 0, marginTop: 2 }} />
            <span>
              {partner.address}, {partner.city}{partner.district && partner.district !== partner.city ? `, ${partner.district}` : ''}, {partner.state} {partner.pin_code || ''}
            </span>
          </div>
        )}
      </div>

      {/* ── Supported Categories & Contacts ───────────────────────────────── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingTop: 6, borderTop: '1px solid #f1f5f9' }}>
        
        {/* Category Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {categories.map((c) => {
            const catKey = CATEGORY_KEYS[c];
            const catLabel = catKey && t(catKey) !== catKey ? t(catKey) : c.replace('_', ' ');
            return (
              <span
                key={c}
                style={{
                  fontSize: 10.5,
                  fontWeight: 600,
                  background: '#f1f5f9',
                  color: '#475569',
                  padding: '2px 8px',
                  borderRadius: 6,
                }}
              >
                {catLabel}
              </span>
            );
          })}
        </div>

        {/* Action Buttons / Links */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
          {partner.phone && (
            <a
              href={`tel:${partner.phone}`}
              onClick={(e) => e.stopPropagation()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 12px',
                borderRadius: 8,
                background: '#0b1f3a',
                color: '#ffffff',
                fontSize: 12,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              <Phone size={12} color="#fbbf24" />
              <span>{partner.phone}</span>
            </a>
          )}
          {partner.website && (
            <a
              href={partner.website}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 10px',
                borderRadius: 8,
                background: '#f1f5f9',
                color: '#0b1f3a',
                fontSize: 12,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <Globe size={12} />
              <span>{t('partner.website', 'Website')}</span>
            </a>
          )}
          {destinationAddress && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 10px',
                borderRadius: 8,
                background: '#f1f5f9',
                color: '#0b1f3a',
                fontSize: 12,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <GoogleMapsIcon size={14} />
              <span>{t('partner.maps', 'View on Google Maps')}</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
