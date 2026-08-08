'use client';

import { availableStaffNavigation, type StaffNavigationId } from '@/lib/staff-access';
import {
  BarChart3,
  ClipboardList,
  Database,
  Kanban,
  Layers,
  LayoutDashboard,
  ListChecks,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Target,
  UserCog,
  Users,
  type LucideIcon,
} from 'lucide-react';

const items: Array<{ id: StaffNavigationId; label: string; icon: LucideIcon }> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'crm', label: 'CRM', icon: Target },
  { id: 'pipeline', label: 'Pipeline', icon: Kanban },
  { id: 'admissions', label: 'Admissions', icon: ClipboardList },
  { id: 'students', label: 'Students', icon: Users },
  { id: 'academics', label: 'Academics', icon: ListChecks },
  { id: 'fees', label: 'Fees & Finance', icon: Database },
  { id: 'erp', label: 'ERP Services', icon: Layers },
  { id: 'reports', label: 'Reports & BI', icon: BarChart3 },
  { id: 'users', label: 'Users & Roles', icon: UserCog },
  { id: 'settings', label: 'Settings', icon: Settings },
];

interface AdmissionsSidebarProps {
  active: StaffNavigationId;
  collapsed: boolean;
  onToggle: () => void;
  onSelect: (id: StaffNavigationId) => void;
  permissions: string[];
  brandGradient: string;
  logoDataUrl?: string | null;
  user?: {
    name?: string;
    initials?: string;
    role?: string;
  } | null;
  onSignOut?: () => void | Promise<void>;
}

export function AdmissionsSidebar({
  active,
  collapsed,
  onToggle,
  onSelect,
  permissions,
  brandGradient,
  logoDataUrl,
  user,
}: AdmissionsSidebarProps) {
  const allowedNavigation = availableStaffNavigation(permissions);
  const visibleItems = items.filter((item) => allowedNavigation.includes(item.id));
  const select = (id: StaffNavigationId) => {
    onSelect(id);
  };

  return (
    <aside className={`campus-admin-sidebar ${collapsed ? 'w-[76px]' : 'w-[232px]'} shrink-0 bg-[var(--crm-surface)] border-r border-[var(--crm-border)] flex flex-col transition-[width] duration-200`}>
      <div className={`${collapsed ? 'px-3 justify-center' : 'px-5'} h-16 flex items-center justify-between border-b border-[var(--crm-border)]`}>
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden text-xs font-bold text-white shrink-0 shadow-xs"
            style={{ background: brandGradient }}
          >
            {logoDataUrl
              ? <img src={logoDataUrl} alt="Tenant logo" className="h-full w-full object-contain bg-white p-1" />
              : 'SC'}
          </div>
          {!collapsed && (
            <div className="campus-admin-sidebar-copy min-w-0">
              <p className="text-sm font-extrabold leading-none text-[var(--crm-text)]">SuperCampus</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-[var(--crm-muted)]">Admin Suite</p>
            </div>
          )}
        </div>
        {!collapsed && (
          <button
            type="button"
            onClick={onToggle}
            className="p-1.5 rounded-lg text-[var(--crm-muted)] hover:bg-[var(--crm-panel)] hover:text-[var(--crm-text)] transition-colors"
            title="Collapse sidebar"
          >
            <PanelLeftClose size={16} />
          </button>
        )}
      </div>

      <nav className="kanban-scroll-hidden flex-1 space-y-1 overflow-y-auto p-3" aria-label="Admissions navigation">
        {collapsed && (
          <button
            type="button"
            onClick={onToggle}
            className="mb-3 flex w-full items-center justify-center py-2 rounded-xl text-[var(--crm-muted)] hover:bg-[var(--crm-panel)] hover:text-[var(--crm-text)] transition-colors"
            title="Expand sidebar"
          >
            <PanelLeftOpen size={16} />
          </button>
        )}

        {visibleItems.map((item) => {
          const Icon = item.icon;
          const selected = active === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => select(item.id)}
              title={item.label}
              aria-current={selected ? 'page' : undefined}
              className={`w-full flex items-center ${collapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded-xl text-xs font-bold transition-all ${
                selected
                  ? 'text-white shadow-xs'
                  : 'text-[var(--crm-muted)] hover:bg-[var(--crm-panel)] hover:text-[var(--crm-text)]'
              }`}
              style={selected ? { background: brandGradient } : undefined}
            >
              <Icon size={17} />
              {!collapsed && <span className="campus-admin-sidebar-label">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className={`${collapsed ? 'p-3' : 'p-4'} border-t border-[var(--crm-border)] bg-[var(--crm-surface)]`}>
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white shrink-0 shadow-xs"
            style={{ background: brandGradient }}
          >
            {user?.initials ?? 'SC'}
          </div>
          {!collapsed && (
            <div className="campus-admin-sidebar-copy min-w-0">
              <p className="truncate text-xs font-bold text-[var(--crm-text)]">{user?.name ?? 'Campus User'}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--crm-muted)]">
                {user?.role?.replaceAll('_', ' ') ?? 'Authenticated User'}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
