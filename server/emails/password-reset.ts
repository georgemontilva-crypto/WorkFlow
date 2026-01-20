/**
 * Password Reset Email Template
 * Minimalist black design inspired by Resend
 */

export function getPasswordResetEmailTemplate(name: string, resetLink: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password - Finwrk</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #000000;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #000000;">
    <tr>
      <td align="center" style="padding: 60px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px;">
          
          <!-- Logo -->
          <tr>
            <td align="center" style="padding: 0 0 40px 0;">
              <img src="${process.env.APP_URL || 'https://finwrk.app'}/icon-512.png" alt="Finwrk" style="width: 100px; height: 100px; border-radius: 24px;" />
            </td>
          </tr>
          
          <!-- Title -->
          <tr>
            <td align="center" style="padding: 0 0 20px 0;">
              <h1 style="margin: 0; font-size: 40px; font-weight: 700; color: #ffffff; line-height: 1.2;">
                Reset Your Password
              </h1>
            </td>
          </tr>
          
          <!-- Description -->
          <tr>
            <td align="center" style="padding: 0 0 40px 0;">
              <p style="margin: 0; font-size: 18px; line-height: 1.6; color: #a0a0a0; text-align: center;">
                Hi ${name}, we received a request to reset your password for your Finwrk account. Click the button below to create a new password.
              </p>
            </td>
          </tr>
          
          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding: 0 0 40px 0;">
              <a href="${resetLink}" style="display: inline-block; padding: 18px 60px; background-color: #ffffff; color: #000000; text-decoration: none; font-size: 18px; font-weight: 600; border-radius: 50px;">
                Reset Password
              </a>
            </td>
          </tr>
          
          <!-- Alternative Link -->
          <tr>
            <td align="center" style="padding: 0 0 40px 0;">
              <p style="margin: 0 0 10px 0; font-size: 14px; line-height: 1.6; color: #666666; text-align: center;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #0066cc; text-align: center; word-break: break-all;">
                ${resetLink}
              </p>
            </td>
          </tr>
          
          <!-- Security Notice -->
          <tr>
            <td align="center" style="padding: 0 0 40px 0;">
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #666666; text-align: center;">
                This link will expire in 1 hour for security reasons.
              </p>
            </td>
          </tr>
          
          <!-- Divider -->
          <tr>
            <td style="padding: 20px 0;">
              <hr style="border: none; border-top: 1px solid #1a1a1a; margin: 0;">
            </td>
          </tr>
          
          <!-- Footer Notice -->
          <tr>
            <td align="center" style="padding: 20px 0;">
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #666666; text-align: center;">
                If you didn't request a password reset, you can safely ignore this email.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 20px 0;">
              <p style="margin: 0 0 5px 0; font-size: 12px; color: #666666;">
                © ${new Date().getFullYear()} Finwrk. All rights reserved.
              </p>
              <p style="margin: 0; font-size: 12px; color: #666666;">
                Financial Manager for Freelancers
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
