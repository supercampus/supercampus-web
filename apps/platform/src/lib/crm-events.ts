'use client';

import { useEffect, useRef, useState } from 'react';
import { ApiRequestError, apiRequest } from '@/lib/api';

export interface CrmEvent {
  cursor: number;
  eventType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export type RealtimeStatus = 'connecting' | 'live' | 'offline';

/**
 * Mints the short-lived handshake token.
 *
 * This call goes through the Next.js proxy on the app origin, so it carries the
 * HttpOnly session cookie normally. The socket itself cannot, which is why it needs
 * this token instead.
 */
function getRealtimeToken() {
  return apiRequest<{ data: { token: string; expiresAt: string } }>(
    '/auth/realtime-token',
    { method: 'POST' },
  );
}

/**
 * Resolves the API origin for the socket.
 *
 * Next.js does not proxy WebSocket upgrades, so the browser must reach the Rust API
 * directly rather than through the `/api` rewrite used by every other call.
 */
function realtimeUrl(token: string, cursor: number): string | null {
  const configured = process.env.NEXT_PUBLIC_WS_URL;
  let base: string;
  if (configured && configured.trim()) {
    base = configured.trim().replace(/\/$/, '');
  } else if (typeof window !== 'undefined') {
    // Local development default: the API listens on 4000 beside the Next dev server.
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    base = `${protocol}//${window.location.hostname}:4000`;
  } else {
    return null;
  }
  const separator = base.startsWith('ws') ? '' : '';
  return `${base}${separator}/api/v1/crm/events?cursor=${cursor}&access_token=${encodeURIComponent(token)}`;
}

interface Options {
  /** Only connect once the user is authenticated and allowed to read the board. */
  enabled: boolean;
  /** Called for every event the tenant emits, in cursor order. */
  onEvent: (event: CrmEvent) => void;
}

/**
 * Subscribes to the tenant CRM event stream.
 *
 * The backend replays from a cursor, so a reconnect resumes exactly where the previous
 * socket stopped and no stage movement is missed.
 */
export function useCrmEvents({ enabled, onEvent }: Options): RealtimeStatus {
  const [status, setStatus] = useState<RealtimeStatus>('offline');
  const cursorRef = useRef(0);
  // Held in a ref so a changing callback identity never forces a reconnect.
  const onEventRef = useRef(onEvent);
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let socket: WebSocket | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;

    async function connect() {
      if (cancelled) return;
      setStatus('connecting');
      let url: string | null = null;
      try {
        const { data } = await getRealtimeToken();
        url = realtimeUrl(data.token, cursorRef.current);
      } catch (error) {
        // Authentication expiry is terminal for this mounted session. Retrying it
        // only floods the console until the app's auth provider redirects to login.
        if (error instanceof ApiRequestError && error.status === 401) {
          setStatus('offline');
          return;
        }
        // A development restart or temporary gateway outage should reconnect, but
        // not hammer the token endpoint while the API is unavailable.
        scheduleRetry(error instanceof ApiRequestError && error.status >= 500 ? 5_000 : 1_000);
        return;
      }
      if (!url || cancelled) {
        scheduleRetry();
        return;
      }

      socket = new WebSocket(url);

      socket.onopen = () => {
        if (cancelled) return;
        attempt = 0;
        setStatus('live');
      };

      socket.onmessage = (message) => {
        if (cancelled) return;
        try {
          const event = JSON.parse(message.data as string) as CrmEvent;
          if (typeof event.cursor === 'number') {
            cursorRef.current = Math.max(cursorRef.current, event.cursor);
          }
          // The server emits a synthetic error frame rather than closing on read failure.
          if (event.eventType === 'crm.stream_error') return;
          onEventRef.current(event);
        } catch {
          // A frame that is not JSON is ignored rather than killing the stream.
        }
      };

      socket.onerror = () => socket?.close();

      socket.onclose = () => {
        if (cancelled) return;
        setStatus('offline');
        scheduleRetry();
      };
    }

    function scheduleRetry(minimumDelay = 1_000) {
      if (cancelled) return;
      // Capped exponential backoff so a down API is not hammered.
      const delay = Math.min(30_000, Math.max(minimumDelay, 1_000 * 2 ** attempt));
      attempt += 1;
      retryTimer = setTimeout(connect, delay);
    }

    connect();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      if (socket) {
        socket.onclose = null;
        socket.close();
      }
      setStatus('offline');
    };
  }, [enabled]);

  return status;
}
