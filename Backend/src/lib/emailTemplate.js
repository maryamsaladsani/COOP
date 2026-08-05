// Shared branded HTML wrapper for every transactional email COOP sends via Resend.
// Import buildEmailTemplate() and pass it only the body content for that email — the
// header/footer markup lives here once, so no send call duplicates it.
//
// Email-client-safe by construction: table-based layout (not div/flex — Outlook's Word
// rendering engine ignores most modern CSS), every style inline (no <style> block, no
// external stylesheet — Gmail strips <style> blocks in some contexts and blocks external
// CSS entirely), max-width 600px centered, and a solid navy `bgcolor`/`background-color`
// fallback on the header alongside the CSS gradient (Outlook desktop doesn't render
// `background-image` gradients at all and needs the plain color attribute to fall back to).

const env = require("../config/env");

const NAVY = "#001F5E";
const MID_BLUE = "#0080FF";
const LIGHT_BLUE = "#32C2FF";
const GREEN = "#00FF86";
const FOOTER_NAVY = "#001433";
const FONT_STACK = "'Alexandria', Arial, sans-serif";

// DEPLOYMENT CHECKLIST: FRONTEND_URL must be the real deployed Vercel domain in Railway's
// production environment before this logo will actually render — locally (or if it's still
// unset/localhost in Railway) the <img> tag below will just point at an unreachable URL and
// show as a broken image in the recipient's inbox. The template still builds and sends fine
// either way — this is a rendering concern, not something that should block sending.
function logoUrl() {
  return `${env.frontendUrl.replace(/\/+$/, "")}/assets/coopLogo1.png`;
}

// `options.previewText`: optional hidden preheader snippet shown next to the subject line in
// inbox lists (Gmail/Apple Mail/Outlook all support this convention) — purely cosmetic, safe
// to omit.
function buildEmailTemplate(bodyHtml, options = {}) {
  const { previewText = "" } = options;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>COOP</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f4f5f7;">
    ${
      previewText
        ? `<div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">${previewText}</div>`
        : ""
    }
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f5f7; margin:0; padding:0; width:100%;">
      <tr>
        <td align="center" style="padding: 24px 12px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; width:100%; background-color:#ffffff; border-radius:8px; overflow:hidden;">
            <!-- Header: brand gradient, solid navy bgcolor fallback for Outlook -->
            <tr>
              <td align="center" bgcolor="${NAVY}" style="background-color:${NAVY}; background-image:linear-gradient(135deg, ${NAVY} 0%, ${MID_BLUE} 45%, ${LIGHT_BLUE} 75%, ${GREEN} 100%); padding: 28px 24px;">
                <img
                  src="${logoUrl()}"
                  width="160"
                  alt="COOP"
                  style="display:block; width:160px; max-width:160px; height:auto; border:0; outline:none; text-decoration:none;"
                />
              </td>
            </tr>
            <!-- Body: caller-supplied content only, no header/footer markup duplicated here -->
            <tr>
              <td style="padding: 32px 28px; font-family: ${FONT_STACK}; color:#1a1a1a; font-size:15px; line-height:1.6;">
                ${bodyHtml}
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td align="center" bgcolor="${FOOTER_NAVY}" style="background-color:${FOOTER_NAVY}; padding: 20px 24px;">
                <p style="margin:0; font-family: ${FONT_STACK}; color:#ffffff; font-size:13px; font-weight:600;">
                  COOP &mdash; Coordinated Onboarding &amp; Operations Platform
                </p>
                <p style="margin:8px 0 0; font-family: ${FONT_STACK}; color:#9fb3d1; font-size:11px; line-height:1.5;">
                  This is a trainee-built system and not an official Saudi Energy communication.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

module.exports = { buildEmailTemplate };
