'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Loader2, Check, AlertTriangle, Navigation, Search, Crosshair } from 'lucide-react';
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
const MAX_SLIDER_RADIUS = 50000;

const RADIUS_PRESETS = [100, 250, 500, 1000, 2000, 5000, 10000, 25000, 50000];

/** Where the marker starts when a campus has no fence yet. Somewhere on land
 *  and obviously wrong beats 0,0, which looks like a real answer. */
const DEFAULT_GEOFENCE: CampusGeofence = {
  latitude: 12.928862,
  longitude: 79.99524,
  radiusMetres: 1000,
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
  const [locating, setLocating] = useState(false);
  const [locationNotice, setLocationNotice] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{ display_name: string; lat: string; lon: string }> | null>(null);

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

  const locateMe = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationNotice('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    setLocationNotice(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        setDraft((prev) => (prev ? { ...prev, latitude: lat, longitude: lng } : null));
        setLocationNotice(`Location set to your current device coordinates (${lat}, ${lng}).`);
      },
      (err) => {
        setLocating(false);
        setLocationNotice(`Could not get location: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  const searchPlace = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!searchQuery.trim()) return;
      setSearching(true);
      setSearchResults(null);
      setLocationNotice(null);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            searchQuery.trim(),
          )}&limit=5`,
        );
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setSearchResults(data);
        } else {
          setLocationNotice('No locations found matching your search.');
        }
      } catch {
        setLocationNotice('Failed to search locations. Check your connection.');
      } finally {
        setSearching(false);
      }
    },
    [searchQuery],
  );

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
          or campus center and set the radius to cover the campus (e.g. 500m to 1000m). Too tight and
          students inside hostel or academic blocks will be marked outside campus.
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

        {/* Quick Tools: Place Search & Locate Me */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <form onSubmit={searchPlace} className="flex flex-1 min-w-[260px] items-center gap-2">
            <div className="relative flex-1">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--crm-muted)]"
              />
              <input
                type="text"
                placeholder="Search campus or address (e.g. Madras Engineering College)..."
                value={searchQuery}
                disabled={!canEdit || !fenceEnabled}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-[var(--crm-border)] bg-[var(--crm-card)] pl-8 pr-3 py-1.5 text-xs outline-none focus:border-[var(--crm-accent,#1A6B3C)]"
              />
            </div>
            <button
              type="submit"
              disabled={!canEdit || !fenceEnabled || searching || !searchQuery.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--crm-border)] px-3 py-1.5 text-xs font-semibold text-[var(--crm-text)] hover:bg-[var(--crm-panel)] disabled:opacity-40"
            >
              {searching ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
              Search
            </button>
          </form>

          <button
            type="button"
            onClick={locateMe}
            disabled={!canEdit || !fenceEnabled || locating}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50/70 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-40"
          >
            {locating ? <Loader2 size={12} className="animate-spin" /> : <Navigation size={12} />}
            Use My Location
          </button>
        </div>

        {/* Search Results Dropdown */}
        {searchResults && searchResults.length > 0 && (
          <div className="mt-2 rounded-lg border border-[var(--crm-border)] bg-[var(--crm-card)] p-2 shadow-sm text-xs space-y-1">
            <p className="text-[10px] uppercase font-bold text-[var(--crm-muted)] px-1">
              Select location to center pin:
            </p>
            {searchResults.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setDraft((prev) =>
                    prev
                      ? {
                          ...prev,
                          latitude: Number(Number(item.lat).toFixed(6)),
                          longitude: Number(Number(item.lon).toFixed(6)),
                        }
                      : null,
                  );
                  setSearchResults(null);
                  setLocationNotice(`Pin moved to: ${item.display_name}`);
                }}
                className="w-full text-left p-1.5 rounded hover:bg-[var(--crm-panel)] text-[11px] truncate flex items-center gap-2"
              >
                <MapPin size={12} className="shrink-0 text-emerald-700" />
                <span className="truncate">{item.display_name}</span>
              </button>
            ))}
          </div>
        )}

        {locationNotice && (
          <p className="mt-2 text-[11px] text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
            {locationNotice}
          </p>
        )}

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
          <div className="text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest text-[var(--crm-muted)]">
                Radius · {draft.radiusMetres}m
              </span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={MIN_RADIUS}
                  max={100000}
                  step={25}
                  value={draft.radiusMetres}
                  disabled={!canEdit || !fenceEnabled}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      radiusMetres: Math.max(MIN_RADIUS, Number(event.target.value) || MIN_RADIUS),
                    })
                  }
                  className="w-16 rounded border border-[var(--crm-border)] bg-[var(--crm-card)] px-1.5 py-0.5 text-right text-xs font-bold outline-none focus:border-[var(--crm-accent,#1A6B3C)]"
                />
                <span className="text-[10px] text-[var(--crm-muted)]">m</span>
              </div>
            </div>
            <input
              type="range"
              min={MIN_RADIUS}
              max={MAX_SLIDER_RADIUS}
              step={10}
              value={Math.min(draft.radiusMetres, MAX_SLIDER_RADIUS)}
              disabled={!canEdit || !fenceEnabled}
              onChange={(event) =>
                setDraft({ ...draft, radiusMetres: Number(event.target.value) })
              }
              className="mt-2 w-full"
            />
            <div className="mt-1 flex flex-wrap items-center gap-1">
              <span className="text-[9px] text-[var(--crm-muted)] uppercase mr-1">Presets:</span>
              {RADIUS_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  disabled={!canEdit || !fenceEnabled}
                  onClick={() => setDraft({ ...draft, radiusMetres: preset })}
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold border transition ${
                    draft.radiusMetres === preset
                      ? 'border-[var(--crm-accent,#1A6B3C)] bg-emerald-50 text-emerald-800'
                      : 'border-[var(--crm-border)] text-[var(--crm-muted)] hover:bg-slate-100'
                  }`}
                >
                  {preset >= 1000 ? `${preset / 1000}km` : `${preset}m`}
                </button>
              ))}
            </div>
          </div>
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
