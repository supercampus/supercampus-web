'use client';

import React, { useMemo, useState } from 'react';
import { Layers, Monitor, Search, Smartphone, TabletSmartphone } from 'lucide-react';

type CrudAction = 'create' | 'read' | 'update' | 'delete';
type FlowStep = {
  id: string;
  order: number;
  title: string;
  description: string;
  type: string;
  crud: CrudAction[];
};
type ModuleFlow = {
  id: string;
  moduleKey: string;
  name: string;
  summary: string;
  steps: FlowStep[];
};
type ModuleFlowCatalog = {
  moduleKey: string;
  source: string;
  deliveryTargets: string[];
  overview: string;
  navigation: string[];
  workflows: ModuleFlow[];
};

const targetLabels: Record<string, string> = {
  'flutter-student-app': 'Student app',
  'flutter-parent-app': 'Parent app',
  'flutter-staff-app': 'Staff app',
  'public-web': 'Public web',
  'web-admin': 'Admin web',
  'web-staff': 'Staff web',
};

function titleFromKey(value: string) {
  return value
    .split('-')
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(' ');
}

function targetIcon(target: string) {
  if (target.startsWith('flutter-')) return <Smartphone size={14} />;
  if (target === 'public-web') return <Monitor size={14} />;
  return <TabletSmartphone size={14} />;
}

