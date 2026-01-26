/**
 * Email Verification Template - Finwrk
 * Uses the unified base template
 */

import { getBaseEmailTemplate } from '../_core/email-template';

export const getVerificationEmailHtml = (verificationUrl: string, userName: string) => {
  return getBaseEmailTemplate({
    title: 'Activate Your Account',
    greeting: `Hi ${userName},`,
    body: 'Welcome to Finwrk. Click the button below to verify your email address and start managing your finances.',
    ctaText: 'Verify Email Address',
    ctaUrl: verificationUrl,
    expirationTime: '24 hours',
    footerNote: "If you didn't create an account with Finwrk, you can safely ignore this email.",
    showAlternativeLink: true,
  });
};
