/**
 * Base Email Template - Full Width Dark Design
 * Provides a consistent, modern email template for all communications
 */

interface EmailTemplateOptions {
  title: string;
  body: string;
  ctaText?: string;
  ctaUrl?: string;
  logoUrl?: string;
}

export function getBaseEmailTemplate(options: EmailTemplateOptions): string {
  const {
    title,
    body,
    ctaText,
    ctaUrl,
    logoUrl = `${process.env.APP_URL || 'https://finwrk.app'}/finwrk-logo.png`
  } = options;

  const currentYear = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Finwrk</title>
</head>
<body style="
  margin:0;
  padding:0;
  width:100% !important;
  background-color:#0e0e11;
  font-family:Arial, Helvetica, sans-serif;
  color:#ffffff;
">
<!-- FULL WIDTH BACKGROUND -->
<table width="100%" cellpadding="0" cellspacing="0" style="
  background-color:#0e0e11;
  margin:0;
  padding:0;
">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <!-- CONTENT CONTAINER (FLUID) -->
      <table width="100%" cellpadding="0" cellspacing="0" style="
        max-width:680px;
        background-color:#0e0e11;
      ">
        <!-- LOGO -->
        <tr>
          <td align="center" style="padding-bottom:32px;">
            <img 
              src="${logoUrl}" 
              alt="Finwrk"
              width="140"
              style="display:block;"
            />
          </td>
        </tr>
        <!-- TITLE -->
        <tr>
          <td style="
            font-size:22px;
            font-weight:600;
            padding-bottom:16px;
          ">
            ${title}
          </td>
        </tr>
        <!-- BODY -->
        <tr>
          <td style="
            font-size:15px;
            line-height:1.7;
            color:#d1d1d6;
            padding-bottom:28px;
          ">
            ${body}
          </td>
        </tr>
        ${ctaText && ctaUrl ? `
        <!-- CTA -->
        <tr>
          <td style="padding-bottom:40px;">
            <a href="${ctaUrl}" style="
              display:inline-block;
              padding:14px 26px;
              border:1px solid #ff8c2b;
              border-radius:10px;
              color:#ff8c2b;
              text-decoration:none;
              font-size:14px;
              font-weight:500;
            ">
              ${ctaText}
            </a>
          </td>
        </tr>
        ` : ''}
        <!-- FOOTER -->
        <tr>
          <td style="
            font-size:12px;
            color:#8e8e93;
            border-top:1px solid #26262c;
            padding-top:20px;
          ">
            © ${currentYear} Finwrk · Financial clarity in one place.<br/>
            This is an automated message. Please do not reply.
          </td>
        </tr>
      </table>
      <!-- END CONTENT -->
    </td>
  </tr>
</table>
</body>
</html>`;
}
