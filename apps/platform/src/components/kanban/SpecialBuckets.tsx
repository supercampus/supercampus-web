'use client';

import React from 'react';
import type { Lead } from '@/lib/kanban/kanban-data';
import { Calendar, Pause, Archive, Rocket } from 'lucide-react';

interface SpecialBucketsProps {
  onDrop?: (bucketId: string, lead?: Lead) => void;
}

export default function SpecialBuckets({ onDrop }: SpecialBucketsProps) {
  const buckets = [
    { id: 'prospect', label: 'Prospect', icon: Rocket, desc: 'Select Intake', accent: '#776cf5' },
    { id: 'deferred', label: 'Deferred', icon: Calendar, desc: 'Select Intake', accent: '#de6cf5' },
    { id: 'on-hold', label: 'On Hold', icon: Pause, desc: 'Student', accent: '#a600ff' },
    { id: 'archive-bucket', label: 'Archive', icon: Archive, desc: 'Permanent', accent: '#6f6875' },
  ];

  return (
    <div className="flex gap-3 mt-3 shrink-0">
      {buckets.map((bucket) => {
        const Icon = bucket.icon;
        return (
          <div
            key={bucket.id}
            className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-[var(--crm-border)] bg-[var(--crm-panel)] hover:bg-[var(--crm-surface)] transition-colors cursor-pointer group"
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = bucket.accent; }}
            onDragLeave={(e) => { e.currentTarget.style.borderColor = ''; }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.style.borderColor = '';
              try {
                const data = JSON.parse(e.dataTransfer.getData('application/json')) as Lead;
                onDrop?.(bucket.id, data);
              } catch {
                // ignore
              }
            }}
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors group-hover:scale-110"
              style={{ backgroundColor: `${bucket.accent}14` }}
            >
              <Icon size={18} style={{ color: bucket.accent }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--crm-text)]">{bucket.label}</p>
              <p className="text-[10px] text-[var(--crm-muted)] font-medium">{bucket.desc}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
