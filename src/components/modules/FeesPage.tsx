'use client';
import React from 'react';
import { useApp } from '@/lib/context';
import { FEE_ITEMS, PAY_HISTORY, duesTotal } from '@/lib/data';
import { Card, SectionTitle, AppNotice } from '@/components/ui/primitives';

const fmt = (n: number) => '₹' + n.toLocaleString('en-IN');

export default function FeesPage() {
  const { state, dispatch, toast } = useApp();
  const dues = duesTotal(state.paid);
  const fmtDues = fmt(dues);
  const hasDues = dues > 0;
  const pay = state.pay;

  const feeComponents = FEE_ITEMS.map(f => ({
    ...f, paid: state.paid[f.key as keyof typeof state.paid],
    amountLabel: state.paid[f.key as keyof typeof state.paid] ? 'Cleared' : fmt(f.amount),
    statusColor: state.paid[f.key as keyof typeof state.paid] ? '#10b981' : f.key === 'hostel' ? '#ef4444' : '#d97706',
    statusText: state.paid[f.key as keyof typeof state.paid] ? 'Paid' : f.key === 'hostel' ? 'Overdue' : 'Due',
  }));

  // Fines breakdown
  const finesBreakdown = [
    { name: 'Data Unavailable', amount: 0, color: '#c3c6d0' },
  ];

  function startPay(key: string) { dispatch({ type: 'PAY_START', comp: key }); }
  function setPlan(plan: string) { dispatch({ type: 'PAY_SET', key: 'plan', value: plan }); }
  function setMode(mode: string) { dispatch({ type: 'PAY_SET', key: 'mode', value: mode }); }
  function confirm() {
    dispatch({ type: 'PAY_SET', key: 'step', value: '4' });
    setTimeout(() => { dispatch({ type: 'PAY_CONFIRM_SUCCESS' }); toast('Payment successful'); }, 1100);
  }
  function closePay() { dispatch({ type: 'PAY_CLOSE' }); }

  return (
    <div className="sc-page">
      {hasDues && (
        <div className="sc-alert sc-alert--red" style={{ marginBottom: 18 }}>
          <span className="sc-alert__dot" style={{ background: '#ef4444' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 13.5 }}>{fmtDues} outstanding</div>
            <div style={{ fontSize: 12, color: '#6c7280' }}>Overdue fees affect your exam registration eligibility.</div>
          </div>
        </div>
      )}
      <div className="sc-grid-2col-fees">
        <Card>
          <div className="sc-card__title" style={{ marginBottom: 16 }}>Fee components</div>
          {feeComponents.map(f => (
            <div key={f.key} className="sc-list-row">
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{f.name}</div>
                <div style={{ fontSize: 11.5, color: '#9096a4' }}>Due {f.due}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, fontSize: 14, fontFamily: "'JetBrains Mono'", color: f.statusColor }}>{f.amountLabel}</div>
                <div style={{ fontWeight: 700, fontSize: 10, color: f.statusColor }}>{f.statusText}</div>
              </div>
            </div>
          ))}
        </Card>
        <Card style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          {/* Fines breakdown */}
          <div style={{ width: '100%', marginBottom: 16, padding: '12px 13px', background: '#fff8ec', border: '1px solid #ffe6bd', borderRadius: 11 }}>
            <div style={{ fontWeight: 700, fontSize: 11, color: '#6c7280', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>Pending fees &amp; fines</div>
            {finesBreakdown.map(f => (
              <div key={f.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#3a3d4a', padding: '4px 0' }}>
                <span>{f.name}</span>
                <b style={{ fontFamily: "'JetBrains Mono'", color: f.color }}>₹{f.amount.toLocaleString('en-IN')}</b>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 12, color: '#9096a4', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>Total outstanding</div>
          <div style={{ fontWeight: 800, fontSize: 38, fontFamily: "'JetBrains Mono'", color: '#ef4444', margin: '8px 0' }}>{fmtDues}</div>
          <AppNotice>Payments are made via the mobile app or campus counter.</AppNotice>
        </Card>
      </div>

      {/* Fines section */}
      <SectionTitle>Fines</SectionTitle>
      <Card style={{ padding: '8px 20px' }}>
        <details style={{ borderBottom: '1px solid rgba(25,20,60,.06)', padding: '13px 0' }}>
          <summary style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', listStyle: 'none', fontSize: 13, fontWeight: 600, color: '#141527' }}>
            <span style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(239,68,68,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', fontSize: 16 }}>!</span>
            <span style={{ flex: 1 }}>
              <span style={{ display: 'block' }}>Data Unavailable</span>
              <span style={{ display: 'block', fontSize: 11, color: '#9096a4', fontWeight: 500, marginTop: 3 }}>Data Unavailable</span>
            </span>
            <span style={{ fontWeight: 700, fontSize: 13, fontFamily: "'JetBrains Mono'", color: '#ef4444' }}>₹0</span>
          </summary>
          <div style={{ margin: '10px 0 2px 42px', padding: '11px 13px', background: '#fff8f8', borderLeft: '3px solid #ef4444', borderRadius: '0 8px 8px 0', fontSize: 11.5, color: '#6c7280', lineHeight: 1.55 }}>
            <b style={{ color: '#3a3d4a' }}>Data Unavailable</b><br />
            Data Unavailable
          </div>
        </details>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0 8px', fontSize: 11, color: '#9096a4' }}>
          <span>0 imposed fines</span>
          <b style={{ fontFamily: "'JetBrains Mono'", color: '#ef4444' }}>₹0 pending</b>
        </div>
      </Card>

      {/* Pay flow */}
      {pay.step > 0 && (
        <Card style={{ border: '1px solid rgba(70,20,220,.28)', marginTop: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
            <div className="sc-card__title">Pay {FEE_ITEMS.find(f => f.key === pay.comp)?.name} · {fmt(FEE_ITEMS.find(f => f.key === pay.comp)?.amount ?? 0)}</div>
            <div style={{ flex: 1 }} />
            <button onClick={closePay} style={{ background: 'none', border: 'none', color: '#9096a4', fontSize: 20, cursor: 'pointer' }}>×</button>
          </div>
          {pay.step === 1 && (
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="sc-pay-btn" onClick={() => setPlan('Full Payment')}>Full Payment<div className="sc-pay-btn__sub">Pay now</div></button>
              <button className="sc-pay-btn" onClick={() => setPlan('Installment')}>Installment<div className="sc-pay-btn__sub">Split into 2 parts</div></button>
            </div>
          )}
          {pay.step === 2 && (
            <div style={{ display: 'flex', gap: 12 }}>
              {['UPI', 'Card', 'Net Banking'].map(m => (
                <button key={m} className="sc-pay-btn" onClick={() => setMode(m)}>{m}</button>
              ))}
            </div>
          )}
          {pay.step === 3 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: '#6c7280', marginBottom: 14 }}>Confirm payment via {pay.mode} ({pay.plan})</div>
              <button className="sc-btn sc-btn--primary" onClick={confirm}>Confirm &amp; Pay</button>
            </div>
          )}
          {pay.step === 4 && <div style={{ textAlign: 'center', padding: 10, color: '#6c7280', fontSize: 13 }}>Connecting to payment gateway…</div>}
          {pay.step === 5 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(52,211,153,.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.6"><path d="M20 6 9 17l-5-5" /></svg>
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#10b981' }}>Payment successful</div>
              <div style={{ fontSize: 12.5, color: '#6c7280', marginTop: 4 }}>Receipt available in history.</div>
              <button className="sc-btn" style={{ marginTop: 14 }} onClick={closePay}>Done</button>
            </div>
          )}
        </Card>
      )}

      <SectionTitle>Payment history</SectionTitle>
      <Card style={{ overflow: 'hidden' }}>
        {PAY_HISTORY.map(p => (
          <div key={p.id} className="sc-list-row">
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{p.desc}</div>
              <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: '#9096a4' }}>{p.id} · {p.date} · {p.mode}</div>
            </div>
            <div style={{ fontWeight: 700, fontSize: 13, fontFamily: "'JetBrains Mono'", color: '#141527', width: 80, textAlign: 'right' }}>{p.amount}</div>
            <span style={{ fontWeight: 700, fontSize: 11, color: p.status === 'Success' ? '#10b981' : p.status === 'Failed' ? '#ef4444' : '#d97706', width: 64 }}>{p.status}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}
