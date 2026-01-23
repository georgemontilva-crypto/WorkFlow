/**
 * Email Service - Resend Integration
 */

import { Resend } from 'resend';
import { getVerificationEmailHtml } from './verification';
import { getPasswordChangedEmailHtml } from './password-changed';
import { get2FAStatusEmailHtml } from './2fa-notification';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@finwrk.app';
const APP_URL = process.env.APP_URL || 'https://finwrk.app';

export async function sendVerificationEmail(
  to: string,
  userName: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const verificationUrl = `${APP_URL}/verify-email?token=${token}`;
    
    const { data, error } = await resend.emails.send({
      from: `Finwrk <${FROM_EMAIL}>`,
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
      from: `Finwrk <${FROM_EMAIL}>`,
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
      from: `Finwrk <${FROM_EMAIL}>`,
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
