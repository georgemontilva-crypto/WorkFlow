/**
 * Email Verification Template - Finwrk
 * Minimalist design with Finwrk branding
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
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #000000; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 16px; overflow: hidden;">
          
          <!-- Header with Logo -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center; border-bottom: 1px solid #1a1a1a;">
              <img src="${process.env.APP_URL || 'https://finwrk.app'}/icon-512.png" alt="Finwrk" style="width: 60px; height: 60px; border-radius: 50%;" />
              <h1 style="margin: 10px 0 0 0; font-size: 24px; font-weight: 700; color: #ffffff;">Finwrk</h1>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              <h1 style="margin: 0 0 16px 0; font-size: 28px; font-weight: 700; color: #ffffff; text-align: center;">
                Welcome to Finwrk!
              </h1>
              
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #a0a0a0; text-align: center;">
                Hi ${userName}, we're excited to have you on board.
              </p>
              
              <p style="margin: 0 0 32px 0; font-size: 16px; line-height: 24px; color: #a0a0a0; text-align: center;">
                To get started, please verify your email address by clicking the button below:
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 0 0 32px 0;">
                    <a href="${verificationUrl}" style="display: inline-block; padding: 16px 48px; background-color: #ffffff; color: #000000; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px; transition: opacity 0.2s;">
                      Verify Email Address
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 20px; color: #666666; text-align: center;">
                Or copy and paste this link into your browser:
              </p>
              
              <p style="margin: 0 0 32px 0; font-size: 13px; line-height: 20px; color: #4a4a4a; text-align: center; word-break: break-all;">
                ${verificationUrl}
              </p>
              
              <div style="border-top: 1px solid #1a1a1a; padding-top: 24px;">
                <p style="margin: 0 0 8px 0; font-size: 14px; line-height: 20px; color: #666666; text-align: center;">
                  <strong style="color: #ffffff;">Get paid. Stay in control.</strong>
                </p>
                <p style="margin: 0; font-size: 13px; line-height: 20px; color: #666666; text-align: center;">
                  Professional invoicing and financial management for freelancers and businesses.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #050505; border-top: 1px solid #1a1a1a;">
              <p style="margin: 0 0 8px 0; font-size: 12px; line-height: 18px; color: #666666; text-align: center;">
                This email was sent to you because you created an account on Finwrk.
              </p>
              <p style="margin: 0; font-size: 12px; line-height: 18px; color: #666666; text-align: center;">
                If you didn't create this account, you can safely ignore this email.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export const getVerificationEmailText = (verificationUrl: string, userName: string) => `
Welcome to Finwrk!

Hi ${userName}, we're excited to have you on board.

To get started, please verify your email address by clicking the link below:

${verificationUrl}

Get paid. Stay in control.

Professional invoicing and financial management for freelancers and businesses.

---

This email was sent to you because you created an account on Finwrk.
If you didn't create this account, you can safely ignore this email.
`;
