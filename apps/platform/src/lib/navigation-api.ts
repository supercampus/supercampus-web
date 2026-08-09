'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import type { StaffNavigationId, StaffSettingsId } from '@/lib/staff-access';

export interface NavigationSection {
  key: string;
  label: string;
  route: string | null;
  icon: string | null;
}

export interface NavigationDocument {
  workspace: NavigationSection[];
  settings: NavigationSection[];
  permissions: string[];
  roles: string[];
  scopes: Record<string, string>;
}

/**
 * Navigation the signed-in user may see.
 *
 * The server resolves this from `platform.navigation_sections` against the caller's
 * live effective grants, so what a tenant administrator assigns to a role is what
 * appears here. Nothing about visibility is decided in the browser.
 */
export function getNavigation() {
  return apiRequest<{ data: NavigationDocument }>('/v1/navigation');
}

interface NavigationState {
  navigation: NavigationDocument | null;
  /** True until the first request settles, so callers can avoid rendering a stale menu. */
  loading: boolean;
  /** Set when the server could not be reached; callers fall back to local derivation. */
  failed: boolean;
}

export function useNavigation(enabled: boolean): NavigationState {
  const [state, setState] = useState<NavigationState>({
    navigation: null,
    loading: enabled,
    failed: false,
  });

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await getNavigation();
        if (cancelled) return;
        setState({ navigation: data, loading: false, failed: false });
      } catch {
        if (cancelled) return;
        setState({ navigation: null, loading: false, failed: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return state;
}

/** Narrows server-provided keys to the workspace sections this build can render. */
export function toStaffNavigationIds(
  sections: NavigationSection[],
  renderable: readonly StaffNavigationId[],
): StaffNavigationId[] {
  const allowed = new Set<string>(renderable);
  return sections
    .map((section) => section.key)
    .filter((key): key is StaffNavigationId => allowed.has(key));
}

export function toStaffSettingsIds(
  sections: NavigationSection[],
  renderable: readonly StaffSettingsId[],
): StaffSettingsId[] {
  const allowed = new Set<string>(renderable);
  return sections
    .map((section) => section.key)
    .filter((key): key is StaffSettingsId => allowed.has(key));
}
