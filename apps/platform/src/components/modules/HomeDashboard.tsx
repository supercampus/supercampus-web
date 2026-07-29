'use client';

import React from 'react';
import { useApp } from '@/lib/context';
import { WEEK_BARS, NEXT_CLASS, NOTICES, CGPA, duesTotal, fmtDues, ICONS, SCHEDULE } from '@/lib/data';
import { Icon, Card, SectionTitle } from '@/components/ui/primitives';
import type { NavId } from '@/lib/types';

function StatCard({ label, value, tone, delta, dir, icon, onClick }: {
  label: string; value: string; tone: string; delta: string; dir: 'up' | 'down'; icon: string; onClick: () => void;
}) {
  const colors: Record<string, string> = { red: '#ef4444', amber: '#d97706', green: '#10b981', purple: '#776cf5', blue: '#3b82f6' };
  const col = colors[tone] ?? '#776cf5';
  return (
    <button className="sc-stat-card" onClick={onClick} style={{ background: col + '0d', border: `1px solid ${col}33` }}>
      <div className="sc-stat-card__top">
        <div className="sc-stat-card__icon" style={{ background: col + '22' }}>
          <Icon path={icon} size={17} color={col} />
        </div>
        <span className="sc-stat-card__label">{label}</span>
        <span className="sc-stat-card__badge" style={{ fontWeight: 700, fontSize: 9, color: '#fff', background: col, padding: '4px 8px', borderRadius: 20 }}>
          {dir === 'down' ? '↓' : '↑'} {tone.toUpperCase()}
        </span>
      </div>
      <div className="sc-stat-card__value" style={{ color: col }}>{value}</div>
      <div className="sc-stat-card__delta">{delta}</div>
    </button>
  );
}

