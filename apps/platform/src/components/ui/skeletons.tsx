import React from 'react';
import { Card, Skeleton } from './primitives';

export function PortalPageSkeleton() {
  return (
    <main className="sc-page" aria-busy="true" aria-label="Loading page">
      <div className="mb-5 flex items-end gap-4">
        <div className="flex-1 space-y-3">
          <Skeleton width={118} height={11} radius={5} />
          <Skeleton width="min(360px, 72%)" height={30} />
          <Skeleton width="min(520px, 88%)" height={13} radius={6} />
        </div>
        <Skeleton width={120} height={38} radius={10} />
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <Card key={item} className="space-y-3">
            <Skeleton width={42} height={42} radius={11} />
            <Skeleton width="72%" height={13} radius={6} />
            <Skeleton width="45%" height={26} radius={7} />
          </Card>
        ))}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card className="space-y-3">
          <Skeleton width="34%" height={20} radius={7} />
          {[0, 1, 2, 3].map((item) => <Skeleton key={item} height={62} radius={12} />)}
        </Card>
        <Card className="space-y-3">
          <Skeleton width="44%" height={20} radius={7} />
          <Skeleton height={236} radius={14} />
        </Card>
      </div>
    </main>
  );
}

export function TimetableSheetSkeleton() {
  return (
    <div className="flex min-h-[70vh] flex-1 flex-col overflow-hidden border border-slate-200 bg-white" aria-busy="true" aria-label="Loading timetable">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div className="space-y-2"><Skeleton width={270} height={25} /><Skeleton width={390} height={11} /></div>
        <Skeleton width={42} height={38} radius={7} />
      </div>
      <div className="flex gap-3 overflow-hidden border-b border-slate-200 p-3">
        {[252, 278, 245].map((width) => <Skeleton key={width} width={width} height={42} radius={9} />)}
      </div>
      <div className="flex gap-3 border-b border-slate-200 p-3">
        <Skeleton width={180} height={40} radius={7} /><Skeleton width="52%" height={40} radius={7} />
      </div>
      <div className="flex gap-3 overflow-hidden border-b border-slate-200 p-4">
        {[0, 1, 2, 3, 4, 5].map((item) => <Skeleton key={item} width={190} height={64} radius={8} />)}
      </div>
      <div className="grid flex-1 grid-cols-[140px_repeat(7,minmax(130px,1fr))] gap-px overflow-hidden bg-slate-200 p-px">
        {Array.from({ length: 32 }, (_, item) => <Skeleton key={item} height={88} radius={0} />)}
      </div>
    </div>
  );
}

export function PublishedTimetableSkeleton() {
  return (
    <div className="grid gap-3" aria-busy="true" aria-label="Loading published timetable">
      {[0, 1, 2].map((day) => (
        <Card key={day} style={{ padding: 0, overflow: 'hidden' }}>
          <div className="border-b border-[#e8eaf1] p-[13px_17px]"><Skeleton width={104} height={18} /></div>
          {[0, 1, 2].map((row) => (
            <div key={row} className="grid grid-cols-[88px_minmax(160px,1fr)_minmax(120px,.7fr)_132px] items-center gap-3 border-t border-[#eef0f5] p-[15px_17px]">
              <div className="space-y-2"><Skeleton width={50} height={14} /><Skeleton width={78} height={10} /></div>
              <div className="space-y-2"><Skeleton width="68%" height={16} /><Skeleton width="42%" height={11} /></div>
              <div className="space-y-2"><Skeleton width="72%" height={13} /><Skeleton width="46%" height={10} /></div>
              <Skeleton width={132} height={36} radius={9} />
            </div>
          ))}
        </Card>
      ))}
    </div>
  );
}

export function RosterSkeleton() {
  return (
    <div className="px-5 py-3" aria-busy="true" aria-label="Loading students">
      <Skeleton width={145} height={13} />
      {[0, 1, 2, 3, 4, 5].map((row) => (
        <div key={row} className="grid grid-cols-[1fr_250px] items-center gap-3 border-b border-[#eef0f5] py-3">
          <div className="space-y-2"><Skeleton width={170} height={14} /><Skeleton width={82} height={10} /></div>
          <div className="flex gap-1"><Skeleton width={58} height={30} /><Skeleton width={58} height={30} /><Skeleton width={44} height={30} /><Skeleton width={58} height={30} /></div>
        </div>
      ))}
    </div>
  );
}

export function DataWorkspaceSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="min-h-[320px] bg-[var(--crm-card)]" aria-busy="true" aria-label="Loading workspace">
      <div className="flex items-center justify-between border-b border-[var(--crm-border)] px-5 py-5">
        <div className="space-y-2"><Skeleton width={210} height={20} /><Skeleton width={390} height={11} /></div>
        <div className="flex gap-2"><Skeleton width={38} height={36} radius={7} /><Skeleton width={112} height={36} radius={7} /></div>
      </div>
      <div className="grid border-b border-[var(--crm-border)] sm:grid-cols-4">
        {[0, 1, 2, 3].map((item) => <div key={item} className="space-y-2 border-r border-[var(--crm-border)] px-5 py-4"><Skeleton width="58%" height={10} /><Skeleton width="38%" height={22} /></div>)}
      </div>
      <div className="space-y-px bg-[var(--crm-border)]">
        {Array.from({ length: rows }, (_, row) => <div key={row} className="grid grid-cols-[1.2fr_.8fr_1fr_.7fr] gap-4 bg-[var(--crm-card)] px-5 py-4"><Skeleton height={14} /><Skeleton height={14} /><Skeleton height={14} /><Skeleton height={30} radius={7} /></div>)}
      </div>
    </div>
  );
}
