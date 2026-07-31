'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/context';
import { STUDENT, CGPA, attPct, duesTotal, fmtDues } from '@/lib/data';
import { Card, SectionTitle } from '@/components/ui/primitives';
import type { NavId } from '@/lib/types';

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
  const hosteller = state.persona === 'hosteller';
  const dues = duesTotal(state.paid);
  const summaryCards = [
    { label: 'Academic', big: CGPA.toFixed(2), sub: 'CGPA · VII Sem', color: '#776cf5', mod: 'exams' as NavId },
    { label: 'Attendance', big: `${attPct()}%`, sub: 'Below 75% minimum', color: '#ef4444', mod: 'attendance' as NavId },
    { label: 'Fees', big: fmtDues(state.paid), sub: dues > 0 ? 'Outstanding' : 'All cleared', color: dues > 0 ? '#ef4444' : '#10b981', mod: 'fees' as NavId },
    { label: hosteller ? 'Hostel' : 'Transport', big: hosteller ? 'B-214' : '12A', sub: hosteller ? 'Block B · Bed 2' : 'Tambaram stop', color: '#3b82f6', mod: hosteller ? 'hostel' as NavId : 'transport' as NavId },
    { label: 'Placement', big: state.placeApp > 0 ? '1' : '0', sub: 'Active applications', color: '#10b981', mod: 'placement' as NavId },
    { label: 'Documents', big: String(state.docReq.length), sub: 'Requests', color: '#d97706', mod: 'documents' as NavId },
  ];

  async function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast('Upload an image logo');
      return;
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const palette = await extractLogoPalette(dataUrl);
    setTenantBrand({ logoDataUrl: dataUrl, ...palette });
    toast('Tenant logo and dashboard colors updated');
  }

  function resetBrand() {
    setTenantBrand({ logoDataUrl: null, primary: '#0b3d2e', secondary: '#b9f43b', surface: '#eef7e8' });
    toast('Tenant branding reset');
  }

  return (
    <div className="sc-page"><div className="profile-layout">
      <div className="profile-layout__left">
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
        <Card className="profile-horiz-card">
          <div className="profile-horiz-card__avatar">{currentStudent.initials}</div>
          <div className="profile-horiz-card__info">
            <h2 className="profile-horiz-card__name">{currentStudent.name}</h2>
            <div className="profile-horiz-card__details"><span>{currentStudent.roll}</span> • <span>{currentStudent.dept}</span> • <span>{currentStudent.college}</span> • <span>{currentStudent.year}</span></div>
            <div className="profile-horiz-card__full-college">{currentStudent.fullCollege}</div>
          </div>
          <span className={`sc-badge ${hosteller ? 'sc-badge--purple' : 'sc-badge--blue'}`}>{hosteller ? 'Hosteller' : 'Day Scholar'}</span>
        </Card>
        <Card style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <SectionTitle>360° Student Summary</SectionTitle>
          <div className="profile-summary-grid">{summaryCards.map((card) => (
            <button key={card.label} className="profile-summary-card" onClick={() => nav(card.mod)} style={{ borderLeft: `4px solid ${card.color}`, borderTop: 0, borderRight: 0, borderBottom: 0, textAlign: 'left' }}>
              <div className="profile-summary-card__label">{card.label}</div><div className="profile-summary-card__value" style={{ color: card.color }}>{card.big}</div><div className="profile-summary-card__sub">{card.sub}</div>
            </button>
          ))}</div>
        </Card>
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