export default function ModuleFlowExplorer({ catalogs }: { catalogs: ModuleFlowCatalog[] }) {
  const sortedCatalogs = useMemo(
    () => [...catalogs].sort((a, b) => titleFromKey(a.moduleKey).localeCompare(titleFromKey(b.moduleKey))),
    [catalogs],
  );
  const allTargets = useMemo(
    () => Array.from(new Set(sortedCatalogs.flatMap((catalog) => catalog.deliveryTargets))).sort(),
    [sortedCatalogs],
  );
  const [activeModule, setActiveModule] = useState(sortedCatalogs[0]?.moduleKey ?? '');
  const [target, setTarget] = useState('all');
  const [query, setQuery] = useState('');

  const visibleCatalogs = sortedCatalogs.filter((catalog) => {
    const matchesTarget = target === 'all' || catalog.deliveryTargets.includes(target);
    const haystack = `${catalog.moduleKey} ${catalog.navigation.join(' ')} ${catalog.workflows.map((flow) => `${flow.name} ${flow.summary}`).join(' ')}`.toLowerCase();
    const matchesQuery = !query.trim() || haystack.includes(query.trim().toLowerCase());
    return matchesTarget && matchesQuery;
  });

  const selectedCatalog = visibleCatalogs.find((catalog) => catalog.moduleKey === activeModule) ?? visibleCatalogs[0] ?? sortedCatalogs[0];

  return (
    <main className="min-h-screen bg-[#f5f1eb] text-[#111111]">
      <div className="mx-auto max-w-[1440px] px-6 py-6">
        <header className="flex flex-col gap-5 border-b border-[#ddd3c8] pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#5b57ff]">
              <Layers size={15} />
              Module flow registry
            </div>
            <h1 className="mt-3 text-[34px] leading-tight font-normal">Flutter app module flows</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#64596b]">
              These are the generated product flows from the imported zip documents. The web dashboard uses this screen to inspect and govern the flows; the Flutter apps can consume the matching JSON files.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-[220px_220px]">
            <label className="flex h-11 items-center gap-2 rounded-[8px] border border-[#ddd3c8] bg-white px-3 text-sm text-[#64596b]">
              <Search size={15} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search flows"
                className="min-w-0 flex-1 bg-transparent text-[#111111] outline-none"
              />
            </label>
            <select
              value={target}
              onChange={(event) => setTarget(event.target.value)}
              className="h-11 rounded-[8px] border border-[#ddd3c8] bg-white px-3 text-sm text-[#111111] outline-none"
            >
              <option value="all">All targets</option>
              {allTargets.map((item) => (
                <option key={item} value={item}>{targetLabels[item] ?? item}</option>
              ))}
            </select>
          </div>
        </header>

        <section className="grid gap-5 pt-5 lg:grid-cols-[320px_1fr]">
          <aside className="rounded-[8px] border border-[#ddd3c8] bg-white p-3">
            <div className="px-2 pb-3 text-xs uppercase tracking-[0.16em] text-[#7b7280]">
              Modules
            </div>
            <div className="grid gap-2">
              {visibleCatalogs.map((catalog) => {
                const active = catalog.moduleKey === selectedCatalog?.moduleKey;
                return (
                  <button
                    key={catalog.moduleKey}
                    type="button"
                    onClick={() => setActiveModule(catalog.moduleKey)}
                    className={`rounded-[8px] border px-3 py-3 text-left transition ${active ? 'border-[#1f2a74] bg-[#1f2a74] text-white' : 'border-[#eee7df] bg-[#fbfaf8] text-[#111111] hover:border-[#bbb0a6]'}`}
                  >
                    <div className="text-sm font-normal">{titleFromKey(catalog.moduleKey)}</div>
                    <div className={`mt-1 text-xs ${active ? 'text-[#e8e6ff]' : 'text-[#64596b]'}`}>
                      {catalog.workflows.length} flows / {catalog.navigation.length} navigation items
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {selectedCatalog && (
            <section className="grid gap-5">
              <div className="rounded-[8px] border border-[#ddd3c8] bg-white p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="text-2xl font-normal">{titleFromKey(selectedCatalog.moduleKey)}</h2>
                    <p className="mt-2 max-w-4xl text-sm leading-6 text-[#64596b]">
                      {selectedCatalog.overview || 'Flow source imported from the module workflow document.'}
                    </p>
                    <p className="mt-2 text-xs text-[#7b7280]">{selectedCatalog.source}</p>
                  </div>
                  <div className="flex max-w-xl flex-wrap gap-2">
                    {selectedCatalog.deliveryTargets.map((item) => (
                      <span key={item} className="inline-flex items-center gap-1 rounded-full border border-[#ddd3c8] bg-[#f7f3ee] px-3 py-1 text-xs text-[#3d3544]">
                        {targetIcon(item)}
                        {targetLabels[item] ?? item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="grid gap-4">
                  {selectedCatalog.workflows.map((flow) => (
                    <article key={flow.id} className="rounded-[8px] border border-[#ddd3c8] bg-white p-5">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="text-lg font-normal">{flow.name}</h3>
                          <p className="mt-1 text-sm text-[#64596b]">{flow.summary}</p>
                        </div>
                        <span className="rounded-full bg-[#eef7e8] px-3 py-1 text-xs text-[#0b3d2e]">
                          {flow.steps.length} steps
                        </span>
                      </div>
                      <div className="mt-4 grid gap-3">
                        {flow.steps.map((step) => (
                          <div key={step.id} className="grid gap-3 rounded-[8px] border border-[#eee7df] bg-[#fbfaf8] p-3 sm:grid-cols-[42px_1fr_190px]">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm text-[#1f2a74]">
                              {step.order}
                            </div>
                            <div>
                              <div className="text-sm font-normal">{step.title}</div>
                              <div className="mt-1 text-xs leading-5 text-[#64596b]">{step.description}</div>
                            </div>
                            <div className="flex flex-wrap content-start gap-2">
                              <span className="rounded-full bg-white px-2 py-1 text-[11px] uppercase tracking-[0.12em] text-[#64596b]">{step.type}</span>
                              {step.crud.map((action) => (
                                <span key={action} className="rounded-full bg-[#eeeaff] px-2 py-1 text-[11px] text-[#2c258f]">{action}</span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>

                <aside className="rounded-[8px] border border-[#ddd3c8] bg-white p-5 xl:sticky xl:top-5 xl:self-start">
                  <h3 className="text-base font-normal">Navigation Surface</h3>
                  <div className="mt-4 grid gap-2">
                    {selectedCatalog.navigation.slice(0, 28).map((item) => (
                      <div key={item} className="rounded-[8px] bg-[#fbfaf8] px-3 py-2 text-sm text-[#3d3544]">
                        {item}
                      </div>
                    ))}
                    {selectedCatalog.navigation.length > 28 && (
                      <div className="px-3 py-2 text-xs text-[#7b7280]">
                        +{selectedCatalog.navigation.length - 28} more
                      </div>
                    )}
                  </div>
                </aside>
              </div>
            </section>
          )}
        </section>
      </div>
    </main>
  );
}
