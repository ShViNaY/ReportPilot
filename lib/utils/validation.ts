// lib/utils/validation.ts

import { validatePasswordStrength } from './auth';

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const HEX32_REGEX = /^[0-9a-fA-F]{32}$/;

/**
 * Validate UUID string format
 */
export function isValidUuid(val: unknown): val is string {
  return typeof val === 'string' && UUID_REGEX.test(val);
}

/**
 * Validate email address format and length
 */
export function isValidEmail(val: unknown): val is string {
  return (
    typeof val === 'string' &&
    val.length <= 255 &&
    EMAIL_REGEX.test(val.trim())
  );
}

/**
 * Validate a date parameter (accepts YYYY-MM-DD or full ISO 8601 string)
 * Returns normalized YYYY-MM-DD string or null if invalid
 */
export function parseAndValidateDate(val: unknown): string | null {
  if (typeof val !== 'string' || !val.trim()) return null;
  const trimmed = val.trim();
  const dateObj = new Date(trimmed);
  if (isNaN(dateObj.getTime())) return null;

  // Ensure year is realistic (1970 - 2100)
  const year = dateObj.getUTCFullYear();
  if (year < 1970 || year > 2100) return null;

  // Return date in YYYY-MM-DD format
  return trimmed.split('T')[0];
}

/**
 * Validate a non-empty string with min and max bounds
 */
export function isValidString(
  val: unknown,
  minLen: number = 1,
  maxLen: number = 255
): val is string {
  if (typeof val !== 'string') return false;
  const trimmed = val.trim();
  return trimmed.length >= minLen && trimmed.length <= maxLen;
}

/**
 * Validate a non-negative finite number (e.g. ad_spend)
 */
export function isValidNonNegativeNumber(val: unknown, max: number = 100_000_000): val is number {
  return (
    typeof val === 'number' &&
    Number.isFinite(val) &&
    !isNaN(val) &&
    val >= 0 &&
    val <= max
  );
}

/**
 * Validate a non-negative integer (e.g. impressions, clicks, leads, conversions)
 */
export function isValidNonNegativeInteger(val: unknown, max: number = 2_000_000_000): val is number {
  return (
    typeof val === 'number' &&
    Number.isInteger(val) &&
    val >= 0 &&
    val <= max
  );
}

/**
 * Validate Route Param ID
 */
export function validateRouteId(id: unknown, paramName: string = 'ID'): ValidationResult<string> {
  if (!isValidUuid(id)) {
    return { success: false, error: `Invalid ${paramName} format` };
  }
  return { success: true, data: id };
}

// ============================================
// Endpoint-specific schemas & validators
// ============================================

export interface ValidatedLogin {
  email: string;
  password: string;
}

export function validateLoginInput(body: unknown): ValidationResult<ValidatedLogin> {
  if (!body || typeof body !== 'object') {
    return { success: false, error: 'Invalid request body' };
  }
  const { email, password } = body as Record<string, unknown>;

  if (!email || !password) {
    return { success: false, error: 'Email and password are required' };
  }
  if (!isValidEmail(email)) {
    return { success: false, error: 'Invalid email format' };
  }
  if (typeof password !== 'string' || password.length === 0) {
    return { success: false, error: 'Password is required' };
  }
  if (password.length > 1000) {
    return { success: false, error: 'Password exceeds maximum length' };
  }

  return {
    success: true,
    data: {
      email: (email as string).trim().toLowerCase(),
      password: password as string,
    },
  };
}

export interface ValidatedSignup {
  email: string;
  password: string;
  agency_name: string;
}

