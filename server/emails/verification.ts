/**
 * Email Verification Template - Finwrk
 * Minimalist black design inspired by Resend
 */

export const getVerificationEmailHtml = (verificationUrl: string, userName: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your Finwrk account</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #000000;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #000000;">
    <tr>
      <td align="center" style="padding: 60px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px;">
          
          <!-- Logo -->
          <tr>
            <td align="center" style="padding: 0 0 50px 0;">
              <img src="${process.env.APP_URL || 'https://finwrk.app'}/finwrk-logo.png" alt="Finwrk" style="height: 40px; width: auto;" />
            </td>
          </tr>
          
          <!-- Description -->
          <tr>
            <td align="center" style="padding: 0 0 40px 0;">
              <p style="margin: 0; font-size: 18px; line-height: 1.6; color: #a0a0a0; text-align: center;">
                Hi ${userName}, we're excited to have you on board. To get started, please verify your email address by clicking the button below.
              </p>
            </td>
          </tr>
          
          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding: 0 0 40px 0;">
              <a href="${verificationUrl}" style="display: inline-block; padding: 18px 60px; background-color: #ffffff; color: #000000; text-decoration: none; font-size: 18px; font-weight: 600; border-radius: 50px;">
                Verify Email Address
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
                ${verificationUrl}
              </p>
            </td>
          </tr>
          
          <!-- Divider -->
          <tr>
            <td style="padding: 20px 0;">
              <hr style="border: none; border-top: 1px solid #1a1a1a; margin: 0;">
            </td>
          </tr>
          
          <!-- Value Proposition -->
          <tr>
            <td align="center" style="padding: 20px 0;">
              <p style="margin: 0 0 10px 0; font-size: 16px; font-weight: 600; color: #ffffff; text-align: center;">
                Get paid. Stay in control.
              </p>
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #666666; text-align: center;">
                Professional invoicing and financial management for freelancers.
              </p>
            </td>
          </tr>
          
          <!-- Footer Notice -->
          <tr>
            <td align="center" style="padding: 20px 0;">
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #666666; text-align: center;">
                If you didn't create this account, you can safely ignore this email.
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
