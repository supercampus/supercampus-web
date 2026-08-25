'use client';

import React, { useEffect, useRef } from 'react';
import type { Map as LeafletMap, Marker, Circle } from 'leaflet';
import type { CampusGeofence } from '@/lib/types';

import 'leaflet/dist/leaflet.css';

/**
 * The campus fence, drawn and dragged.
 *
 * Leaflet is loaded with a dynamic `import()` inside an effect rather than at
 * module scope: it reaches for `window` as it initialises, so importing it
 * during a server render throws. That also keeps it out of the initial bundle
 * for every admin who never opens this section.
 *
 * The map is deliberately not React-rendered. Leaflet owns its own DOM and
 * mutates it directly, so it is created once against a ref and then updated
 * imperatively; re-rendering it through React would fight the library for
 * control of the same nodes.
 */
export function CampusGeofenceMap({
  geofence,
  onChange,
  disabled = false,
}: {
  geofence: CampusGeofence;
  onChange: (next: CampusGeofence) => void;
  disabled?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const circleRef = useRef<Circle | null>(null);

  /** Read by the Leaflet handlers, which are bound once and would otherwise
   *  close over the first render's props for the life of the map.
   *
   *  Written in an effect, not during render: a ref mutated while rendering is
   *  not safe under concurrent rendering, where a render can be thrown away. */
  const onChangeRef = useRef(onChange);
  const geofenceRef = useRef(geofence);
  // `dragging.disable()` does not update `options.draggable`, so the map's own
  // click handler needs its own view of whether edits are allowed.
  const disabledRef = useRef(disabled);

  useEffect(() => {
    onChangeRef.current = onChange;
    geofenceRef.current = geofence;
    disabledRef.current = disabled;
  });

  useEffect(() => {
    let cancelled = false;
    let cleanup = () => {};

    void (async () => {
      const L = await import('leaflet');
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        center: [geofenceRef.current.latitude, geofenceRef.current.longitude],
        zoom: 16,
      });

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        // Required by the OSM tile usage policy.
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      const circle = L.circle(
        [geofenceRef.current.latitude, geofenceRef.current.longitude],
        {
          radius: geofenceRef.current.radiusMetres,
          color: '#1A6B3C',
          fillColor: '#1A6B3C',
          fillOpacity: 0.15,
          weight: 2,
        },
      ).addTo(map);

      // A CSS pin rather than Leaflet's default marker. The default resolves
      // three PNGs by a path it derives from its own stylesheet, which bundlers
      // rewrite — the usual result is a draggable but invisible marker. A
      // divIcon has no assets to lose.
      const marker = L.marker(
        [geofenceRef.current.latitude, geofenceRef.current.longitude],
        {
          draggable: true,
          keyboard: true,
          icon: L.divIcon({
            className: '',
            html:
              '<div style="width:18px;height:18px;border-radius:50%;' +
              'background:#1A6B3C;border:3px solid #fff;' +
              'box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>',
            iconSize: [18, 18],
            iconAnchor: [9, 9],
          }),
        },
      ).addTo(map);

      const move = (lat: number, lng: number) => {
        // Six decimals is about 0.1m — far finer than any phone's fix, and it
        // keeps the stored value from carrying meaningless float tail.
        onChangeRef.current({
          ...geofenceRef.current,
          latitude: Number(lat.toFixed(6)),
          longitude: Number(lng.toFixed(6)),
        });
      };

      marker.on('dragend', () => {
        const { lat, lng } = marker.getLatLng();
        move(lat, lng);
      });
      map.on('click', (event) => {
        if (disabledRef.current) return;
        move(event.latlng.lat, event.latlng.lng);
      });

      mapRef.current = map;
      markerRef.current = marker;
      circleRef.current = circle;

      // Leaflet measures its container on creation. Inside a panel that was
      // display:none a moment ago that measurement is zero, and the map renders
      // as a grey box until something forces it to re-measure.
      setTimeout(() => map.invalidateSize(), 0);

      cleanup = () => {
        map.remove();
        mapRef.current = null;
        markerRef.current = null;
        circleRef.current = null;
      };
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  // Follow prop changes that came from somewhere other than the map itself —
  // the radius slider, the numeric inputs, switching campus.
  useEffect(() => {
    const marker = markerRef.current;
    const circle = circleRef.current;
    if (!marker || !circle) return;
    const position: [number, number] = [geofence.latitude, geofence.longitude];
    marker.setLatLng(position);
    circle.setLatLng(position);
    circle.setRadius(geofence.radiusMetres);
  }, [geofence.latitude, geofence.longitude, geofence.radiusMetres]);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;
    if (disabled) marker.dragging?.disable();
    else marker.dragging?.enable();
  }, [disabled]);

  return (
    <div
      ref={containerRef}
      role="application"
      aria-label="Campus geofence map"
      className="h-[360px] w-full rounded-xl border border-[var(--crm-border)]"
      style={{ zIndex: 0 }}
    />
  );
}

export default CampusGeofenceMap;
