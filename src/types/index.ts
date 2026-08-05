export interface DashboardStats {
  total_accounts: number;
  blacklisted_accounts: number;
  active_accounts: number;
  total_pm_sent: number;
  total_pm_cleared: number;
  total_pm_pending: number;
}

export interface AccountItem {
  user_id: number;
  phone_number: string | null;
  session_exists: boolean;
  is_blacklisted: boolean;
}

export interface AccountDetail {
  user_id: number;
  phone_number: string | null;
  old_phone_number: string | null;
  password: string | null;
  date: string | null;
  is_number_changed: boolean;
  session_exists: boolean;
  is_blacklisted: boolean;
}

export interface AutoPMSettings {
  enabled: boolean;
  accounts_per_cycle: number;
  cycle_delay_min_hours: number;
  cycle_delay_max_hours: number;
  clear_chat_hours: number;
}

export interface AutoCommentSettings {
  delay_min: number;
  delay_max: number;
  reaction_enabled: boolean;
}

export interface PMTaskLogItem {
  id: string;
  user_id: number;
  target_chat_id: string;
  prefill_text: string;
  pm_sent_at: string | null;
  clear_chat_at: string | null;
  status: string;
  is_cleared: boolean;
  is_reloaded: boolean;
}

export interface PMTaskLogResponse {
  data: PMTaskLogItem[];
  total: number;
  page: number;
  limit: number;
}

export interface TemplateItem {
  name: string;
  text: string;
}

export interface NameItem {
  first: string;
  last: string;
}

export interface ReactionChannels {
  channel_ids: string[];
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
}
