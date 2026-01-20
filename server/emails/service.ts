/**
 * Email Service - Resend Integration
 */

import { Resend } from 'resend';
import { getVerificationEmailHtml, getVerificationEmailText } from './verification';

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
      text: getVerificationEmailText(verificationUrl, userName),
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
