// types/index.ts

// Database Models (match Supabase tables)

export type Agency = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export type User = {
  id: string;
  agency_id: string;
  email: string;
  password_hash?: string; // Don't expose to frontend
  role: "owner" | "account_manager";
  created_at: string;
  updated_at: string;
};

export type Client = {
  id: string;
  agency_id: string;
  name: string;
  contact_email: string | null;
  portal_token: string;
  created_at: string;
  updated_at: string;
};

export type Campaign = {
  id: string;
  client_id: string;
  agency_id: string;
  name: string;
  platform: "google_ads" | "meta_ads" | "other";
  status: "active" | "paused" | "completed";
  created_at: string;
  updated_at: string;
};

export type MetricEntry = {
  id: string;
  campaign_id: string;
  client_id: string;
  agency_id: string;
  reporting_period: string; // ISO date format: "2024-11-01"
  ad_spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  conversions: number;
  cost_per_lead: number | null;
  conversion_rate: number | null;
  created_at: string;
  updated_at: string;
};

export type ClientAccessToken = {
  id: string;
  client_id: string;
  token_hash: string;
  expires_at: string | null;
  created_at: string;
};

export type UserClientAssignment = {
  id: string;
  user_id: string;
  client_id: string;
  created_at: string;
};

// ============================================
// API Request/Response Types
// ============================================

// AUTH ENDPOINTS
export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  success: boolean;
  token: string;
  user: Omit<User, "password_hash">;
  error?: string;
};

export type SignupRequest = {
  email: string;
  password: string;
  agency_name: string;
};

export type SignupResponse = {
  success: boolean;
  token: string;
  user: Omit<User, "password_hash">;
  agency: Agency;
  error?: string;
};

export type LogoutResponse = {
  success: boolean;
  message: string;
};

// CLIENTS ENDPOINTS
export type CreateClientRequest = {
  name: string;
  contact_email?: string;
};

export type CreateClientResponse = {
  success: boolean;
  client: Client;
  error?: string;
};

export type GetClientsResponse = {
  success: boolean;
  clients: Client[];
  error?: string;
};

// CAMPAIGNS ENDPOINTS
export type CreateCampaignRequest = {
  client_id: string;
  name: string;
  platform: "google_ads" | "meta_ads" | "other";
};

export type CreateCampaignResponse = {
  success: boolean;
  campaign: Campaign;
  error?: string;
};

export type GetCampaignsResponse = {
  success: boolean;
  campaigns: Campaign[];
  error?: string;
};

// METRICS ENDPOINTS
export type CreateMetricEntryRequest = {
  campaign_id: string;
  reporting_period: string; // "2024-11-01"
  ad_spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  conversions: number;
};

export type CreateMetricEntryResponse = {
  success: boolean;
  entry: MetricEntry;
  error?: string;
};

export type GetMetricsResponse = {
  success: boolean;
  metrics: MetricEntry[];
  error?: string;
};

// DASHBOARD ENDPOINTS
export type AgencyDashboardSummary = {
  total_clients: number;
  total_campaigns: number;
  total_ad_spend: number;
  total_leads: number;
  total_conversions: number;
  average_cpl: number;
  average_conversion_rate: number;
};

export type AgencyDashboardResponse = {
  success: boolean;
  summary: AgencyDashboardSummary;
  clients_overview: Client[];
  error?: string;
};

export type ClientDashboardSummary = {
  client_name: string;
  total_campaigns: number;
  total_ad_spend: number;
  total_leads: number;
  total_conversions: number;
  average_cpl: number;
  average_conversion_rate: number;
};

export type ClientDashboardResponse = {
  success: boolean;
  summary: ClientDashboardSummary;
  campaigns: Campaign[];
  recent_metrics: MetricEntry[];
  error?: string;
};

// ============================================
// Utility Types
// ============================================

export type AuthPayload = {
  user_id: string;
  agency_id: string;
  role: "owner" | "account_manager";
  iat: number; // issued at
  exp: number; // expiration
};

export type ApiError = {
  success: false;
  error: string;
  status: number;
};

export type ApiSuccess<T> = {
  success: true;
  data: T;
};