export function validateSignupInput(body: unknown): ValidationResult<ValidatedSignup> {
  if (!body || typeof body !== 'object') {
    return { success: false, error: 'Invalid request body' };
  }
  const { email, password, agency_name } = body as Record<string, unknown>;

  if (!email || !password || !agency_name) {
    return { success: false, error: 'Email, password, and agency name are required' };
  }
  if (!isValidEmail(email)) {
    return { success: false, error: 'Invalid email format' };
  }
  if (typeof agency_name !== 'string' || !isValidString(agency_name, 1, 255)) {
    return { success: false, error: 'Agency name must be between 1 and 255 characters' };
  }
  if (typeof password !== 'string') {
    return { success: false, error: 'Password must be a string' };
  }
  const passwordError = validatePasswordStrength(password);
  if (passwordError) {
    return { success: false, error: passwordError };
  }

  return {
    success: true,
    data: {
      email: (email as string).trim().toLowerCase(),
      password,
      agency_name: (agency_name as string).trim(),
    },
  };
}

export interface ValidatedCreateClient {
  name: string;
  contact_email: string | null;
}

export function validateCreateClientInput(body: unknown): ValidationResult<ValidatedCreateClient> {
  if (!body || typeof body !== 'object') {
    return { success: false, error: 'Invalid request body' };
  }
  const { name, contact_email } = body as Record<string, unknown>;

  if (!name || typeof name !== 'string' || !isValidString(name, 1, 255)) {
    return { success: false, error: 'Client name is required (max 255 characters)' };
  }

  let validContactEmail: string | null = null;
  if (contact_email !== undefined && contact_email !== null && contact_email !== '') {
    if (!isValidEmail(contact_email)) {
      return { success: false, error: 'Invalid contact email format' };
    }
    validContactEmail = (contact_email as string).trim().toLowerCase();
  }

  return {
    success: true,
    data: {
      name: name.trim(),
      contact_email: validContactEmail,
    },
  };
}

export interface ValidatedUpdateClient {
  name?: string;
  contact_email?: string | null;
}

export function validateUpdateClientInput(body: unknown): ValidationResult<ValidatedUpdateClient> {
  if (!body || typeof body !== 'object') {
    return { success: false, error: 'Invalid request body' };
  }
  const { name, contact_email } = body as Record<string, unknown>;

  if (name === undefined && contact_email === undefined) {
    return { success: false, error: 'At least one field (name or contact_email) must be provided' };
  }

  const result: ValidatedUpdateClient = {};

  if (name !== undefined) {
    if (typeof name !== 'string' || !isValidString(name, 1, 255)) {
      return { success: false, error: 'Client name must be between 1 and 255 characters' };
    }
    result.name = name.trim();
  }

  if (contact_email !== undefined) {
    if (contact_email === null || contact_email === '') {
      result.contact_email = null;
    } else if (!isValidEmail(contact_email)) {
      return { success: false, error: 'Invalid contact email format' };
    } else {
      result.contact_email = (contact_email as string).trim().toLowerCase();
    }
  }

  return { success: true, data: result };
}

export interface ValidatedCreateCampaign {
  client_id: string;
  name: string;
  platform: string;
}

export function validateCreateCampaignInput(body: unknown): ValidationResult<ValidatedCreateCampaign> {
  if (!body || typeof body !== 'object') {
    return { success: false, error: 'Invalid request body' };
  }
  const { client_id, name, platform } = body as Record<string, unknown>;

  if (!client_id || !isValidUuid(client_id)) {
    return { success: false, error: 'Valid client ID is required' };
  }
  if (!name || typeof name !== 'string' || !isValidString(name, 1, 255)) {
    return { success: false, error: 'Campaign name is required (max 255 characters)' };
  }
  if (!platform || typeof platform !== 'string' || !isValidString(platform, 1, 100)) {
    return { success: false, error: 'Platform is required (max 100 characters)' };
  }

  return {
    success: true,
    data: {
      client_id: client_id as string,
      name: name.trim(),
      platform: platform.trim(),
    },
  };
}

export interface ValidatedUpdateCampaign {
  name?: string;
  platform?: string;
  status?: 'active' | 'paused' | 'completed';
}

