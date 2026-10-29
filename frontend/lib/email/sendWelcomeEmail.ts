import nodemailer from "nodemailer";

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });

export async function sendWelcomeEmail(email: string, name: string) {
  const user = process.env.GOOGLE_APP_EMAIL || process.env.SMTP_USER;
  const pass = process.env.GOOGLE_APP_PASSWORD || process.env.SMTP_PASSWORD;

  if (!user || !pass) {
    console.warn("Welcome email skipped: SMTP account credentials are not configured.");
    return false;
  }

  const fromName = process.env.GOOGLE_APP_NAME?.trim() || "NeuraView";
  const host = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT) || 465;
  const safeName = escapeHtml(name.trim() || "there");
  const siteUrl =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://neuraview.vercel.app";
  const safeSiteUrl = escapeHtml(siteUrl);

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 12000,
  });

  try {
    await transporter.sendMail({
      from: { name: fromName, address: user },
      to: email,
      subject: "Welcome to NeuraView — your interview practice starts here",
      text: `Hi ${name.trim() || "there"},\n\nWelcome to NeuraView. Your account is ready. Practice realistic interviews, get thoughtful feedback, and build confidence one session at a time.\n\nStart practicing: ${siteUrl}/create-interview\n\nWe're glad you're here,\nThe NeuraView team`,
      html: `
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width,initial-scale=1">
          <meta name="color-scheme" content="light">
          <meta name="supported-color-schemes" content="light">
          <style>
            @keyframes welcome-rise {
              from { opacity: 0; transform: translateY(12px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes welcome-glow {
              0%, 100% { opacity: .35; transform: scale(.96); }
              50% { opacity: .8; transform: scale(1.04); }
            }
            .welcome-content { animation: welcome-rise .7s ease-out both; }
            .welcome-orb { animation: welcome-glow 5s ease-in-out infinite; }
            .welcome-cta { transition: transform .2s ease, box-shadow .2s ease, background-color .2s ease; }
            .welcome-cta:hover { transform: translateY(-2px); background-color: #1d4ed8 !important; box-shadow: 0 10px 24px rgba(37,99,235,.3); }
            .welcome-link { transition: border-color .2s ease, background-color .2s ease; }
            .welcome-link:hover { border-color: #93c5fd !important; background-color: #f8fafc !important; }
            @media (prefers-reduced-motion: reduce) {
              .welcome-content, .welcome-orb { animation: none !important; }
              .welcome-cta, .welcome-link { transition: none !important; }
            }
            @media screen and (max-width: 520px) {
              .welcome-shell { padding: 20px 12px !important; }
              .welcome-panel { border-radius: 18px !important; }
              .welcome-hero, .welcome-content { padding: 26px 22px !important; }
              .welcome-title { font-size: 27px !important; }
            }
          </style>
        </head>
        <body style="margin:0;background:#eef2ff;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
          <div class="welcome-shell" style="max-width:640px;margin:0 auto;padding:40px 18px">
            <div class="welcome-panel" style="overflow:hidden;border:1px solid #dbeafe;border-radius:24px;background:#fff;box-shadow:0 20px 60px rgba(30,64,175,.12)">
              <div class="welcome-hero" style="position:relative;overflow:hidden;padding:38px 38px 34px;background:#1e40af;background-image:linear-gradient(125deg,#1d4ed8 0%,#4f46e5 55%,#7c3aed 100%);color:#fff">
                <div class="welcome-orb" style="position:absolute;top:-95px;right:-55px;width:230px;height:230px;border:1px solid rgba(255,255,255,.22);border-radius:50%;background:rgba(255,255,255,.08);box-shadow:0 0 0 24px rgba(255,255,255,.04),0 0 0 48px rgba(255,255,255,.025)"></div>
                <div style="position:relative">
                  <p style="margin:0 0 22px;font-size:12px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:#dbeafe">NEURAVIEW <span style="color:#a5f3fc">✦</span></p>
                  <p style="margin:0 0 10px;font-size:14px;font-weight:600;color:#dbeafe">A fresh start, ${safeName}.</p>
                  <h1 class="welcome-title" style="max-width:460px;margin:0;font-size:34px;line-height:1.15;letter-spacing:-.7px">Your next interview starts here.</h1>
                  <p style="margin:14px 0 0;font-size:15px;line-height:1.7;color:#e0e7ff">Practice at your pace. Grow with every answer.</p>
                </div>
              </div>
              <div class="welcome-content" style="padding:34px 38px 38px">
                <p style="margin:0 0 14px;font-size:16px;line-height:1.65">Hi ${safeName},</p>
                <p style="margin:0;font-size:15px;line-height:1.8;color:#475569">Welcome to NeuraView. Your account is ready. Try a realistic practice interview, explore your ideas out loud, and get feedback to help you feel more prepared.</p>
                <div style="margin:26px 0 22px;text-align:center">
                  <a class="welcome-cta" href="${safeSiteUrl}/create-interview" style="display:inline-block;border:1px solid #2563eb;border-radius:12px;background:#2563eb;padding:15px 24px;color:#fff;text-decoration:none;font-size:15px;font-weight:700;box-shadow:0 6px 16px rgba(37,99,235,.2)">Start your first practice <span aria-hidden="true">→</span></a>
                </div>
                <p style="margin:0 0 13px;font-size:12px;font-weight:700;letter-spacing:1.3px;text-transform:uppercase;color:#64748b">A few ways to get started</p>
                <a class="welcome-link" href="${safeSiteUrl}/create-interview" style="display:block;margin:0 0 10px;border:1px solid #e2e8f0;border-radius:12px;background:#fff;padding:14px 16px;color:#0f172a;text-decoration:none">
                  <span style="font-size:14px;font-weight:700">Practice a mock interview</span><br>
                  <span style="font-size:12px;line-height:1.6;color:#64748b">Choose a role and start a guided session.</span>
                </a>
                <a class="welcome-link" href="${safeSiteUrl}/reports" style="display:block;border:1px solid #e2e8f0;border-radius:12px;background:#fff;padding:14px 16px;color:#0f172a;text-decoration:none">
                  <span style="font-size:14px;font-weight:700">Explore your feedback</span><br>
                  <span style="font-size:12px;line-height:1.6;color:#64748b">Review your interview reports and next steps.</span>
                </a>
                <p style="margin:24px 0 0;font-size:14px;line-height:1.75;color:#64748b">There’s no pressure to be perfect. Every session is a chance to get more comfortable.</p>
                <p style="margin:22px 0 0;font-size:14px;line-height:1.65;color:#475569">We’re glad you’re here,<br><strong style="color:#0f172a">The NeuraView team</strong></p>
              </div>
            </div>
            <p style="margin:18px 0 0;text-align:center;font-size:12px;line-height:1.6;color:#94a3b8">You received this message because an account was created with this email address.</p>
          </div>
        </body>
      </html>
    `,
    });

    return true;
  } finally {
    transporter.close();
  }
}
