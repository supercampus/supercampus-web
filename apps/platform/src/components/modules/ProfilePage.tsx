'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/context';
import { uploadMedia } from '@/lib/api';
import { ICONS, STUDENT, CGPA, attPct, duesTotal, fmtDues } from '@/lib/data';
import { Card, Icon } from '@/components/ui/primitives';
import type { NavId } from '@/lib/types';

/**
 * One tappable destination. `value` is the live figure the row is about — the
 * reason to open it — and `tone` colours it when it needs attention. A row with
 * a static subtitle would only restate its own title.
 */
interface MenuRow {
  id: string;
  icon: string;
  title: string;
  sub: string;
  value?: string;
  tone?: string;
  onOpen: () => void;
}

const CHEVRON = 'M9 6l6 6-6 6';
const CARD_ICON = 'M2 7h20v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2zM2 11h20';
const HELP_ICON = 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM9.5 9a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.1 1-1.1 1.8M12 17h.01';
const SETTINGS_ICON = 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2 2 2 0 1 1-4 0 1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3 15a2 2 0 1 1 0-4 1.7 1.7 0 0 0 1.4-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 10 4a2 2 0 1 1 4 0 1.7 1.7 0 0 0 2.9 1.4l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.7 1.7 0 0 0 21 11a2 2 0 1 1 0 4z';

function MenuList({ label, rows }: { label: string; rows: MenuRow[] }) {
  return (
    <>
      <div className="profile-menu__group">{label}</div>
      <div className="profile-menu">
        {rows.map((row) => (
          <button key={row.id} type="button" className="profile-menu__row" onClick={row.onOpen}>
            <span className="profile-menu__icon">
              <Icon path={row.icon} size={18} />
            </span>
            <span className="profile-menu__text">
              <span className="profile-menu__title">{row.title}</span>
              <span className="profile-menu__sub">{row.sub}</span>
            </span>
            {row.value && (
              <span className="profile-menu__value" style={row.tone ? { color: row.tone } : undefined}>
                {row.value}
              </span>
            )}
            <Icon path={CHEVRON} size={16} className="profile-menu__chev" />
          </button>
        ))}
      </div>
    </>
  );
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

function mixWithWhite(hex: string, amount = 0.9) {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return rgbToHex(
    Math.round(r + (255 - r) * amount),
    Math.round(g + (255 - g) * amount),
    Math.round(b + (255 - b) * amount)
  );
}

async function extractLogoPalette(dataUrl: string) {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });

  const canvas = document.createElement('canvas');
  const size = 96;
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return { primary: '#0b3d2e', secondary: '#b9f43b', surface: '#eef7e8' };

  context.drawImage(image, 0, 0, size, size);
  const pixels = context.getImageData(0, 0, size, size).data;
  const buckets = new Map<string, { r: number; g: number; b: number; count: number; score: number }>();

  for (let i = 0; i < pixels.length; i += 16) {
    const alpha = pixels[i + 3];
    if (alpha < 160) continue;
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max - min;
    const brightness = (r + g + b) / 3;
    if (brightness > 235 || brightness < 24 || saturation < 22) continue;

    const key = `${Math.round(r / 24) * 24},${Math.round(g / 24) * 24},${Math.round(b / 24) * 24}`;
    const existing = buckets.get(key) ?? { r: 0, g: 0, b: 0, count: 0, score: 0 };
    existing.r += r;
    existing.g += g;
    existing.b += b;
    existing.count += 1;
    existing.score += saturation + (brightness < 180 ? 30 : 0);
    buckets.set(key, existing);
  }

  const colors = Array.from(buckets.values())
    .map((bucket) => ({
      hex: rgbToHex(Math.round(bucket.r / bucket.count), Math.round(bucket.g / bucket.count), Math.round(bucket.b / bucket.count)),
      score: bucket.score * Math.sqrt(bucket.count),
    }))
    .sort((a, b) => b.score - a.score);

  const primary = colors[0]?.hex ?? '#0b3d2e';
  const secondary = colors.find((color) => color.hex !== primary)?.hex ?? '#b9f43b';
  return { primary, secondary, surface: mixWithWhite(primary) };
}

