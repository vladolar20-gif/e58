import { type ReactNode } from 'react';
import { LayoutDashboard, Clock, Gavel, TriangleAlert as AlertTriangle, BookOpen, ScrollText, Users, Megaphone, CalendarOff, UserCog, Settings, User, Shield, LogOut, Scale, KeyRound } from 'lucide-react';
import { useAuth, hasRank, canViewLogs, canManageAccounts } from '@/lib/auth';
import {
  RANK_LABELS,
  RANK_COLORS,
  RANK_ORDER,
  type StaffProfile,
  type StaffRank,
} from '@/lib/types';

type Page =
  | 'dashboard'
  | 'shifts'
  | 'sanctions'
  | 'warnings'
  | 'regulations'
  | 'logs'
  | 'members'
  | 'announcements'
  | 'invoiri'
  | 'staff_sanctions'
  | 'settings'
  | 'account'
  | 'guidelines'
  | 'accounts';

interface NavItem {
  key: Page;
  label: string;
  icon: typeof LayoutDashboard;
  minRank?: StaffRank;
  managerOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'shifts', label: 'Ture', icon: Clock },
  { key: 'sanctions', label: 'Sanctiuni', icon: Gavel },
  { key: 'warnings', label: 'Warn-uri', icon: AlertTriangle },
  { key: 'regulations', label: 'Regulament', icon: BookOpen },
  { key: 'guidelines', label: 'Ghid Sanctiuni', icon: Scale },
  { key: 'logs', label: 'Jurnal', icon: ScrollText, minRank: 'supervisor' },
  { key: 'members', label: 'Membri Staff', icon: Users },
  { key: 'announcements', label: 'Anunturi', icon: Megaphone },
  { key: 'invoiri', label: 'Cereri Invoire', icon: CalendarOff },
  { key: 'staff_sanctions', label: 'Sanctiuni Staff', icon: UserCog, minRank: 'supervisor' },
  { key: 'settings', label: 'Setari Permisiuni', icon: Settings, minRank: 'manager_staff' },
  { key: 'accounts', label: 'Gestionare Conturi', icon: KeyRound, minRank: 'high_staff_council' },
  { key: 'account', label: 'Setari Cont', icon: User },
];

function rankMatches(profile: StaffProfile | null, item: NavItem): boolean {
  if (!profile) return false;
  if (item.key === 'logs') return canViewLogs(profile);
  if (item.key === 'accounts') return canManageAccounts(profile);
  if (item.managerOnly) return hasRank(profile, 'manager_staff');
  if (item.minRank) {
    return hasRank(profile, item.minRank);
  }
  return true;
}

export function AppLayout({
  currentPage,
  onNavigate,
  children,
}: {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  children: ReactNode;
}) {
  const { profile, signOut } = useAuth();
  const visibleItems = NAV_ITEMS.filter((item) => rankMatches(profile, item));

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col fixed lg:sticky top-0 h-screen z-40 hidden lg:flex">
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white leading-tight">STAFF E58 ROMÂNIA ROLEPLAY</h1>
              <p className="text-xs text-slate-500">Portal Staff</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const active = currentPage === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  active
                    ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-800">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm">
              {(profile?.roblox_name || '?')[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium truncate">
                {profile?.roblox_name || 'Fara nume'}
              </p>
              {profile?.rank && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border ${RANK_COLORS[profile.rank]}`}
                >
                  {RANK_LABELS[profile.rank]}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
          >
            <LogOut className="w-5 h-5" />
            Deconectare
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="lg:hidden sticky top-0 z-30 bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-white">STAFF E58 ROMÂNIA ROLEPLAY</span>
          </div>
          <button
            onClick={() => signOut()}
            className="text-slate-400 hover:text-rose-400 p-2 rounded-lg transition"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile nav scroll */}
        <div className="lg:hidden sticky top-[57px] z-20 bg-slate-900/95 backdrop-blur border-b border-slate-800 overflow-x-auto">
          <div className="flex gap-1 p-2 min-w-max">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const active = currentPage === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => onNavigate(item.key)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                    active
                      ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}

export type { Page };
