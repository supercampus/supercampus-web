'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Loader2, Check, AlertTriangle } from 'lucide-react';
import { createCampus, getCampuses, saveCampusGeofence } from '@/lib/api';
import { useApp } from '@/lib/context';
import type { Campus, CampusGeofence } from '@/lib/types';

/** Leaflet touches `window` on import, so it must never run during SSR. */
const CampusGeofenceMap = dynamic(
  () => import('./CampusGeofenceMap').then((m) => m.CampusGeofenceMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[360px] w-full items-center justify-center rounded-xl border border-[var(--crm-border)] text-xs text-[var(--crm-muted)]">
        Loading map…
      </div>
    ),
  },
);

/** Matches the bounds the API enforces; the slider cannot offer a value the
 *  server would reject. */
const MIN_RADIUS = 50;

/** The slider's ceiling. The API accepts up to 20km, but a campus that needs
 *  more than 2km is better typed into the coordinate fields than dragged. */
const MAX_SLIDER_RADIUS = 2000;

/** Where the marker starts when a campus has no fence yet. Somewhere on land
 *  and obviously wrong beats 0,0, which looks like a real answer. */
const DEFAULT_GEOFENCE: CampusGeofence = {
  latitude: 13.0827,
  longitude: 80.2707,
  radiusMetres: 400,
};

type SaveState = { kind: 'idle' } | { kind: 'saving' } | { kind: 'saved' } | { kind: 'error'; message: string };

