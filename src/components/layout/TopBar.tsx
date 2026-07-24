'use client';

import React from 'react';
import { useApp } from '@/lib/context';
import { STUDENT, TITLES, duesTotal } from '@/lib/data';
import { Icon } from '@/components/ui/primitives';
import type { NavId } from '@/lib/types';

export default function TopBar() {
  const { state, nav, dispatch, toast } = useApp();
  const hosteller = state.persona === 'hosteller';
  const dues = duesTotal(state.paid);

  const banners = [];
  if (dues > 0) banners.push({ title: 'Hostel fee overdue', accent: '#ef4444' });
  if (63 < 75) banners.push({ title: 'Attendance below 75%', accent: '#d97706' });
  if (state.gp.status === 'pending') banners.push({ title: 'Gate pass pending', accent: '#d97706' });

  function handleTogglePersona() {
    dispatch({ type: 'TOGGLE_PERSONA' });
    const next = state.persona === 'hosteller' ? 'Day Scholar' : 'Hosteller';
    toast(`Switched to ${next} view`);
  }

  return (
    <header className="sc-topbar">
      <div className="sc-topbar__title">{state.active === 'home' ? 'Dashboard' : TITLES[state.active]}</div>
      <div style={{ flex: 1 }} />
      <div className="sc-topbar__search">
        <svg style={{ position: 'absolute', left: 11, top: 9 }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9096a4" strokeWidth="2">
          <circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" />
        </svg>
        <input placeholder="Search modules, circulars…" className="sc-topbar__search-input" />
      </div>
      <button className="sc-topbar__persona" onClick={handleTogglePersona}>
        <span>{hosteller ? 'Hosteller' : 'Day Scholar'}</span>
        <span className={`sc-topbar__persona-tag ${hosteller ? 'sc-topbar__persona-tag--hosteller' : 'sc-topbar__persona-tag--dayscholar'}`}>
          ECE · 4Y
        </span>
      </button>
      <div style={{ position: 'relative' }}>
        <button className="sc-topbar__icon-btn" onClick={() => dispatch({ type: 'TOGGLE_NOTIF' })}>
          <Icon path="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" size={18} color="#6c7280" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
          {banners.length > 0 && (
            <span className="sc-topbar__notif-badge">{banners.length}</span>
          )}
        </button>
        {state.notifOpen && (
          <div className="sc-notif-panel">
            <div className="sc-notif-panel__header">
              <span className="sc-notif-panel__title">Notifications</span>
              <span className="sc-badge sc-badge--red">{banners.length} new</span>
            </div>
            {dues > 0 && (
              <div className="sc-notif-panel__item" onClick={() => { nav('fees'); dispatch({ type: 'TOGGLE_NOTIF' }); }}>
                <div className="sc-notif-panel__icon" style={{ background: '#ef444422' }}>
                  <Icon path="M2 7h20v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2zM2 11h20" size={17} color="#ef4444" />
                </div>
                <div className="sc-notif-panel__body">
                  <div className="sc-notif-panel__item-title">Hostel fee overdue — ₹42,000</div>
                  <div className="sc-notif-panel__item-sub">Due 15 Jul 2026 · affects exam registration</div>
                </div>
                <span className="sc-badge" style={{ background: '#ef444422', color: '#ef4444' }}>Overdue</span>
              </div>
            )}
            {63 < 75 && (
              <div className="sc-notif-panel__item" onClick={() => { nav('attendance'); dispatch({ type: 'TOGGLE_NOTIF' }); }}>
                <div className="sc-notif-panel__icon" style={{ background: '#d9770622' }}>
                  <Icon path="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" size={17} color="#d97706" />
                </div>
                <div className="sc-notif-panel__body">
                  <div className="sc-notif-panel__item-title">Attendance at 63% — below the 75% minimum</div>
                  <div className="sc-notif-panel__item-sub">Condonation required. Approved OD/Leave is counted as attended.</div>
                </div>
                <span className="sc-badge" style={{ background: '#d9770622', color: '#d97706' }}>Warning</span>
              </div>
            )}
            <div className="sc-notif-panel__footer">Actions are available in the mobile app</div>
          </div>
        )}
      </div>
      <button className="sc-topbar__profile" onClick={() => nav('profile')}>
        <div className="sc-topbar__avatar">{STUDENT.initials}</div>
        <div>
          <div className="sc-topbar__profile-name">{STUDENT.name}</div>
          <div className="sc-topbar__profile-sub">{STUDENT.roll} · {STUDENT.college}</div>
        </div>
      </button>
    </header>
  );
}
