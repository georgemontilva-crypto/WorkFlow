/**
 * Email Service - Resend Integration
 */

import { Resend } from 'resend';
import { getVerificationEmailHtml } from './verification';
import { getPasswordChangedEmailHtml } from './password-changed';
import { get2FAStatusEmailHtml } from './2fa-notification';

const resend = new Resend(process.env.RESEND_API_KEY);

const APP_URL = process.env.APP_URL || 'https://finwrk.app';

/**
 * Get properly formatted 'from' email address
 * Handles both formats:
 * - Simple email: "noreply@finwrk.app" -> "Finwrk <noreply@finwrk.app>"
 * - Already formatted: "Finwrk <noreply@finwrk.app>" -> "Finwrk <noreply@finwrk.app>"
 */
function getFromEmail(): string {
  const emailFrom = process.env.EMAIL_FROM || 'noreply@finwrk.app';
  
  // If EMAIL_FROM already contains '<', it's already formatted
  if (emailFrom.includes('<')) {
    return emailFrom;
  }
  
  // Otherwise, format it as "Finwrk <email>"
  return `Finwrk <${emailFrom}>`;
}

export async function sendVerificationEmail(
  to: string,
  userName: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const verificationUrl = `${APP_URL}/verify-email?token=${token}`;
    
    const { data, error } = await resend.emails.send({
      from: getFromEmail(),
      to: [to],
      subject: 'Welcome to Finwrk - Verify your email',
      html: getVerificationEmailHtml(verificationUrl, userName),
    });

    if (error) {
      console.error('Error sending verification email:', error);
      return { success: false, error: error.message };
    }

    console.log('Verification email sent:', data);
    return { success: true };
  } catch (error) {
    console.error('Error sending verification email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function sendPasswordChangedEmail(
  to: string,
  userName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await resend.emails.send({
      from: getFromEmail(),
      to: [to],
      subject: 'Password Changed - Finwrk',
      html: getPasswordChangedEmailHtml(userName),
    });

    if (error) {
      console.error('Error sending password changed email:', error);
      return { success: false, error: error.message };
    }

    console.log('Password changed email sent:', data);
    return { success: true };
  } catch (error) {
    console.error('Error sending password changed email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function send2FAStatusEmail(
  to: string,
  userName: string,
  action: 'enabled' | 'disabled'
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await resend.emails.send({
      from: getFromEmail(),
      to: [to],
      subject: `2FA ${action === 'enabled' ? 'Enabled' : 'Disabled'} - Finwrk`,
      html: get2FAStatusEmailHtml(userName, action),
    });

    if (error) {
      console.error('Error sending 2FA status email:', error);
      return { success: false, error: error.message };
    }

    console.log('2FA status email sent:', data);
    return { success: true };
  } catch (error) {
    console.error('Error sending 2FA status email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
