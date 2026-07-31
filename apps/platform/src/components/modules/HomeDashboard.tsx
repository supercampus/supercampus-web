'use client';

import React from 'react';
import { useApp } from '@/lib/context';
import { WEEK_BARS, CGPA, duesTotal, ICONS } from '@/lib/data';
import { Icon, Card } from '@/components/ui/primitives';
import type { NavId } from '@/lib/types';

function StatCard({ label, value, meta, change, icon, onClick }: {
  label: string;
  value: string;
  meta: string;
  change: string;
  icon: string;
  onClick: () => void;
}) {
  return (
    <button className="sc-stat-card" onClick={onClick}>
      <div className="sc-stat-card__top">
        <span className="sc-stat-card__label">{label}</span>
        <span className="sc-stat-card__icon">
          <Icon path={icon} size={17} color="var(--tenant-primary)" />
        </span>
      </div>
      <div className="sc-stat-card__value">{value}</div>
      <div className="sc-stat-card__footer">
        <span>{change}</span>
        <span>{meta}</span>
      </div>
    </button>
  );
}

export default function HomeDashboard() {
  const { state, nav } = useApp();
  const hosteller = state.persona === 'hosteller';
  const dues = duesTotal(state.paid);
  const fmtDuesStr = `Rs ${dues.toLocaleString('en-IN')}`;
  const pending = state.gp.status === 'pending' ? 1 : 0;

  const statCards = [
    { label: 'Attendance', value: '63%', meta: 'Target: 75%', change: '-12.0%', icon: ICONS.attendance, mod: 'attendance' as NavId },
    { label: 'Fee Balance', value: dues > 0 ? fmtDuesStr : 'Rs 0', meta: 'Due: Aug 02', change: dues > 0 ? 'Pending' : 'Clear', icon: ICONS.fees, mod: 'fees' as NavId },
    { label: 'Approvals', value: String(pending), meta: 'Gate pass queue', change: pending > 0 ? '+1 new' : 'No queue', icon: ICONS.gatepass, mod: 'gatepass' as NavId },
    { label: 'CGPA', value: CGPA.toFixed(2), meta: 'Last SGPA: 7.8', change: '+4.9%', icon: ICONS.exams, mod: 'exams' as NavId },
  ];

  const incomeBars = [
    { label: 'Fees', paid: 44, due: 18 },
    { label: 'Hostel', paid: 34, due: 21 },
    { label: 'Exam', paid: 52, due: 8 },
    { label: 'Library', paid: 28, due: 6 },
    { label: 'Transport', paid: hosteller ? 0 : 38, due: hosteller ? 0 : 13 },
  ];

  const activities = [
    { id: 'SC-2401', date: '30 Jul 2026', name: 'Attendance alert', category: 'Academics', status: 'Action needed', total: '63%' },
    { id: 'SC-2398', date: '29 Jul 2026', name: 'Fee reminder', category: 'Finance', status: dues > 0 ? 'Pending' : 'Completed', total: dues > 0 ? fmtDuesStr : 'Rs 0' },
    { id: 'SC-2392', date: '28 Jul 2026', name: hosteller ? 'Hostel record' : 'Route update', category: hosteller ? 'Hostel' : 'Transport', status: 'Completed', total: hosteller ? 'B-214' : '12A' },
  ];

  return (
    <div className="sc-page sc-dashboard">
      <div className="sc-home__hero">
        <div>
          <div className="sc-home__heading">Student Overview</div>
          <div className="sc-home__sub">Academic, finance, and campus status for the current term.</div>
        </div>
        <div className="sc-date-pill">
          <Icon path="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" size={15} color="#111" />
          Jul 01, 2026 - Jul 30, 2026
        </div>
      </div>

      <div className="sc-home__stats">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} onClick={() => nav(card.mod)} />
        ))}
      </div>

      <div className="sc-dashboard__analytics">
        <Card className="sc-analytics-card">
          <div className="sc-card__row-header">
            <div>
              <div className="sc-card__title">Attendance Analytics</div>
              <div className="sc-card__sub">Weekly classroom and lab participation</div>
            </div>
            <button className="sc-select-pill">This Week</button>
          </div>
          <div className="sc-bar-chart">
            {WEEK_BARS.map((bar) => (
              <div key={bar.day} className="sc-bar-chart__col">
                {bar.peak && <span className="sc-bar-chart__peak">{bar.label}</span>}
                <div className="sc-bar-chart__bar" style={{ height: bar.h }} />
                <span className="sc-bar-chart__day">{bar.day}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="sc-income-card">
          <div className="sc-card__title">Fee Split</div>
          <div className="sc-card__sub">Paid versus pending by category</div>
          <div className="sc-income-chart" aria-label="Fee split chart">
            {incomeBars.map((bar) => (
              <div key={bar.label} className="sc-income-chart__col">
                <div className="sc-income-chart__stack">
                  <span className="sc-income-chart__paid" style={{ height: `${bar.paid}%` }} />
                  <span className="sc-income-chart__due" style={{ height: `${bar.due}%` }} />
                </div>
                <span>{bar.label}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="sc-recent-card">
        <div className="sc-card__row-header">
          <div className="sc-card__title">Recent Activity</div>
          <div className="sc-table-tools">
            <div className="sc-table-search">
              <Icon path="M21 21l-4-4M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14z" size={14} color="#626262" />
              Search
            </div>
            <button className="sc-select-pill">Sort by</button>
          </div>
        </div>
        <div className="sc-activity-table">
          <div className="sc-activity-table__head">
            <span>Record Id</span>
            <span>Date</span>
            <span>Activity</span>
            <span>Category</span>
            <span>Status</span>
            <span>Value</span>
          </div>
          {activities.map((activity) => (
            <button key={activity.id} className="sc-activity-table__row" onClick={() => nav(activity.category === 'Finance' ? 'fees' : activity.category === 'Academics' ? 'attendance' : hosteller ? 'hostel' : 'transport')}>
              <span>{activity.id}</span>
              <span>{activity.date}</span>
              <span>{activity.name}</span>
              <span>{activity.category}</span>
              <span><em className={`sc-status-pill sc-status-pill--${activity.status === 'Completed' ? 'done' : 'pending'}`}>{activity.status}</em></span>
              <span>{activity.total}</span>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
