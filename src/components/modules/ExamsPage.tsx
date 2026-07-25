'use client';
import React from 'react';
import { useApp } from '@/lib/context';
import { INTERNALS, RESULTS, ARREARS, stepper, attPct, duesTotal, CGPA, SGPA } from '@/lib/data';
import { Card, SectionTitle, AppNotice, Stepper } from '@/components/ui/primitives';

export default function ExamsPage() {
  const { state, dispatch, toast } = useApp();
  const attOk = attPct() >= 75;
  const paid = state.paid;
  const feesOk = duesTotal(paid) === 0;
  const eligible = attOk && feesOk;
  const reasons = [];
  if (!attOk) reasons.push(`Attendance ${attPct()}% is below the 75% minimum`);
  if (!feesOk) reasons.push(`Outstanding fees of ₹${duesTotal(paid).toLocaleString('en-IN')}`);
  const examReg = state.examReg;
  const stepItems = stepper(['Submitted', 'Verified', 'Approved'], examReg > 0 ? examReg - 1 : -1);

  const assignments = [
    { title: 'DSP — Assignment 2', due: 'Due 20 Jul', status: 'Submitted', color: '#10b981' },
    { title: 'VLSI — Lab Record', due: 'Due 22 Jul', status: 'Late Submission', color: '#d97706' },
    { title: 'Antennas — Assignment 3', due: 'Due 28 Jul', status: state.asg.a3 === 'Submitted' ? 'Submitted' : 'Not Submitted', color: state.asg.a3 === 'Submitted' ? '#10b981' : '#ef4444', open: state.asg.a3 !== 'Submitted' },
  ];

  function registerExam() {
    if (!eligible) { toast('Not eligible to register'); return; }
    dispatch({ type: 'SET_EXAM_REG', val: 1 });
    setTimeout(() => dispatch({ type: 'SET_EXAM_REG', val: 2 }), 900);
    setTimeout(() => dispatch({ type: 'SET_EXAM_REG', val: 3 }), 1900);
  }

  return (
    <div className="sc-page">
      {eligible ? (
        <div className="sc-alert sc-alert--green" style={{ marginBottom: 18 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.4"><path d="M20 6 9 17l-5-5" /></svg>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#10b981' }}>Eligible to register</div>
        </div>
      ) : (
        <div className="sc-alert sc-alert--red" style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span className="sc-alert__dot" style={{ background: '#ef4444' }} />
            <div style={{ fontWeight: 700, fontSize: 14, color: '#ef4444' }}>Not eligible to register</div>
          </div>
          {reasons.map((r, i) => <div key={i} style={{ fontSize: 12.5, color: '#3a3d4a', paddingLeft: 19, lineHeight: 1.7 }}>• {r}</div>)}
        </div>
      )}

      <Card style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 18 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: '#9096a4', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>Upcoming</div>
          <div style={{ fontWeight: 800, fontSize: 18, marginTop: 3 }}>End Semester — VII Sem</div>
          <div style={{ fontSize: 12.5, color: '#6c7280', marginTop: 2 }}>Begins 12 Aug 2026 · in 19 days</div>
        </div>
        {examReg > 0 ? (
          <Stepper steps={stepItems} direction="horizontal" />
        ) : (
          eligible
            ? <span className="sc-badge" style={{ background: 'rgba(52,211,153,.14)', color: '#10b981', cursor: 'pointer', padding: '7px 13px' }} onClick={registerExam}>Register via app</span>
            : <span className="sc-badge" style={{ background: '#eceef4', color: '#9096a4', padding: '7px 13px' }}>Registration locked</span>
        )}
      </Card>

      <div className="sc-grid-2col">
        <Card>
          <div className="sc-card__title" style={{ marginBottom: 14 }}>Assignments</div>
          {assignments.map((a, i) => (
            <div key={i} className="sc-list-row">
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{a.title}</div>
                <div style={{ fontSize: 11, color: '#9096a4' }}>{a.due}</div>
              </div>
              <span style={{ fontWeight: 700, fontSize: 11, color: a.color }}>{a.status}</span>
              {'open' in a && a.open && (
                <button className="sc-btn sc-btn--small" onClick={() => { dispatch({ type: 'SUBMIT_ASG' }); toast('Assignment submitted'); }}>Submit</button>
              )}
            </div>
          ))}
        </Card>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
            <div className="sc-card__title">Internal Marks</div>
            <span className="sc-badge" style={{ marginLeft: 'auto', color: '#d97706', background: 'rgba(251,191,36,.14)' }}>Provisional</span>
          </div>
          {INTERNALS.map(m => (
            <div key={m.subj} className="sc-list-row" style={{ borderTop: '1px solid rgba(25,20,60,.06)' }}>
              <div style={{ flex: 1, fontWeight: 600, fontSize: 12.5, color: '#3a3d4a' }}>{m.subj}</div>
              <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 12, color: '#6c7280' }}>CIA1 {m.cia1} · CIA2 {m.cia2}</div>
            </div>
          ))}
          <div style={{ fontSize: 11, color: '#9096a4', marginTop: 10 }}>Marks are provisional until locked by HOD.</div>
        </Card>
      </div>

      <Card style={{ marginTop: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <div className="sc-card__title">Results — VI Sem</div>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', gap: 20 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 800, fontSize: 20, fontFamily: "'JetBrains Mono'", color: '#776cf5' }}>{SGPA}</div>
              <div style={{ fontSize: 10, color: '#9096a4', fontWeight: 600 }}>SGPA</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 800, fontSize: 20, fontFamily: "'JetBrains Mono'", color: '#10b981' }}>{CGPA.toFixed(2)}</div>
              <div style={{ fontSize: 10, color: '#9096a4', fontWeight: 600 }}>CGPA</div>
            </div>
          </div>
        </div>
        <div className="sc-grid-2col">
          {RESULTS.map(r => (
            <div key={r.subj} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#f5f6fa', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ flex: 1, fontWeight: 600, fontSize: 12.5, color: '#3a3d4a' }}>{r.subj}</div>
              <span style={{ fontWeight: 800, fontSize: 14, fontFamily: "'JetBrains Mono'", color: r.color }}>{r.grade}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card style={{ marginTop: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
          <div className="sc-card__title">Arrear / Backlog tracker</div>
          <button className="sc-btn" style={{ marginLeft: 'auto' }}>View transcript</button>
        </div>
        {ARREARS.map((a, i) => (
          <div key={i} className="sc-list-row">
            <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: '#9096a4', width: 64 }}>{a.code}</div>
            <div style={{ flex: 1, fontWeight: 600, fontSize: 13 }}>{a.subj}</div>
            <span style={{ fontWeight: 700, fontSize: 11, color: a.color }}>{a.status}</span>
            {a.status === 'Pending' && (
              <button className="sc-btn sc-btn--small" onClick={() => { dispatch({ type: 'REQ_REVAL', subj: a.subj }); toast('Revaluation requested for ' + a.subj); }}>
                {state.reval[a.subj] ? state.reval[a.subj] : 'Request Reval'}
              </button>
            )}
          </div>
        ))}
      </Card>
    </div>
  );
}
