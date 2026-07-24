'use client';
import React from 'react';
import { useApp } from '@/lib/context';
import { BOOKS, CATALOG, DIGITAL_RESOURCES } from '@/lib/data';
import { Card, SectionTitle, AppNotice } from '@/components/ui/primitives';

const bookColor = (d: number) => d < 0 ? '#ef4444' : d <= 3 ? '#d97706' : '#10b981';

export default function LibraryPage() {
  const { nav } = useApp();
  const books = BOOKS.map(b => ({ ...b, color: bookColor(b.days), dueLabel: b.days < 0 ? Math.abs(b.days) + 'd overdue' : 'due in ' + b.days + 'd' }));
  const libFine = books.reduce((a, b) => a + (b.days < 0 ? Math.abs(b.days) * 5 : 0), 0);

  return (
    <div className="sc-page">
      <div className="sc-grid-libraryfix">
        <Card>
          <div className="sc-card__title" style={{ marginBottom: 16 }}>Issued books</div>
          {books.map(b => (
            <div key={b.title} className="sc-list-row">
              <div style={{ width: 34, height: 46, borderRadius: 5, background: 'linear-gradient(135deg,#e2e4ec,#f5f6fa)', border: '1px solid rgba(25,20,60,.1)', flex: 'none' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{b.title}</div>
                <div style={{ fontSize: 11, color: '#9096a4' }}>{b.author}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, fontSize: 11, color: b.color }}>{b.dueLabel}</div>
                <div style={{ fontSize: 10, color: '#9096a4', fontFamily: "'JetBrains Mono'" }}>{b.due}</div>
              </div>
            </div>
          ))}
        </Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Card>
            <div style={{ fontSize: 11, color: '#9096a4', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>Outstanding fine</div>
            <div style={{ fontWeight: 800, fontSize: 28, fontFamily: "'JetBrains Mono'", color: '#ef4444', margin: '6px 0' }}>₹{libFine}</div>
            <button className="sc-btn" onClick={() => nav('fees')}>View in Fees →</button>
          </Card>
          <Card>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Digital resources</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {DIGITAL_RESOURCES.map(d => (
                <span key={d} style={{ fontWeight: 600, fontSize: 12, background: '#f5f6fa', border: '1px solid rgba(25,20,60,.1)', color: '#a600ff', padding: '7px 13px', borderRadius: 8 }}>{d}</span>
              ))}
            </div>
          </Card>
        </div>
      </div>
      <Card style={{ marginTop: 18 }}>
        <div className="sc-card__title" style={{ marginBottom: 14 }}>Search &amp; reserve catalog</div>
        {CATALOG.map(c => (
          <div key={c.title} className="sc-list-row">
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{c.title}</div>
              <div style={{ fontSize: 11, color: '#9096a4' }}>{c.author}</div>
            </div>
            <span style={{ fontWeight: 700, fontSize: 11, color: c.color }}>{c.status}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}
