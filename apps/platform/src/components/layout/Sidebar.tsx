'use client';

import React from 'react';
import { useApp } from '@/lib/context';
import { ICONS, TITLES, STUDENT } from '@/lib/data';
import { duesTotal } from '@/lib/data';
import { Icon } from '@/components/ui/primitives';
import type { NavId } from '@/lib/types';

const GROUPS = [
  { key: 'academic', label: 'Academic', icon: 'M3 11.5 12 4l9 7.5M5 10v10h5v-6h4v6h5V10', items: ['home', 'attendance', 'exams', 'timetable'] as NavId[] },
  { key: 'campus', label: 'Campus', icon: 'M3 21h18M6 21V5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v16M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1', items: ['gatepass', 'qr', 'fees', 'hostel', 'transport', 'library', 'placement'] as NavId[] },
  { key: 'account', label: 'Account', icon: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21v-1a6 6 0 0 1 12 0v1', items: ['documents', 'profile'] as NavId[] },
];

function groupOf(id: NavId) {
  if (['home', 'attendance', 'exams', 'timetable'].includes(id)) return 'academic';
  if (['documents', 'profile'].includes(id)) return 'account';
  return 'campus';
}

export default function Sidebar() {
  const { state, nav, student, tenantBrand } = useApp();
  const currentStudent = student ?? STUDENT;
  const hosteller = state.persona === 'hosteller';
  const dues = duesTotal(state.paid);

  const badges: Record<string, string | null> = {
    fees: dues > 0 ? '!' : null,
    gatepass: state.gp.status === 'pending' ? '1' : null,
  };

  const activeGroup = groupOf(state.active);

  const campusItems: NavId[] = hosteller
    ? ['gatepass', 'qr', 'fees', 'hostel', 'library', 'placement']
    : ['gatepass', 'qr', 'fees', 'transport', 'library', 'placement'];

  const groupItems: Record<string, NavId[]> = {
    academic: ['home', 'attendance', 'exams', 'timetable'],
    campus: campusItems,
    account: ['documents', 'profile'],
  };

  const curGroupItems = groupItems[activeGroup] ?? groupItems['academic'];

  return (
    <aside className="sc-sidebar">
      {/* Rail */}
      <div className="sc-rail">
        <div className="sc-rail__logo">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
            <path d="M12 2l2.4 7.1L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.9z" />
          </svg>
        </div>
        {GROUPS.map(g => {
          const on = activeGroup === g.key;
          return (
            <button
              key={g.key}
              className={`sc-rail__btn ${on ? 'sc-rail__btn--active' : ''}`}
              title={g.label}
              onClick={() => {
                const first = groupItems[g.key]?.[0] ?? 'home';
                nav(first);
              }}
            >
              <Icon path={g.icon} size={20} color={on ? '#fff' : '#9096a4'} />
            </button>
          );
        })}
        <div style={{ flex: 1 }} />
        <button className="sc-rail__btn" title="Settings">
          <Icon path="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" size={20} color="#9096a4" />
        </button>
        <button className="sc-rail__avatar" title={currentStudent.name} onClick={() => nav('profile')}>
          {currentStudent.initials}
        </button>
      </div>

      {/* Panel */}
      <div className="sc-panel">
        <div className={`sc-panel__brand ${tenantBrand.logoDataUrl ? 'sc-panel__brand--logo' : ''}`}>
          {tenantBrand.logoDataUrl && <img src={tenantBrand.logoDataUrl} alt={`${currentStudent.college} logo`} />}
          <span>{currentStudent.college}</span>
        </div>
        {curGroupItems.map(id => {
          const on = state.active === id;
          const badge = badges[id];
          return (
            <button
              key={id}
              className={`sc-panel__item ${on ? 'sc-panel__item--active' : ''}`}
              onClick={() => nav(id)}
            >
              <Icon path={ICONS[id]} size={18} color={on ? '#776cf5' : '#9096a4'} />
              <span className="sc-panel__label">{TITLES[id]}</span>
              {badge && <span className="sc-panel__badge">{badge}</span>}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
