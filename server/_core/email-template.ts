/**
 * Base Email Template - Finwrk Modern Design
 * Unified design system for all emails
 * Black background, outline buttons, minimalist and professional
 */

interface EmailTemplateOptions {
  title: string;
  greeting?: string;
  body: string;
  ctaText?: string;
  ctaUrl?: string;
  footerNote?: string;
  expirationTime?: string;
  showAlternativeLink?: boolean;
}

export function getBaseEmailTemplate(options: EmailTemplateOptions): string {
  const {
    title,
    greeting,
    body,
    ctaText,
    ctaUrl,
    footerNote,
    expirationTime,
    showAlternativeLink = false,
  } = options;

  const appUrl = process.env.APP_URL || 'https://www.finwrk.app';

  return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1.0" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>${title} - Finwrk</title>
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
                      <img src="${appUrl}/icon-512.png" width="40" height="40" alt="Finwrk"
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
                  ${title}
                </h1>
                ${greeting ? `
                <p style="margin:0 0 8px 0; font-size:16px; line-height:1.6; color:#888888;">
                  ${greeting}
                </p>
                ` : ''}
                <div style="margin:0; font-size:16px; line-height:1.6; color:#888888;">
                  ${body}
                </div>
              </td>
            </tr>

            ${ctaText && ctaUrl ? `
            <!-- BUTTON - Outline style -->
            <tr>
              <td align="center" style="padding:10px 32px 40px 32px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width:100%;">
                  <tr>
                    <td align="center">
                      <a href="${ctaUrl}"
                        style="display:inline-block; padding:16px 48px; text-decoration:none;
                               font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
                               font-size:15px; font-weight:600; color:#ffffff;
                               background:transparent; border:2px solid #ffffff;
                               border-radius:12px; letter-spacing:0.3px;
                               transition:all 0.2s ease;">
                        ${ctaText}
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            ` : ''}

            ${footerNote || expirationTime ? `
            <!-- Footer notice -->
            <tr>
              <td align="center" style="padding:0 32px 30px 32px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" 
                  style="width:100%; background:rgba(255,255,255,0.03); border-radius:12px;">
                  <tr>
                    <td style="padding:16px 20px;">
                      <p style="margin:0; font-size:13px; line-height:1.5; color:#666666; text-align:center;">
                        ${expirationTime ? `This link will expire in <strong style="color:#888888;">${expirationTime}</strong>. ` : ''}
                        ${footerNote || ''}
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            ` : ''}

            ${showAlternativeLink && ctaUrl ? `
            <!-- Alternative link -->
            <tr>
              <td align="center" style="padding:0 32px 30px 32px;">
                <p style="margin:0 0 8px 0; font-size:12px; line-height:1.5; color:#555555;">
                  Or copy and paste this link:
                </p>
                <p style="margin:0; font-size:12px; line-height:1.5; color:#666666; word-break:break-all; 
                          background:rgba(255,255,255,0.03); padding:12px 16px; border-radius:8px;">
                  ${ctaUrl}
                </p>
              </td>
            </tr>
            ` : ''}

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
}
