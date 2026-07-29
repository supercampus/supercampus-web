'use client';

import React, { useState, useCallback, useEffect } from 'react';
import type { Lead } from '@/lib/kanban/kanban-data';
import { LEADS, ROLES } from '@/lib/kanban/kanban-data';
import KanbanBoard from '@/components/kanban/KanbanBoard';
import ActivityFeed from '@/components/kanban/ActivityFeed';
import { Moon, Sun, ChevronDown, Plus } from 'lucide-react';

export default function AdmissionsPage() {
  const [leads, setLeads] = useState<Lead[]>(LEADS);
  const [roleId, setRoleId] = useState('principal');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [toast, setToast] = useState<string | null>(null);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setMounted(true);
      const html = document.documentElement;
      if (html.getAttribute('data-theme') === 'dark') {
        setTheme('dark');
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const toggleTheme = useCallback(() => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
  }, [theme]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  if (!mounted) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--crm-bg)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1400ff, #a600ff)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2l2.4 7.1L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.9z" /></svg>
          </div>
          <p className="text-sm text-[var(--crm-muted)] font-medium">Loading admissions portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[var(--crm-bg)]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Top Navigation Bar */}
      <header className="h-16 shrink-0 flex items-center justify-between px-6 bg-[var(--crm-surface)] border-b border-[var(--crm-border)] z-30">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5">
            <span
              className="text-xl font-bold bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, #1400ff, #a600ff)' }}
            >
              SuperCampus
            </span>
            <span className="text-[11px] font-bold text-[var(--crm-muted)] uppercase tracking-widest ml-1.5">
              Admissions
            </span>
          </div>

          {/* Search */}
          <div className="relative hidden md:block">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--crm-muted)" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search leads, applications..."
              className="pl-9 pr-4 py-2 rounded-full bg-[var(--crm-panel)] border-none text-sm w-72 focus:outline-none focus:ring-2 focus:ring-[var(--crm-soft-blue)]/30 text-[var(--crm-text)] placeholder:text-[var(--crm-muted)]"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Activity Feed */}
          <ActivityFeed leads={leads} />

          {/* Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--crm-border)] bg-[var(--crm-surface)] text-sm text-[var(--crm-text)] hover:bg-[var(--crm-panel)] transition-colors"
            >
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs font-semibold">{ROLES.find((r) => r.id === roleId)?.label ?? 'Select Role'}</span>
              <ChevronDown size={14} className="text-[var(--crm-muted)]" />
            </button>

            {roleDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setRoleDropdownOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-52 bg-[var(--crm-card)] border border-[var(--crm-border)] rounded-xl shadow-xl z-50 py-1 overflow-hidden">
                  {ROLES.map((role) => (
                    <button
                      key={role.id}
                      onClick={() => { setRoleId(role.id); setRoleDropdownOpen(false); }}
                      className={`w-full px-3.5 py-2.5 text-left text-xs font-medium transition-colors flex items-center gap-2.5 ${
                        roleId === role.id
                          ? 'bg-[var(--crm-soft-blue)]/10 text-[var(--crm-soft-blue)]'
                          : 'text-[var(--crm-text)] hover:bg-[var(--crm-panel)]'
                      }`}
                    >
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                        style={{ background: 'linear-gradient(135deg, #1400ff, #a600ff)' }}>
                        {role.label.charAt(0)}
                      </div>
                      <span>{role.label}</span>
                      {role.id === 'principal' && (
                        <span className="ml-auto px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700">All access</span>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* User avatar */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-[var(--crm-border)]">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-[var(--crm-text)]">Arjun Mehta</p>
              <p className="text-[9px] text-[var(--crm-muted)] font-semibold uppercase">{ROLES.find((r) => r.id === roleId)?.label}</p>
            </div>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ background: 'linear-gradient(135deg, #1400ff, #a600ff)' }}>
              AM
            </div>
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg hover:bg-[var(--crm-panel)] text-[var(--crm-muted)] transition-colors"
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
          </div>
        </div>
      </header>

      {/* Secondary Toolbar */}
      <div className="h-14 shrink-0 flex items-center justify-between px-6 border-b border-[var(--crm-border)] bg-[var(--crm-bg)]">
        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #1400ff, #a600ff)' }}
            onClick={() => {
              // Trigger new lead in enquiry column
              showToast('Click "Quick Add" on any column to add a lead');
            }}
          >
            <Plus size={16} />
            Add New Lead
          </button>
          <div className="w-px h-6 bg-[var(--crm-border)] mx-1" />
          <div className="flex gap-1.5">
            <div className="px-2.5 py-1.5 bg-[var(--crm-card)] border border-[var(--crm-border)] rounded-lg flex items-center gap-1.5 cursor-pointer hover:bg-[var(--crm-panel)] transition-colors">
              <span className="text-[10px] font-semibold text-[var(--crm-muted)]">View:</span>
              <span className="text-[11px] font-bold text-[var(--crm-text)]">Kanban</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[var(--crm-muted)] font-medium">
            {leads.length} total leads
          </span>
        </div>
      </div>

      {/* Main Kanban Area */}
      <div className="flex-1 overflow-hidden p-5 flex flex-col">
        <KanbanBoard
          leads={leads}
          setLeads={setLeads}
          roleId={roleId}
          onShowToast={showToast}
        />
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[300] bg-[var(--crm-text)] text-[var(--crm-bg)] px-4 py-2.5 rounded-xl text-sm font-semibold shadow-xl"
          style={{ animation: 'toastIn 0.25s ease-out' }}
        >
          {toast}
        </div>
      )}

      <style jsx>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