export function validateUpdateCampaignInput(body: unknown): ValidationResult<ValidatedUpdateCampaign> {
  if (!body || typeof body !== 'object') {
    return { success: false, error: 'Invalid request body' };
  }
  const { name, platform, status } = body as Record<string, unknown>;

  if (name === undefined && platform === undefined && status === undefined) {
    return { success: false, error: 'At least one field must be provided to update' };
  }

  const result: ValidatedUpdateCampaign = {};

  if (name !== undefined) {
    if (typeof name !== 'string' || !isValidString(name, 1, 255)) {
      return { success: false, error: 'Campaign name cannot be empty (max 255 characters)' };
    }
    result.name = name.trim();
  }

  if (platform !== undefined) {
    if (typeof platform !== 'string' || !isValidString(platform, 1, 100)) {
      return { success: false, error: 'Platform cannot be empty (max 100 characters)' };
    }
    result.platform = platform.trim();
  }

  if (status !== undefined) {
    if (!['active', 'paused', 'completed'].includes(status as string)) {
      return { success: false, error: 'Invalid status. Must be active, paused, or completed' };
    }
    result.status = status as 'active' | 'paused' | 'completed';
  }

  return { success: true, data: result };
}

export interface ValidatedCreateMetric {
  campaign_id: string;
  reporting_period: string;
  ad_spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  conversions: number;
}

export function validateCreateMetricInput(body: unknown): ValidationResult<ValidatedCreateMetric> {
  if (!body || typeof body !== 'object') {
    return { success: false, error: 'Invalid request body' };
  }
  const {
    campaign_id,
    reporting_period,
    ad_spend,
    impressions,
    clicks,
    leads,
    conversions,
  } = body as Record<string, unknown>;

  if (!campaign_id || !isValidUuid(campaign_id)) {
    return { success: false, error: 'Valid campaign ID is required' };
  }

  if (!reporting_period || typeof reporting_period !== 'string' || !DATE_ONLY_REGEX.test(reporting_period.trim())) {
    return { success: false, error: 'Valid reporting period (YYYY-MM-DD) is required' };
  }
  const parsedDate = parseAndValidateDate(reporting_period);
  if (!parsedDate) {
    return { success: false, error: 'Invalid reporting period date' };
  }

  if (!isValidNonNegativeNumber(ad_spend)) {
    return { success: false, error: 'Ad spend must be a non-negative number' };
  }
  if (!isValidNonNegativeInteger(impressions)) {
    return { success: false, error: 'Impressions must be a non-negative integer' };
  }
  if (!isValidNonNegativeInteger(clicks)) {
    return { success: false, error: 'Clicks must be a non-negative integer' };
  }
  if (!isValidNonNegativeInteger(leads)) {
    return { success: false, error: 'Leads must be a non-negative integer' };
  }
  if (!isValidNonNegativeInteger(conversions)) {
    return { success: false, error: 'Conversions must be a non-negative integer' };
  }

  return {
    success: true,
    data: {
      campaign_id: campaign_id as string,
      reporting_period: parsedDate,
      ad_spend,
      impressions,
      clicks,
      leads,
      conversions,
    },
  };
}

export interface ValidatedUpdateMetric {
  ad_spend?: number;
  impressions?: number;
  clicks?: number;
  leads?: number;
  conversions?: number;
}

