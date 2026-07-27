'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/context';
import { STUDENT, CGPA, attPct, duesTotal, fmtDues } from '@/lib/data';
import { Card, SectionTitle } from '@/components/ui/primitives';
import type { NavId } from '@/lib/types';

export default function ProfilePage() {
  const { state, nav, student } = useApp();
  const currentStudent = student ?? STUDENT;
  const [flipped, setFlipped] = useState(false);
  const hosteller = state.persona === 'hosteller';
  const dues = duesTotal(state.paid);
  const summaryCards = [
    { label: 'Academic', big: CGPA.toFixed(2), sub: 'Data Unavailable', color: '#776cf5', mod: 'exams' as NavId },
    { label: 'Attendance', big: `${attPct()}%`, sub: 'Data Unavailable', color: '#ef4444', mod: 'attendance' as NavId },
    { label: 'Fees', big: fmtDues(state.paid), sub: dues > 0 ? 'Data Unavailable' : 'Data Unavailable', color: dues > 0 ? '#ef4444' : '#10b981', mod: 'fees' as NavId },
    { label: hosteller ? 'Hostel' : 'Transport', big: hosteller ? 'Data Unavailable' : 'Data Unavailable', sub: hosteller ? 'Data Unavailable' : 'Data Unavailable', color: '#3b82f6', mod: hosteller ? 'hostel' as NavId : 'transport' as NavId },
    { label: 'Placement', big: state.placeApp > 0 ? '1' : '0', sub: 'Data Unavailable', color: '#10b981', mod: 'placement' as NavId },
    { label: 'Documents', big: String(state.docReq.length), sub: 'Requests', color: '#d97706', mod: 'documents' as NavId },
  ];

  return (
    <div className="sc-page"><div className="profile-layout">
      <div className="profile-layout__left">
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