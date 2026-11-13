export type StaffRank =
  | 'trial_helper'
  | 'helper'
  | 'trial_moderator'
  | 'moderator'
  | 'trial_administrator'
  | 'administrator'
  | 'supervisor'
  | 'operator'
  | 'manager_staff'
  | 'high_staff_council'
  | 'community_manager'
  | 'co_owner'
  | 'owner'
  | 'founder'
  | 'discord_developer';

export interface StaffProfile {
  id: string;
  user_id: string;
  roblox_name: string;
  roblox_id: string;
  discord_name: string | null;
  discord_id: string | null;
  rank: StaffRank;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Shift {
  id: string;
  user_id: string;
  clock_in: string;
  clock_out: string | null;
  created_at: string;
}

export type SanctionType = 'kick' | 'temp_ban' | 'permanent_ban' | 'warning' | 'mute' | 'ban';

export interface Sanction {
  id: string;
  roblox_name: string;
  roblox_id: string | null;
  sanction_type: SanctionType;
  reason: string;
  duration: string | null;
  proof_url: string | null;
  issued_by: string | null;
  issued_by_name: string | null;
  created_at: string;
}

export interface Warning {
  id: string;
  roblox_name: string;
  roblox_id: string | null;
  reason: string;
  issued_by: string | null;
  issued_by_name: string | null;
  created_at: string;
}

export interface Regulation {
  id: string;
  title: string;
  content: string;
  sort_order: number;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface LogEntry {
  id: string;
  log_type: string;
  roblox_name: string | null;
  staff_name: string | null;
  staff_rank: string | null;
  details: string | null;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
}

export type InvoireStatus = 'pending' | 'approved' | 'rejected';

export interface Invoire {
  id: string;
  user_id: string;
  staff_name: string;
  reason: string;
  start_date: string;
  end_date: string;
  status: InvoireStatus;
  manager_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface StaffSanction {
  id: string;
  staff_name: string;
  staff_rank: string | null;
  sanction_type: string;
  reason: string;
  issued_by: string | null;
  issued_by_name: string | null;
  proof_url: string | null;
  created_at: string;
}

export interface SanctionGuideline {
  id: string;
  title: string;
  do_action: string;
  dont_action: string;
  category: string;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PermissionSetting {
  id: string;
  action_key: string;
  required_rank: StaffRank;
  updated_by: string | null;
  updated_at: string;
}

export interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  is_active: boolean;
  issuer_profile_id: string | null;
  created_by: string | null;
  created_at: string;
  last_used_at: string | null;
}

export interface RankHistoryEntry {
  id: string;
  profile_id: string;
  old_rank: StaffRank;
  new_rank: StaffRank;
  reason: string;
  changed_by: string | null;
  changed_by_name: string | null;
  created_at: string;
}

export interface AccountInfo {
  profile_id: string;
  user_id: string;
  email: string;
  roblox_name: string;
  roblox_id: string;
  discord_name: string | null;
  discord_id: string | null;
  rank: string;
  is_active: boolean;
  created_at: string;
}

export const RANK_LABELS: Record<StaffRank, string> = {
  trial_helper: 'Trial Helper',
  helper: 'Helper',
  trial_moderator: 'Trial Moderator',
  moderator: 'Moderator',
  trial_administrator: 'Trial Administrator',
  administrator: 'Administrator',
  supervisor: 'Supervisor',
  operator: 'Operator',
  manager_staff: 'Manager Staff',
  high_staff_council: 'Consiliul Superior High Staff',
  community_manager: 'Community Manager',
  co_owner: 'Co-owner',
  owner: 'Owner',
  founder: 'Fondator Comunitate',
  discord_developer: 'Discord Developer',
};

export const RANK_ORDER: StaffRank[] = [
  'trial_helper',
  'helper',
  'trial_moderator',
  'moderator',
  'trial_administrator',
  'administrator',
  'supervisor',
  'operator',
  'manager_staff',
  'high_staff_council',
  'community_manager',
  'co_owner',
  'owner',
  'founder',
  'discord_developer',
];

export const RANK_COLORS: Record<StaffRank, string> = {
  trial_helper: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  helper: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  trial_moderator: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
  moderator: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  trial_administrator: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  administrator: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  supervisor: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  operator: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  manager_staff: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  high_staff_council: 'bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30',
  community_manager: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  co_owner: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  owner: 'bg-red-500/15 text-red-400 border-red-500/30',
  founder: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  discord_developer: 'bg-lime-500/15 text-lime-400 border-lime-500/30',
};

export const RANK_LEVELS: Record<StaffRank, number> = {
  trial_helper: 1,
  helper: 2,
  trial_moderator: 3,
  moderator: 4,
  trial_administrator: 5,
  administrator: 6,
  supervisor: 7,
  operator: 8,
  manager_staff: 9,
  high_staff_council: 10,
  community_manager: 11,
  co_owner: 12,
  owner: 13,
  founder: 14,
  discord_developer: 15,
};

export const SANCTION_LABELS: Record<SanctionType, string> = {
  kick: 'Kick',
  temp_ban: 'T-Ban',
  permanent_ban: 'P-Ban',
  warning: 'Avertisment',
  mute: 'Mute',
  ban: 'Ban',
};

export const SANCTION_COLORS: Record<SanctionType, string> = {
  kick: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  temp_ban: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  permanent_ban: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  warning: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  mute: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  ban: 'bg-red-500/15 text-red-400 border-red-500/30',
};

export const ACTION_LABELS: Record<string, string> = {
  add_sanction: 'Adaugare Sanctiuni Jucatori',
  delete_sanction: 'Stergere Sanctiuni',
  add_warn: 'Adaugare Warn-uri Jucatori',
  delete_warn: 'Stergere Warn-uri',
  manage_members: 'Gestionare Membri Staff',
  manage_announcements: 'Gestionare Anunturi',
  edit_regulations: 'Editare Regulament',
  review_invoiri: 'Revizuire Cereri Invoire',
  view_all_shifts: 'Vizualizare Toate Turele',
};

export const GUIDELINE_CATEGORIES = ['general', 'chat', 'exploit', 'comportament', 'altul'] as const;

export const CATEGORY_LABELS: Record<string, string> = {
  general: 'General',
  chat: 'Chat',
  exploit: 'Exploit',
  comportament: 'Comportament',
  altul: 'Altul',
};

export const CATEGORY_COLORS: Record<string, string> = {
  general: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  chat: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  exploit: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  comportament: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  altul: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
};