export function validateUpdateMetricInput(body: unknown): ValidationResult<ValidatedUpdateMetric> {
  if (!body || typeof body !== 'object') {
    return { success: false, error: 'Invalid request body' };
  }
  const {
    ad_spend,
    impressions,
    clicks,
    leads,
    conversions,
  } = body as Record<string, unknown>;

  if (
    ad_spend === undefined &&
    impressions === undefined &&
    clicks === undefined &&
    leads === undefined &&
    conversions === undefined
  ) {
    return { success: false, error: 'At least one metric field must be provided' };
  }

  const result: ValidatedUpdateMetric = {};

  if (ad_spend !== undefined) {
    if (!isValidNonNegativeNumber(ad_spend)) {
      return { success: false, error: 'Ad spend must be a non-negative number' };
    }
    result.ad_spend = ad_spend;
  }

  if (impressions !== undefined) {
    if (!isValidNonNegativeInteger(impressions)) {
      return { success: false, error: 'Impressions must be a non-negative integer' };
    }
    result.impressions = impressions;
  }

  if (clicks !== undefined) {
    if (!isValidNonNegativeInteger(clicks)) {
      return { success: false, error: 'Clicks must be a non-negative integer' };
    }
    result.clicks = clicks;
  }

  if (leads !== undefined) {
    if (!isValidNonNegativeInteger(leads)) {
      return { success: false, error: 'Leads must be a non-negative integer' };
    }
    result.leads = leads;
  }

  if (conversions !== undefined) {
    if (!isValidNonNegativeInteger(conversions)) {
      return { success: false, error: 'Conversions must be a non-negative integer' };
    }
    result.conversions = conversions;
  }

  return { success: true, data: result };
}

export interface ValidatedDateRange {
  startDate?: string;
  endDate?: string;
}

export function validateDateRange(
  startParam?: string | null,
  endParam?: string | null
): ValidationResult<ValidatedDateRange> {
  const result: ValidatedDateRange = {};

  if (startParam) {
    const parsedStart = parseAndValidateDate(startParam);
    if (!parsedStart) {
      return { success: false, error: 'Invalid startDate format' };
    }
    result.startDate = parsedStart;
  }

  if (endParam) {
    const parsedEnd = parseAndValidateDate(endParam);
    if (!parsedEnd) {
      return { success: false, error: 'Invalid endDate format' };
    }
    result.endDate = parsedEnd;
  }

  if (result.startDate && result.endDate) {
    if (result.startDate > result.endDate) {
      return { success: false, error: 'startDate cannot be after endDate' };
    }
  }

  return { success: true, data: result };
}

export interface ValidatedCreateTeamMember {
  email: string;
  password: string;
}

export function validateCreateTeamMemberInput(body: unknown): ValidationResult<ValidatedCreateTeamMember> {
  if (!body || typeof body !== 'object') {
    return { success: false, error: 'Invalid request body' };
  }
  const { email, password } = body as Record<string, unknown>;

  if (!email || !password) {
    return { success: false, error: 'Email and password are required' };
  }
  if (!isValidEmail(email)) {
    return { success: false, error: 'Invalid email format' };
  }
  if (typeof password !== 'string') {
    return { success: false, error: 'Password must be a string' };
  }
  const passwordError = validatePasswordStrength(password);
  if (passwordError) {
    return { success: false, error: passwordError };
  }

  return {
    success: true,
    data: {
      email: (email as string).trim().toLowerCase(),
      password,
    },
  };
}

export interface ValidatedPortalTokenGeneration {
  expirationDays: number | null;
}

export function validatePortalTokenGenerateInput(body: unknown): ValidationResult<ValidatedPortalTokenGeneration> {
  if (!body || typeof body !== 'object') {
    return { success: true, data: { expirationDays: null } };
  }
  const { expirationDays } = body as Record<string, unknown>;

  if (expirationDays === undefined || expirationDays === null) {
    return { success: true, data: { expirationDays: null } };
  }

  if (
    typeof expirationDays !== 'number' ||
    !Number.isInteger(expirationDays) ||
    expirationDays < 1 ||
    expirationDays > 3650
  ) {
    return { success: false, error: 'expirationDays must be an integer between 1 and 3650' };
  }

  return { success: true, data: { expirationDays } };
}

export function validatePortalTokenString(token: unknown): ValidationResult<string> {
  if (typeof token !== 'string' || !HEX32_REGEX.test(token.trim())) {
    return { success: false, error: 'Invalid portal token format' };
  }
  return { success: true, data: token.trim() };
}
