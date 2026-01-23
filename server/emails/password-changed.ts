/**
 * Password Changed Notification Email Template - Finwrk
 * Sent when a user successfully changes their password
 */

export const getPasswordChangedEmailHtml = (userName: string) => `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1.0" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>Password Changed - Finwrk</title>
  </head>

  <body style="margin:0; padding:0; background:#000000; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
    <!-- Wrapper -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#000000;">
      <tr>
        <td align="center" style="padding:40px 16px;">

          <!-- Main container -->
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
            style="max-width:520px; background:#0a0a0a; border:1px solid rgba(255,255,255,0.1); border-radius:24px; overflow:hidden;">

            <!-- HEADER with Logo -->
            <tr>
              <td align="center" style="padding:40px 24px 30px 24px;">
                <!-- Logo container with border -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td align="center"
                      style="width:80px; height:80px; background:#0a0a0a; border:1px solid rgba(255,255,255,0.15);
                             border-radius:20px;">
                      <img src="${process.env.APP_URL || 'https://finwrk.app'}/icon-512.png" width="40" height="40" alt="Finwrk"
                        style="display:block; margin:0 auto; border:0; outline:none; text-decoration:none;" />
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- BODY -->
            <tr>
              <td align="center" style="padding:0 32px 30px 32px;">
                <h1 style="margin:0 0 16px 0; font-size:26px; font-weight:600; color:#ffffff; line-height:1.3; letter-spacing:-0.5px;">
                  Password Changed
                </h1>
                <p style="margin:0 0 8px 0; font-size:16px; line-height:1.6; color:#888888;">
                  Hi ${userName},
                </p>
                <p style="margin:0; font-size:16px; line-height:1.6; color:#888888;">
                  Your password was successfully changed. If you made this change, you can safely ignore this email.
                </p>
              </td>
            </tr>

            <!-- Security notice -->
            <tr>
              <td align="center" style="padding:0 32px 30px 32px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" 
                  style="width:100%; background:rgba(255,255,255,0.03); border-radius:12px; border:1px solid rgba(255,165,0,0.3);">
                  <tr>
                    <td style="padding:16px 20px;">
                      <p style="margin:0 0 8px 0; font-size:13px; line-height:1.5; color:#FFA500; text-align:center; font-weight:600;">
                        Didn't make this change?
                      </p>
                      <p style="margin:0; font-size:13px; line-height:1.5; color:#888888; text-align:center;">
                        If you didn't change your password, please contact our support team immediately at <a href="mailto:support@finwrk.app" style="color:#FFA500; text-decoration:none;">support@finwrk.app</a>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Timestamp -->
            <tr>
              <td align="center" style="padding:0 32px 30px 32px;">
                <p style="margin:0; font-size:12px; color:#555555;">
                  Changed on: ${new Date().toLocaleString('en-US', { 
                    dateStyle: 'long', 
                    timeStyle: 'short',
                    timeZone: 'America/New_York'
                  })}
                </p>
              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td align="center" style="padding:20px 32px 10px 32px;">
                <div style="height:1px; background:rgba(255,255,255,0.08); width:100%;"></div>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:20px 32px 35px 32px;">
                <p style="margin:0 0 4px 0; font-size:12px; color:#444444; font-weight:500;">
                  Finwrk
                </p>
                <p style="margin:0; font-size:11px; color:#444444;">
                  Financial Management for Freelancers
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
