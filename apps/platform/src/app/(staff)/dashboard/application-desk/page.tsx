'use client';

import { ApplicationDeskWorkspace } from '@/components/modules/ApplicationDeskWorkspace';

/**
 * Standalone route for the desk. The same workspace also renders inside the
 * staff shell under the Admissions nav group, so the two never diverge.
 */
export default function ApplicationDeskPage() {
  return <ApplicationDeskWorkspace />;
}
