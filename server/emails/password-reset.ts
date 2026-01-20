/**
 * Password Reset Email Template - Finwrk
 * Minimalist design with logo in bordered container
 */

export function getPasswordResetEmailTemplate(name: string, resetLink: string): string {
  return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1.0" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>Reset Your Password - Finwrk</title>
  </head>

  <body style="margin:0; padding:0; background:#000000; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
    <!-- Wrapper -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#000000;">
      <tr>
        <td align="center" style="padding:40px 16px;">

          <!-- Main container -->
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
            style="max-width:600px; background:#000000; border-radius:18px; overflow:hidden;">

            <!-- HEADER -->
            <tr>
              <td align="center" style="padding:35px 20px 25px 20px;">
                <!-- Logo container -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td align="center"
                      style="width:70px; height:70px; background:#0b0b0b; border:1px solid rgba(255,255,255,0.08);
                             border-radius:18px; box-shadow:0 0 0 1px rgba(255,255,255,0.03) inset;">
                      <img src="${process.env.APP_URL || 'https://finwrk.app'}/icon-512.png" width="34" height="34" alt="Finwrk"
                        style="display:block; margin:0 auto; border:0; outline:none; text-decoration:none;" />
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- BODY -->
            <tr>
              <td align="center" style="padding:20px 24px 30px 24px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                  style="background:#000000; border-radius:16px;">
                  <tr>
                    <td style="padding:20px; text-align:center;">
                      <h1 style="margin:0 0 16px 0; font-size:28px; font-weight:700; color:#ffffff; line-height:1.3;">
                        Reset Your Password
                      </h1>
                      <p style="margin:0 0 16px 0; font-size:16px; line-height:1.6; color:#a0a0a0;">
                        Hi ${name}, we received a request to reset your password for your Finwrk account.
                      </p>
                      <p style="margin:0; font-size:16px; line-height:1.6; color:#a0a0a0;">
                        Click the button below to create a new password. This link will expire in 1 hour.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- BUTTON -->
            <tr>
              <td align="center" style="padding:0 24px 40px 24px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width:100%; max-width:420px;">
                  <tr>
                    <td align="center"
                      style="background:#ffffff; border-radius:999px; padding:16px 20px;">
                      <a href="${resetLink}"
                        style="display:block; text-decoration:none; font-family:Arial, sans-serif;
                               font-size:16px; font-weight:700; color:#000000;">
                        Reset Password
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Alternative link -->
            <tr>
              <td align="center" style="padding:0 24px 30px 24px;">
                <p style="margin:0 0 10px 0; font-size:13px; line-height:1.5; color:#666666;">
                  Or copy and paste this link into your browser:
                </p>
                <p style="margin:0; font-size:13px; line-height:1.5; color:#0066cc; word-break:break-all;">
                  ${resetLink}
                </p>
              </td>
            </tr>

            <!-- Security notice -->
            <tr>
              <td align="center" style="padding:0 24px 30px 24px;">
                <p style="margin:0; font-size:14px; line-height:1.5; color:#666666;">
                  If you didn't request a password reset, you can safely ignore this email.
                </p>
              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td align="center" style="padding:25px 24px 10px 24px;">
                <div style="height:1px; background:rgba(255,255,255,0.08); width:100%; max-width:520px;"></div>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:10px 24px 30px 24px;">
                <p style="margin:0 0 5px 0; font-size:12px; color:#666666;">
                  © ${new Date().getFullYear()} Finwrk. All rights reserved.
                </p>
                <p style="margin:0; font-size:12px; color:#666666;">
                  Financial Manager for Freelancers
                </p>
              </td>
            </tr>

          </table>
          <!-- /Main container -->

        </td>
      </tr>
    </table>
    <!-- /Wrapper -->
  </body>
</html>
  `.trim();
}
