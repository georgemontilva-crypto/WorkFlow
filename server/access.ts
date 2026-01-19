/**
 * Access Control Helpers
 * Manage trial period and lifetime access
 */

import { User } from "../drizzle/schema";

/**
 * Check if user has active trial (within 7 days of registration)
 */
export function hasActiveTrial(user: User): boolean {
  if (!user.trial_ends_at) return false;
  return new Date() < new Date(user.trial_ends_at);
}

/**
 * Check if user has lifetime access
 */
export function hasLifetimeAccess(user: User): boolean {
  return user.has_lifetime_access === 1;
}

/**
 * Check if user has any valid access (trial or lifetime)
 */
export function hasAccess(user: User): boolean {
  return hasActiveTrial(user) || hasLifetimeAccess(user);
}

/**
 * Get days remaining in trial
 */
export function getTrialDaysRemaining(user: User): number {
  if (!user.trial_ends_at) return 0;
  const now = new Date();
  const trialEnd = new Date(user.trial_ends_at);
  const diffTime = trialEnd.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Calculate trial end date (7 days from now)
 */
export function calculateTrialEndDate(): Date {
  const now = new Date();
  const trialEnd = new Date(now);
  trialEnd.setDate(trialEnd.getDate() + 7);
  return trialEnd;
}

/**
 * Get user access status
 */
export interface AccessStatus {
  hasAccess: boolean;
  has_lifetime_access: boolean;
  hasActiveTrial: boolean;
  trialDaysRemaining: number;
  trialExpired: boolean;
}

export function getUserAccessStatus(user: User): AccessStatus {
  const hasLifetime = hasLifetimeAccess(user);
  const hasTrial = hasActiveTrial(user);
  const daysRemaining = getTrialDaysRemaining(user);
  
  return {
    hasAccess: hasLifetime || hasTrial,
    has_lifetime_access: hasLifetime,
    hasActiveTrial: hasTrial,
    trialDaysRemaining: daysRemaining,
    trialExpired: !hasLifetime && !hasTrial && user.trial_ends_at !== null,
  };
}