export function CampusGeofenceSettings({ canEdit }: { canEdit: boolean }) {
  const { student } = useApp();
  const [campuses, setCampuses] = useState<Campus[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CampusGeofence | null>(null);
  const [fenceEnabled, setFenceEnabled] = useState(true);
  const [save, setSave] = useState<SaveState>({ kind: 'idle' });
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await getCampuses();
        if (cancelled) return;
        const list = response.data.campuses;
        setCampuses(list);
        const first = list[0];
        if (first) {
          setSelectedId(first.id);
          setDraft(first.geofence ?? DEFAULT_GEOFENCE);
          setFenceEnabled(Boolean(first.geofence));
        }
      } catch (error) {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : 'Could not load campuses.');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const selected = useMemo(
    () => campuses?.find((campus) => campus.id === selectedId) ?? null,
    [campuses, selectedId],
  );

  const selectCampus = useCallback((campus: Campus) => {
    setSelectedId(campus.id);
    setDraft(campus.geofence ?? DEFAULT_GEOFENCE);
    setFenceEnabled(Boolean(campus.geofence));
    setSave({ kind: 'idle' });
  }, []);

  const commit = useCallback(async () => {
    if (!selected || !draft) return;
    setSave({ kind: 'saving' });
    try {
      const response = await saveCampusGeofence(selected.id, fenceEnabled ? draft : null);
      setCampuses((current) =>
        (current ?? []).map((campus) => (campus.id === response.data.id ? response.data : campus)),
      );
      setSave({ kind: 'saved' });
    } catch (error) {
      setSave({ kind: 'error', message: error instanceof Error ? error.message : 'Could not save the fence.' });
    }
  }, [selected, draft, fenceEnabled]);

  if (loadError) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
        <p className="text-xs font-extrabold">Campuses could not be loaded</p>
        <p className="mt-1 text-[11px] leading-5">{loadError}</p>
      </div>
    );
  }

  if (!campuses) {
    return <div className="text-xs text-[var(--crm-muted)]">Loading campuses…</div>;
  }

  // A tenant with no campus row has nothing to attach a fence to. Saying so is
  // the whole job here: the previous build left this case spinning on
  // "Loading campuses…" forever, which reads as a broken screen rather than an
  // empty one.
  if (campuses.length === 0) {
    return (
      <FirstCampus
        tenantName={student?.tenant.name ?? 'This tenant'}
        canEdit={canEdit}
        onCreated={(campus) => {
          setCampuses([campus]);
          setSelectedId(campus.id);
          setDraft(campus.geofence ?? DEFAULT_GEOFENCE);
          setFenceEnabled(Boolean(campus.geofence));
        }}
      />
    );
  }

  if (!draft || !selected) {
    return <div className="text-xs text-[var(--crm-muted)]">Loading campuses…</div>;
  }

  const dirty =
    fenceEnabled !== Boolean(selected.geofence) ||
    draft.latitude !== selected.geofence?.latitude ||
    draft.longitude !== selected.geofence?.longitude ||
    draft.radiusMetres !== selected.geofence?.radiusMetres;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
        <p className="text-xs font-extrabold">
          What this controls{student?.tenant.name ? ` — ${student.tenant.name}` : ''}
        </p>
        <p className="mt-1 text-[11px] leading-5">
          A student&apos;s daily entry QR only activates inside this circle. Move the pin to your gate
          and set the radius to cover the campus. Too tight and students standing inside will be
          refused, because a phone&apos;s location is only accurate to a few tens of metres.
        </p>
      </div>

      {campuses.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {campuses.map((campus) => (
            <button
              key={campus.id}
              type="button"
              onClick={() => selectCampus(campus)}
              className={`rounded-lg border px-3 py-2 text-xs font-extrabold ${
                campus.id === selectedId
                  ? 'border-[var(--crm-accent,#1A6B3C)] bg-[var(--crm-panel)] text-[var(--crm-text)]'
                  : 'border-[var(--crm-border)] text-[var(--crm-muted)]'
              }`}
            >
              {campus.name}
            </button>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-[var(--crm-border)] bg-[var(--crm-card)] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[var(--crm-muted)]">Campus</p>
            <h3 className="mt-1 flex items-center gap-2 text-xl">
              <MapPin size={18} aria-hidden /> {selected.name}
            </h3>
            <p className="mt-1 text-[11px] text-[var(--crm-muted)]">
              {selected.geofence
                ? `Fence set at ${selected.geofence.latitude}, ${selected.geofence.longitude} · ${selected.geofence.radiusMetres}m`
                : 'No fence set — entry QRs currently activate from anywhere.'}
            </p>
          </div>
          <label className="flex items-center gap-2 text-xs font-extrabold text-[var(--crm-text)]">
            <input
              type="checkbox"
              checked={fenceEnabled}
              disabled={!canEdit}
              onChange={(event) => setFenceEnabled(event.target.checked)}
            />
            Enforce a boundary
          </label>
        </div>

        <div className={`mt-4 ${fenceEnabled ? '' : 'opacity-40'}`}>
          <CampusGeofenceMap
            geofence={draft}
            disabled={!canEdit || !fenceEnabled}
            onChange={setDraft}
          />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <label className="text-xs">
            <span className="text-[10px] uppercase tracking-widest text-[var(--crm-muted)]">Latitude</span>
            <input
              type="number"
              step="0.000001"
              value={draft.latitude}
              disabled={!canEdit || !fenceEnabled}
              onChange={(event) => setDraft({ ...draft, latitude: Number(event.target.value) })}
              className="mt-1 w-full rounded-lg border border-[var(--crm-border)] bg-[var(--crm-card)] px-3 py-2 text-xs outline-none"
            />
          </label>
          <label className="text-xs">
            <span className="text-[10px] uppercase tracking-widest text-[var(--crm-muted)]">Longitude</span>
            <input
              type="number"
              step="0.000001"
              value={draft.longitude}
              disabled={!canEdit || !fenceEnabled}
              onChange={(event) => setDraft({ ...draft, longitude: Number(event.target.value) })}
              className="mt-1 w-full rounded-lg border border-[var(--crm-border)] bg-[var(--crm-card)] px-3 py-2 text-xs outline-none"
            />
          </label>
          <label className="text-xs">
            <span className="text-[10px] uppercase tracking-widest text-[var(--crm-muted)]">
              Radius · {draft.radiusMetres}m
            </span>
            <input
              type="range"
              min={MIN_RADIUS}
              max={MAX_SLIDER_RADIUS}
              step={10}
              value={Math.min(draft.radiusMetres, MAX_SLIDER_RADIUS)}
              disabled={!canEdit || !fenceEnabled}
              onChange={(event) => setDraft({ ...draft, radiusMetres: Number(event.target.value) })}
              className="mt-2 w-full"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={commit}
            disabled={!canEdit || !dirty || save.kind === 'saving'}
            className="inline-flex items-center gap-2 rounded-lg bg-[#1A6B3C] px-4 py-2 text-xs font-extrabold text-white disabled:opacity-40"
          >
            {save.kind === 'saving' ? <Loader2 size={14} className="animate-spin" aria-hidden /> : null}
            Save boundary
          </button>
          {save.kind === 'saved' && (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
              <Check size={14} aria-hidden /> Saved
            </span>
          )}
          {save.kind === 'error' && (
            <span className="inline-flex items-center gap-1 text-xs text-red-700">
              <AlertTriangle size={14} aria-hidden /> {save.message}
            </span>
          )}
          {!canEdit && (
            <span className="text-[11px] text-[var(--crm-muted)]">
              You can view this boundary but not change it.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default CampusGeofenceSettings;

/**
 * Shown when the tenant has no campus at all.
 *
 * Nothing else in the console creates a campus, so without this the boundary
 * editor is permanently unusable on a tenant that was provisioned without one —
 * which is every tenant except the seeded demo.
 */
function FirstCampus({
  tenantName,
  canEdit,
  onCreated,
}: {
  tenantName: string;
  canEdit: boolean;
  onCreated: (campus: Campus) => void;
}) {
  const [name, setName] = useState(tenantName);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    if (!name.trim()) return setError('A campus name is required.');
    setBusy(true);
    setError(null);
    try {
      const response = await createCampus(name.trim());
      onCreated(response.data);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not create the campus.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
      <p className="text-xs font-extrabold">No campus on this tenant yet</p>
      <p className="mt-1 text-[11px] leading-5">
        {tenantName} has no campus record, so there is nothing to draw a boundary around. Name the
        campus and it will appear on the map, ready to fence.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Campus name"
          disabled={!canEdit || busy}
          className="min-w-[220px] flex-1 rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs outline-none"
        />
        <button
          type="button"
          onClick={() => void create()}
          disabled={!canEdit || busy}
          className="inline-flex items-center gap-2 rounded-lg bg-[#1A6B3C] px-4 py-2 text-xs font-extrabold text-white disabled:opacity-40"
        >
          {busy ? <Loader2 size={14} className="animate-spin" aria-hidden /> : null}
          Create campus
        </button>
      </div>
      {error && (
        <p className="mt-2 inline-flex items-center gap-1 text-xs text-red-700">
          <AlertTriangle size={14} aria-hidden /> {error}
        </p>
      )}
      {!canEdit && (
        <p className="mt-2 text-[11px]">You need the tenant configuration permission to add one.</p>
      )}
    </div>
  );
}
