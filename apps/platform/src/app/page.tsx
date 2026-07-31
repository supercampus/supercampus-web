'use client';

import React, { useEffect } from 'react';
import { AppProvider, useApp } from '@/lib/context';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';

import HomeDashboard from '@/components/modules/HomeDashboard';
import AttendancePage from '@/components/modules/AttendancePage';
import GatePassPage from '@/components/modules/GatePassPage';
import FeesPage from '@/components/modules/FeesPage';
import ExamsPage from '@/components/modules/ExamsPage';
import TimetablePage from '@/components/modules/TimetablePage';
import HostelPage from '@/components/modules/HostelPage';
import LibraryPage from '@/components/modules/LibraryPage';
import TransportPage from '@/components/modules/TransportPage';
import PlacementPage from '@/components/modules/PlacementPage';
import DocumentsPage from '@/components/modules/DocumentsPage';
import ProfilePage from '@/components/modules/ProfilePage';
import QRPage from '@/components/modules/QRPage';
import LoginPage from '@/components/auth/LoginPage';

function DashboardContent() {
  const { state, authStatus, student } = useApp();
  const shouldOpenStaffWorkspace = authStatus === 'authenticated' && Boolean(student?.role) && student?.role !== 'Student';

  useEffect(() => {
    if (shouldOpenStaffWorkspace) {
      window.location.assign('/dashboard/admissions');
    }
  }, [shouldOpenStaffWorkspace]);

  if (authStatus === 'checking') {
    return <div className="sc-auth-loading"><div className="sc-auth-loading__mark">SC</div><span>Securing your workspace...</span></div>;
  }
  if (authStatus === 'unauthenticated') return <LoginPage />;
  if (shouldOpenStaffWorkspace) {
    return <div className="sc-auth-loading"><div className="sc-auth-loading__mark">SC</div><span>Opening your staff workspace...</span></div>;
  }

  const renderActiveModule = () => {
    switch (state.active) {
      case 'home': return <HomeDashboard />;
      case 'attendance': return <AttendancePage />;
      case 'gatepass': return <GatePassPage />;
      case 'fees': return <FeesPage />;
      case 'exams': return <ExamsPage />;
      case 'timetable': return <TimetablePage />;
      case 'hostel': return <HostelPage />;
      case 'library': return <LibraryPage />;
      case 'transport': return <TransportPage />;
      case 'placement': return <PlacementPage />;
      case 'documents': return <DocumentsPage />;
      case 'profile': return <ProfilePage />;
      case 'qr': return <QRPage />;
      default: return <HomeDashboard />;
    }
  };

  return (
    <div className="sc-app-shell">
      <Sidebar />
      <div className="sc-main-container">
        <TopBar />
        <main className="sc-content-scroll">
          {renderActiveModule()}
        </main>
      </div>

      {state.toast && (
        <div className="sc-toast">
          {state.toast}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <AppProvider>
      <DashboardContent />
    </AppProvider>
  );
}