export default function HomeDashboard() {
  const { state, nav } = useApp();
  const hosteller = state.persona === 'hosteller';
  const dues = duesTotal(state.paid);
  const fmtDuesStr = fmtDues(state.paid);
  const attPct = 63;
  const pending = state.gp.status === 'pending' ? 1 : 0;

  const statCards = [
    { label: 'Attendance', value: attPct + '%', tone: 'red', delta: '12% below the 75% minimum', dir: 'down' as const, icon: ICONS.attendance, mod: 'attendance' as NavId },
    { label: 'Outstanding Fees', value: dues > 0 ? fmtDuesStr : '₹0', tone: dues > 0 ? 'amber' : 'green', delta: dues > 0 ? 'Due 02 Aug 2026' : 'All cleared', dir: dues > 0 ? 'down' as const : 'up' as const, icon: ICONS.fees, mod: 'fees' as NavId },
    { label: 'Pending Approvals', value: String(pending), tone: 'purple', delta: pending > 0 ? 'Gate pass awaiting' : 'Nothing pending', dir: 'up' as const, icon: ICONS.gatepass, mod: 'gatepass' as NavId },
    { label: 'CGPA', value: CGPA.toFixed(2), tone: 'green', delta: 'VII Sem · SGPA 7.8', dir: 'up' as const, icon: ICONS.exams, mod: 'exams' as NavId },
  ];

  const R = 52; const circ = 2 * Math.PI * R;
  const semP = 68;
  const semGauge = { pct: semP, circ: circ.toFixed(1), offset: (circ * (1 - semP / 100)).toFixed(1) };

  const homeModules = [
    { id: 'attendance', label: 'Attendance', meta: '63% · critical', c: '#ef4444' },
    { id: 'fees', label: 'Fees', meta: dues > 0 ? fmtDuesStr + ' due' : 'Cleared', c: '#f59e0b' },
    { id: 'exams', label: 'Exams', meta: 'Reg opens soon', c: '#10b981' },
    { id: 'timetable', label: 'Timetable', meta: '5 classes today', c: '#3b82f6' },
    hosteller ? { id: 'hostel', label: 'Hostel', meta: 'Room B-214', c: '#8b5cf6' } : { id: 'transport', label: 'Transport', meta: 'Route 12A', c: '#8b5cf6' },
    { id: 'library', label: 'Library', meta: '1 due soon', c: '#ec4899' },
  ] as const;

  return (
    <div className="sc-page">
      {/* Header row */}
      <div className="sc-home__hero">
        <div>
          <div className="sc-home__heading">Dashboard</div>
          <div className="sc-home__sub">A read-only snapshot of your academic and campus records.</div>
        </div>
        <div style={{ flex: 1 }} />
        <div className="sc-chip sc-chip--purple">
          <Icon path="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" size={14} color="#6a5cf0" />
          View-only access
        </div>
        <div className="sc-chip">AY 2025–26 · Odd Sem</div>
      </div>

      {/* Stat cards */}
      <div className="sc-home__stats">
        {statCards.map(c => (
          <StatCard key={c.label} {...c} onClick={() => nav(c.mod)} />
        ))}
      </div>

      {/* Middle row */}
      <div className="sc-home__mid">
        {/* Attendance analytics */}
        <Card>
          <div className="sc-card__row-header">
            <div className="sc-card__title">Attendance Analytics</div>
            <span className="sc-badge" style={{ background: 'rgba(119,108,245,.12)', color: '#776cf5' }}>Avg 78%</span>
          </div>
          <div className="sc-bar-chart">
            {WEEK_BARS.map(w => (
              <div key={w.day} className="sc-bar-chart__col">
                {w.peak && <span className="sc-bar-chart__peak">{w.label}</span>}
                <div className="sc-bar-chart__bar" style={{ height: w.h, background: w.fill }} />
                <span className="sc-bar-chart__day">{w.day}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Up Next */}
        <Card style={{ background: 'linear-gradient(155deg,#f4f1ff,#efe8ff)', border: '1px solid #e4dbff' }}>
          <div className="sc-card__row-header">
            <div className="sc-up-next__icon">
              <Icon path="M12 8v4l3 2M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z" size={17} color="#fff" />
            </div>
            <span className="sc-card__title">Up Next</span>
          </div>
          <div className="sc-up-next__subject">{NEXT_CLASS.subject}</div>
          <div className="sc-up-next__meta">{NEXT_CLASS.room} · {NEXT_CLASS.kind}</div>
          <div className="sc-up-next__time">
            <span className="sc-up-next__time-val">{NEXT_CLASS.time}</span>
            <span className="sc-up-next__note">Attendance window opens at class start</span>
          </div>
        </Card>

        {/* My Modules */}
        <Card>
          <div className="sc-card__row-header">
            <div className="sc-card__title">My Modules</div>
            <button className="sc-link" onClick={() => nav('profile')}>All →</button>
          </div>
          <div className="sc-module-list">
            {homeModules.map(m => (
              <button key={m.id} className="sc-module-item" onClick={() => nav(m.id as NavId)}>
                <div className="sc-module-item__icon" style={{ background: m.c + '1a' }}>
                  <Icon path={ICONS[m.id]} size={16} color={m.c} />
                </div>
                <div className="sc-module-item__body">
                  <div className="sc-module-item__label">{m.label}</div>
                  <div className="sc-module-item__meta">{m.meta}</div>
                </div>
                <Icon path="M9 6l6 6-6 6" size={15} color="#c3c6d0" strokeWidth={2.4} />
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="sc-home__bottom">
        {/* Semester Progress */}
        <Card style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ alignSelf: 'flex-start' }} className="sc-card__title">Semester Progress</div>
          <div className="sc-donut" style={{ width: 134, height: 134, margin: '6px 0' }}>
            <svg width="134" height="134" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
              <defs>
                <linearGradient id="semg" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#1400ff" />
                  <stop offset="1" stopColor="#a600ff" />
                </linearGradient>
              </defs>
              <circle cx="60" cy="60" r="52" fill="none" stroke="#eceef4" strokeWidth="13" />
              <circle cx="60" cy="60" r="52" fill="none" stroke="url(#semg)" strokeWidth="13" strokeLinecap="round"
                strokeDasharray={semGauge.circ} strokeDashoffset={semGauge.offset} />
            </svg>
            <div className="sc-donut__center">
              <div className="sc-donut__val">{semGauge.pct}%</div>
              <div className="sc-donut__sub">completed</div>
            </div>
          </div>
          <div className="sc-empty__sub">VII Sem · 12 of 18 weeks done</div>
        </Card>

        {/* Quick Actions */}
        <Card>
          <div className="sc-card__title" style={{ marginBottom: 14 }}>Quick Actions</div>
          <div className="sc-qa-grid">
            {[
              { label: 'Apply Gate Pass', sub: 'Exit / leave request', icon: ICONS.gatepass, c: '#a600ff', tint: 'rgba(119,108,245,.14)', mod: 'gatepass' as NavId },
              { label: 'Pay Fees', sub: dues > 0 ? fmtDuesStr + ' due' : 'All cleared', icon: ICONS.fees, c: '#ef4444', tint: 'rgba(248,113,113,.14)', mod: 'fees' as NavId },
              hosteller
                ? { label: 'Hostel Status', sub: 'Room B-214 · mess', icon: ICONS.hostel, c: '#3b82f6', tint: 'rgba(63,140,255,.14)', mod: 'hostel' as NavId }
                : { label: 'Bus Status', sub: 'Route 12A · live', icon: ICONS.transport, c: '#3b82f6', tint: 'rgba(63,140,255,.14)', mod: 'transport' as NavId },
              { label: 'QR History', sub: 'Scans & access log', icon: ICONS.qr, c: '#10b981', tint: 'rgba(52,211,153,.13)', mod: 'qr' as NavId },
            ].map(qa => (
              <button key={qa.label} className="sc-qa-btn" onClick={() => nav(qa.mod)}>
                <div className="sc-qa-btn__icon" style={{ background: qa.tint }}>
                  <Icon path={qa.icon} size={18} color={qa.c} />
                </div>
                <div className="sc-qa-btn__label">{qa.label}</div>
                <div className="sc-qa-btn__sub">{qa.sub}</div>
              </button>
            ))}
          </div>
        </Card>

        {/* Notices */}
        <Card>
          <div className="sc-card__title" style={{ marginBottom: 14 }}>Circulars</div>
          {NOTICES.map((n, i) => (
            <div key={i} className="sc-notice-item">
              <div className="sc-notice-item__dot" style={{ background: n.dot }} />
              <div>
                <div className="sc-notice-item__title">{n.title}</div>
                <div className="sc-notice-item__preview">{n.preview}</div>
                <div className="sc-notice-item__date">{n.date}</div>
              </div>
            </div>
          ))}
        </Card>

        {/* Countdown */}
        <div className="sc-countdown-card">
          <div className="sc-countdown-card__row">
            <Icon path="M12 8v4l3 2M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z" size={15} color="#fff" />
            <span>Next class in</span>
          </div>
          <div className="sc-countdown-card__val">{/* countdown handled by layout */}01:24:08</div>
          <div className="sc-countdown-card__sub">{NEXT_CLASS.subject} · {NEXT_CLASS.time}</div>
          <div className="sc-countdown-card__room">
            <Icon path="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0zM12 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" size={13} color="#fff" />
            {NEXT_CLASS.room}
          </div>
        </div>
      </div>
    </div>
  );
}