export default function ProfilePage() {
  const { state, nav, student, tenantBrand, setTenantBrand, toast } = useApp();
  const currentStudent = student ?? STUDENT;
  const [flipped, setFlipped] = useState(false);
  const [showBranding, setShowBranding] = useState(false);
  const hosteller = state.persona === 'hosteller';
  const dues = duesTotal(state.paid);
  const attendance = attPct();
  const go = (module: NavId) => () => nav(module);

  /** Everything the student came here to reach, with its current state on it. */
  const academicRows: MenuRow[] = [
    {
      id: 'attendance',
      icon: ICONS.attendance,
      title: 'Attendance',
      sub: attendance >= 75 ? 'Meeting the 75% requirement' : 'Below the 75% exam requirement',
      value: `${attendance}%`,
      tone: attendance >= 75 ? 'var(--success)' : 'var(--danger)',
      onOpen: go('attendance'),
    },
    {
      id: 'exams',
      icon: ICONS.exams,
      title: 'Exam results',
      sub: 'Marks, CGPA and semester history',
      value: CGPA.toFixed(2),
      onOpen: go('exams'),
    },
    {
      id: 'timetable',
      icon: ICONS.timetable,
      title: 'Timetable',
      sub: 'Your weekly class schedule',
      onOpen: go('timetable'),
    },
    {
      id: 'library',
      icon: ICONS.library,
      title: 'Library',
      sub: 'Borrowed books and due dates',
      onOpen: go('library'),
    },
  ];

  const campusRows: MenuRow[] = [
    {
      id: 'fees',
      icon: ICONS.fees,
      title: 'Fees & payments',
      sub: dues > 0 ? 'Outstanding balance — pay your bill' : 'All dues cleared',
      value: fmtDues(state.paid),
      tone: dues > 0 ? 'var(--danger)' : 'var(--success)',
      onOpen: go('fees'),
    },
    hosteller
      ? {
          id: 'hostel',
          icon: ICONS.hostel,
          title: 'Hostel',
          sub: 'Block B · Bed 2 · mess and room details',
          value: 'B-214',
          onOpen: go('hostel'),
        }
      : {
          id: 'transport',
          icon: ICONS.transport,
          title: 'Transport',
          sub: 'Tambaram stop · route and timings',
          value: '12A',
          onOpen: go('transport'),
        },
    {
      id: 'documents',
      icon: ICONS.documents,
      title: 'Documents',
      sub: state.docReq.length > 0 ? 'Requests in progress' : 'Request certificates and transcripts',
      value: state.docReq.length > 0 ? String(state.docReq.length) : undefined,
      tone: 'var(--warning)',
      onOpen: go('documents'),
    },
    {
      id: 'placement',
      icon: ICONS.placement,
      title: 'Placement',
      sub: state.placeApp > 0 ? 'Active applications' : 'Browse eligible drives',
      value: state.placeApp > 0 ? String(state.placeApp) : undefined,
      tone: 'var(--success)',
      onOpen: go('placement'),
    },
    {
      id: 'gatepass',
      icon: ICONS.gatepass,
      title: 'Gate pass',
      sub: 'Request and track campus exits',
      onOpen: go('gatepass'),
    },
    {
      id: 'qr',
      icon: ICONS.qr,
      title: 'QR history',
      sub: 'Where your campus code has been scanned',
      onOpen: go('qr'),
    },
  ];

  const accountRows: MenuRow[] = [
    {
      id: 'id-card',
      icon: CARD_ICON,
      title: 'Digital ID card',
      sub: flipped ? 'Showing the back — tap to flip' : 'Your campus identity, tap to flip',
      onOpen: () => setFlipped((current) => !current),
    },
    {
      id: 'branding',
      icon: SETTINGS_ICON,
      title: 'Tenant appearance',
      sub: showBranding ? 'Hide logo and colour settings' : 'College logo and dashboard colours',
      onOpen: () => setShowBranding((current) => !current),
    },
    {
      id: 'support',
      icon: HELP_ICON,
      title: 'Help & support',
      sub: 'Reach campus administration',
      onOpen: () => toast('Contact your campus administration office for support'),
    },
  ];

  async function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast('Upload an image logo');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    try {
      const palette = await extractLogoPalette(previewUrl);
      const uploaded = await uploadMedia(file);
      setTenantBrand({ logoDataUrl: uploaded.data.secureUrl, ...palette });
      toast('Tenant logo and dashboard colors updated');
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Unable to upload tenant logo');
    } finally {
      URL.revokeObjectURL(previewUrl);
      event.target.value = '';
    }
  }

  function resetBrand() {
    setTenantBrand({ logoDataUrl: null, primary: '#0b3d2e', secondary: '#b9f43b', surface: '#eef7e8' });
    toast('Tenant branding reset');
  }

  return (
    <div className="sc-page"><div className="profile-layout">
      <div className="profile-layout__left">
        {/* Identity first: who you are, then everywhere you can go. */}
        <div className="profile-hero">
          <div className="profile-hero__avatar">{currentStudent.initials}</div>
          <div className="profile-hero__info">
            <h2 className="profile-hero__name">{currentStudent.name}</h2>
            {/* The demo student carries no email, so fall back to the roll. */}
            <div className="profile-hero__meta">{student?.email ?? currentStudent.roll}</div>
            <div className="profile-hero__tags">
              <span className="profile-hero__tag">{currentStudent.roll}</span>
              <span className="profile-hero__tag">{currentStudent.year}</span>
              <span className="profile-hero__tag">{hosteller ? 'Hosteller' : 'Day Scholar'}</span>
            </div>
          </div>
          <button
            type="button"
            className="profile-hero__action"
            onClick={() => nav('qr')}
            aria-label="Open your campus QR code"
            title="Campus QR code"
          >
            <Icon path={ICONS.qr} size={17} />
          </button>
        </div>

        <MenuList label="Academics" rows={academicRows} />
        <MenuList label="Campus life" rows={campusRows} />
        <MenuList label="Account" rows={accountRows} />

        {/* Kept, but demoted behind its own row — it is a settings task, not
            something a student reads on the way past. */}
        {showBranding && (
          <Card className="tenant-brand-card">
            <div>
              <div className="tenant-brand-card__eyebrow">Tenant settings</div>
              <h2 className="tenant-brand-card__title">College logo colors sync the dashboard</h2>
              <p className="tenant-brand-card__copy">Upload the tenant college logo. The dashboard samples the logo and applies those colors to navigation, cards, charts, and highlights.</p>
            </div>
            <div className="tenant-brand-card__body">
              <div className="tenant-brand-card__preview">
                {tenantBrand.logoDataUrl ? <img src={tenantBrand.logoDataUrl} alt={`${currentStudent.college} logo preview`} /> : <span>{currentStudent.college.slice(0, 1)}</span>}
              </div>
              <div className="tenant-brand-card__controls">
                <label className="tenant-brand-card__upload">
                  Upload logo
                  <input type="file" accept="image/*" onChange={handleLogoUpload} />
                </label>
                <button type="button" className="tenant-brand-card__reset" onClick={resetBrand}>Reset</button>
                <div className="tenant-brand-card__swatches">
                  <span style={{ background: tenantBrand.primary }} />
                  <span style={{ background: tenantBrand.secondary }} />
                  <span style={{ background: tenantBrand.surface }} />
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      <div className="profile-layout__right"><Card className="student-id-card-wrapper">
        <div className="student-id-card-header"><span className="student-id-card-header__title">Student ID Card</span><button className="sc-btn sc-btn--small sc-btn--primary" onClick={() => setFlipped(!flipped)}>↻ Flip Card</button></div>
        <div className={`student-id-3d-card ${flipped ? 'flipped' : ''}`}>
          <div className="student-id-3d-card__face student-id-3d-card__face--front sc-id-face">
            <div className="sc-id-face__header"><span className="sc-id-face__logo">✦</span><div><strong>{currentStudent.college}</strong><span>{currentStudent.fullCollege}</span></div></div>
            <div className="sc-id-face__avatar">{currentStudent.initials}</div>
            <h3>{currentStudent.name}</h3><p>{currentStudent.dept}</p>
            <dl><div><dt>Roll number</dt><dd>{currentStudent.roll}</dd></div><div><dt>Year</dt><dd>{currentStudent.year}</dd></div><div><dt>Category</dt><dd>{hosteller ? 'Hosteller' : 'Day Scholar'}</dd></div></dl>
            <div className="sc-id-face__footer"><span>STUDENT</span><span>VALID 2026–27</span></div>
          </div>
          <div className="student-id-3d-card__face student-id-3d-card__face--back sc-id-face sc-id-face--back">
            <div className="sc-id-face__back-logo">✦</div><h3>Super Campus Identity</h3><p>This card belongs to an active student of {currentStudent.fullCollege}.</p>
            <dl><div><dt>Student ID</dt><dd>{currentStudent.roll}</dd></div><div><dt>College tenant</dt><dd>{currentStudent.college}</dd></div><div><dt>Emergency</dt><dd>Contact college administration</dd></div></dl>
            <div className="sc-id-face__barcode" aria-hidden="true" /><small>If found, return this card to the campus administration office.</small>
          </div>
        </div>
        <div className="student-id-card-footer">Your digital ID is generated from your authenticated college profile.</div>
      </Card></div>
    </div></div>
  );
}
