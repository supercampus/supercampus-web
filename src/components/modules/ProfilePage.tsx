'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useApp } from '@/lib/context';
import { STUDENT, CGPA, attPct, duesTotal, fmtDues } from '@/lib/data';
import { Card, SectionTitle } from '@/components/ui/primitives';
import type { NavId } from '@/lib/types';

export default function ProfilePage() {
  const { state, nav } = useApp();
  const [flipped, setFlipped] = useState(false);
  const hosteller = state.persona === 'hosteller';
  const dues = duesTotal(state.paid);

  const summaryCards = [
    { label: 'Academic', big: CGPA.toFixed(2), sub: 'CGPA · VII Sem', color: '#776cf5', mod: 'exams' as NavId },
    { label: 'Attendance', big: attPct() + '%', sub: 'Below 75% minimum', color: '#ef4444', mod: 'attendance' as NavId },
    { label: 'Fees', big: fmtDues(state.paid), sub: dues > 0 ? 'Outstanding' : 'All cleared', color: dues > 0 ? '#ef4444' : '#10b981', mod: 'fees' as NavId },
    { label: hosteller ? 'Hostel' : 'Transport', big: hosteller ? 'B-214' : '12A', sub: hosteller ? 'Block B · Bed 2' : 'Tambaram stop', color: '#3b82f6', mod: hosteller ? 'hostel' as NavId : 'transport' as NavId },
    { label: 'Placement', big: state.placeApp > 0 ? '1' : '0', sub: 'Active applications', color: '#10b981', mod: 'placement' as NavId },
    { label: 'Documents', big: String(state.docReq.length), sub: 'Requests', color: '#d97706', mod: 'documents' as NavId },
  ];

  return (
    <div className="sc-page">
      <div className="profile-layout">
        {/* Left Column: Horizontal profile card + 360 summary */}
        <div className="profile-layout__left">
          {/* Main Horizontal Profile Card */}
          <Card className="profile-horiz-card">
            <div className="profile-horiz-card__avatar">{STUDENT.initials}</div>
            <div className="profile-horiz-card__info">
              <h2 className="profile-horiz-card__name">{STUDENT.name}</h2>
              <div className="profile-horiz-card__details">
                <span>{STUDENT.roll}</span> • <span>{STUDENT.dept}</span> • <span>{STUDENT.college}</span> • <span>{STUDENT.year}</span>
              </div>
              <div className="profile-horiz-card__full-college">{STUDENT.fullCollege}</div>
            </div>
            <div className="profile-horiz-card__badge">
              <span className={`sc-badge ${hosteller ? 'sc-badge--purple' : 'sc-badge--blue'}`}>
                {hosteller ? 'Hosteller' : 'Day Scholar'}
              </span>
            </div>
          </Card>

          {/* 360 Summary Cards Grid */}
          <Card style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <SectionTitle>360° Student Summary</SectionTitle>
            <div className="profile-summary-grid">
              {summaryCards.map(c => (
                <div
                  key={c.label}
                  className="profile-summary-card"
                  onClick={() => nav(c.mod)}
                  style={{ borderLeft: `4px solid ${c.color}` }}
                >
                  <div className="profile-summary-card__label">{c.label}</div>
                  <div className="profile-summary-card__value" style={{ color: c.color }}>{c.big}</div>
                  <div className="profile-summary-card__sub">{c.sub}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Student ID Card Component with 3D Flip */}
        <div className="profile-layout__right">
          <Card className="student-id-card-wrapper">
            <div className="student-id-card-header">
              <span className="student-id-card-header__title">Student ID Card</span>
              <button
                className="sc-btn sc-btn--small sc-btn--primary"
                onClick={() => setFlipped(!flipped)}
              >
                🔄 Flip Card
              </button>
            </div>
            <div className={`student-id-3d-card ${flipped ? 'flipped' : ''}`}>
              {/* Front side */}
              <div className="student-id-3d-card__face student-id-3d-card__face--front">
                <Image
                  src="/student-id/IDF.png"
                  alt="Student ID Front"
                  fill
                  sizes="(max-width: 768px) 100vw, 340px"
                  style={{ objectFit: 'contain' }}
                  priority
                />
              </div>

              {/* Back side */}
              <div className="student-id-3d-card__face student-id-3d-card__face--back">
                <Image
                  src="/student-id/IDB.png"
                  alt="Student ID Back"
                  fill
                  sizes="(max-width: 768px) 100vw, 340px"
                  style={{ objectFit: 'contain' }}
                  priority
                />
              </div>
            </div>
            <div className="student-id-card-footer">
              Click &quot;Flip Card&quot; to toggle between front &amp; back of your physical ID.
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
