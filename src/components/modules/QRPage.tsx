'use client';

import React from 'react';
import { useApp } from '@/lib/context';
import { QR_TODAY, QR_YESTERDAY, ICONS } from '@/lib/data';
import { Card, SectionTitle, AppNotice, Icon } from '@/components/ui/primitives';

export default function QRPage() {
  const { toast } = useApp();

  const qrFeatures = [
    { name: 'Attendance QR', sub: 'Class & lab check-in', c: '#776cf5' },
    { name: 'Mess QR', sub: 'Meal opt-in scan', c: '#10b981' },
    { name: 'Library QR', sub: 'Issue & return', c: '#3b82f6' },
    { name: 'Gate QR', sub: 'Entry / exit pass', c: '#a600ff' },
  ];

  return (
    <div className="sc-page">
      {/* Top Banner */}
      <Card style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 18 }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(119,108,245,.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
          <Icon path={ICONS.qr} size={32} color="#776cf5" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>Digital Student QR Pass</div>
          <div style={{ fontSize: 12.5, color: '#6c7280', marginTop: 2 }}>
            Dynamic QR code used across campus scanners for attendance, mess entry, library checkouts, and gate validation.
          </div>
        </div>
        <button className="sc-btn sc-btn--primary" onClick={() => toast('QR Scanner active')}>
          Open Mobile Scanner
        </button>
      </Card>

      {/* Feature Pills */}
      <div className="sc-grid-2col" style={{ marginBottom: 18 }}>
        {qrFeatures.map(f => (
          <Card key={f.name} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: f.c + '1e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon path={ICONS.qr} size={18} color={f.c} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13.5 }}>{f.name}</div>
              <div style={{ fontSize: 11.5, color: '#9096a4' }}>{f.sub}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Scans Today */}
      <SectionTitle>Scans Today (0)</SectionTitle>
      <Card style={{ overflow: 'hidden', marginBottom: 18 }}>
        {QR_TODAY.map((s, i) => (
          <div key={i} className="sc-list-row">
            <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 12, color: '#9096a4', width: 72 }}>{s.time}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{s.loc}</div>
              <div style={{ fontSize: 11.5, color: '#6c7280' }}>{s.purpose}</div>
            </div>
            <span className="sc-badge" style={{ background: s.status === 'Success' ? '#10b9811e' : s.status === 'Flagged' ? '#d977061e' : '#ef44441e', color: s.status === 'Success' ? '#10b981' : s.status === 'Flagged' ? '#d97706' : '#ef4444' }}>
              {s.status}
            </span>
          </div>
        ))}
      </Card>

      {/* Scans Yesterday */}
      <SectionTitle>Yesterday</SectionTitle>
      <Card style={{ overflow: 'hidden' }}>
        {QR_YESTERDAY.map((s, i) => (
          <div key={i} className="sc-list-row">
            <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 12, color: '#9096a4', width: 72 }}>{s.time}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{s.loc}</div>
              <div style={{ fontSize: 11.5, color: '#6c7280' }}>{s.purpose}</div>
            </div>
            <span className="sc-badge" style={{ background: s.status === 'Success' ? '#10b9811e' : s.status === 'Flagged' ? '#d977061e' : '#ef44441e', color: s.status === 'Success' ? '#10b981' : s.status === 'Flagged' ? '#d97706' : '#ef4444' }}>
              {s.status}
            </span>
          </div>
        ))}
      </Card>
      <AppNotice>All QR scans generate encrypted, time-stamped access tokens.</AppNotice>
    </div>
  );
}
