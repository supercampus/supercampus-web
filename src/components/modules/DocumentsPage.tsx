'use client';
import React from 'react';
import { useApp } from '@/lib/context';
import { DOC_TYPES } from '@/lib/data';
import { Card, SectionTitle, AppNotice } from '@/components/ui/primitives';

export default function DocumentsPage() {
  const { state, dispatch, toast } = useApp();

  const docReqs = state.docReq.map(r => ({
    ...r,
    color: r.status === 'Ready' ? '#10b981' : r.status === 'Rejected' ? '#ef4444' : r.status === 'Processing' ? '#d97706' : '#3b82f6',
    canDownload: r.status === 'Ready',
  }));

  return (
    <div className="sc-page">
      <SectionTitle>Available documents</SectionTitle>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
        {DOC_TYPES.map(t => (
          <button key={t} className="sc-doc-btn" onClick={() => { dispatch({ type: 'REQUEST_DOC', docType: t }); toast(t + ' requested'); }}>
            {t}
          </button>
        ))}
      </div>
      <AppNotice>Raise new document requests from the Super Campus mobile app.</AppNotice>

      <SectionTitle>My requests</SectionTitle>
      <Card style={{ overflow: 'hidden' }}>
        {docReqs.map(r => (
          <div key={r.id} className="sc-list-row">
            <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: '#9096a4', width: 80 }}>{r.id}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{r.type}</div>
              <div style={{ fontSize: 11, color: '#9096a4' }}>Requested {r.on}</div>
            </div>
            <span style={{ fontWeight: 700, fontSize: 11, color: r.color }}>{r.status}</span>
            {r.canDownload && (
              <button className="sc-btn sc-btn--green sc-btn--small" onClick={() => toast('Document downloaded')}>View signed</button>
            )}
          </div>
        ))}
      </Card>
    </div>
  );
}
