/**
 * 2FA Status Change Notification Email Template - Finwrk
 * Sent when a user enables or disables 2FA
 */

export const get2FAStatusEmailHtml = (userName: string, action: 'enabled' | 'disabled') => `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1.0" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>2FA ${action === 'enabled' ? 'Enabled' : 'Disabled'} - Finwrk</title>
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
                  2FA ${action === 'enabled' ? 'Enabled' : 'Disabled'}
                </h1>
                <p style="margin:0 0 8px 0; font-size:16px; line-height:1.6; color:#888888;">
                  Hi ${userName},
                </p>
                <p style="margin:0; font-size:16px; line-height:1.6; color:#888888;">
                  ${action === 'enabled' 
                    ? 'Two-factor authentication has been successfully enabled on your account. Your account is now more secure.'
                    : 'Two-factor authentication has been disabled on your account. You can re-enable it at any time from your security settings.'}
                </p>
              </td>
            </tr>

            <!-- Status badge -->
            <tr>
              <td align="center" style="padding:0 32px 30px 32px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" 
                  style="width:100%; background:rgba(${action === 'enabled' ? '34,197,94' : '239,68,68'},0.1); 
                         border-radius:12px; border:1px solid rgba(${action === 'enabled' ? '34,197,94' : '239,68,68'},0.3);">
                  <tr>
                    <td style="padding:16px 20px; text-align:center;">
                      <p style="margin:0; font-size:14px; line-height:1.5; color:${action === 'enabled' ? '#22c55e' : '#ef4444'}; font-weight:600;">
                        ${action === 'enabled' ? '✓ 2FA is now active' : '✗ 2FA is now inactive'}
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Security notice -->
            <tr>
              <td align="center" style="padding:0 32px 30px 32px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" 
                  style="width:100%; background:rgba(255,255,255,0.03); border-radius:12px;">
                  <tr>
                    <td style="padding:16px 20px;">
                      <p style="margin:0 0 8px 0; font-size:13px; line-height:1.5; color:#FFA500; text-align:center; font-weight:600;">
                        Didn't make this change?
                      </p>
                      <p style="margin:0; font-size:13px; line-height:1.5; color:#888888; text-align:center;">
                        If you didn't ${action === 'enabled' ? 'enable' : 'disable'} 2FA, please contact our support team immediately at <a href="mailto:support@finwrk.app" style="color:#FFA500; text-decoration:none;">support@finwrk.app</a>
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
