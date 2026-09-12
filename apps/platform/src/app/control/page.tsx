'use client';

import LoginPage from '@/components/auth/LoginPage';
import SuperAdminPortal from '@/components/platform-admin/SuperAdminPortal';
import { AppProvider, useApp } from '@/lib/context';
import { portalDestination } from '@/lib/portal-access';

function ControlPageContent() {
  const { authStatus, student } = useApp();
  if (authStatus === 'checking') return <div className="sc-auth-loading"><div className="sc-auth-loading__mark">SC</div><span>Verifying platform access...</span></div>;
  if (authStatus === 'unauthenticated' || !student) return <LoginPage />;
  if (portalDestination(student) !== 'platform-control') {
    return <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}><section><h1>Access denied</h1><p>This portal is reserved for the SuperCampus operations team.</p></section></main>;
  }
  return <SuperAdminPortal />;
}

export default function ControlPage() {
  return <AppProvider><ControlPageContent /></AppProvider>;
}
