/**
 * Transactional email via Resend
 * Sending domain: send.cravr.fun (DNS configured ✓)
 * API key scoped to cravr.fun, Sending access only
 *
 * Docs: https://resend.com/docs/api-reference/emails/send-email
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const FROM = process.env.EMAIL_FROM ?? "noreply@cravr.fun";
const BASE_URL = "https://api.resend.com/emails";

interface SendOptions {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

interface ResendResponse {
  id?: string;
  error?: { message: string; name: string };
}

/**
 * Send a transactional email via Resend.
 * Returns the Resend message ID, or null in dev/offline mode.
 */
export async function sendEmail(opts: SendOptions): Promise<string | null> {
  if (!RESEND_API_KEY) {
    // Dev mode — log to console instead of sending
    console.log("[email:dev]", { to: opts.to, subject: opts.subject });
    return null;
  }

  try {
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: Array.isArray(opts.to) ? opts.to : [opts.to],
        subject: opts.subject,
        html: opts.html,
        reply_to: opts.replyTo,
      }),
    });

    const data: ResendResponse = await res.json();

    if (!res.ok || data.error) {
      console.error("[email] Resend error:", data.error ?? res.statusText);
      return null;
    }

    return data.id ?? null;
  } catch {
    console.error("[email] Failed to send — network error");
    return null;
  }
}

// ── Email templates ───────────────────────────────────────────────────────────

const base = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CRAVR</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#12121a;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#7c3aed,#db2777);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">CRAVR</h1>
          </td>
        </tr>
        <!-- Content -->
        <tr>
          <td style="padding:40px;color:rgba(255,255,255,0.85);font-size:15px;line-height:1.6;">
            ${content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;color:rgba(255,255,255,0.3);font-size:12px;">
            © ${new Date().getFullYear()} Cravr LLC · <a href="https://cravr.fun/unsubscribe" style="color:rgba(255,255,255,0.3);">Unsubscribe</a>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

const btn = (text: string, url: string) =>
  `<div style="text-align:center;margin:32px 0;">
    <a href="${url}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#7c3aed,#db2777);color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;">${text}</a>
  </div>`;

// ── Specific email senders ────────────────────────────────────────────────────

export const Emails = {
  /** Welcome email after registration */
  welcome: (to: string, username: string) =>
    sendEmail({
      to,
      subject: "Welcome to CRAVR 🎉",
      html: base(`
        <h2 style="color:#fff;margin:0 0 16px;">Welcome, ${username}!</h2>
        <p>Your account is live. Start exploring creators, earn credits, and unlock exclusive content.</p>
        ${btn("Go to CRAVR", "https://cravr.fun")}
        <p style="color:rgba(255,255,255,0.4);font-size:13px;">If you didn't create this account, ignore this email.</p>
      `),
    }),

  /** Password reset / forgot password */
  passwordReset: (to: string, resetUrl: string) =>
    sendEmail({
      to,
      subject: "Reset your CRAVR password",
      html: base(`
        <h2 style="color:#fff;margin:0 0 16px;">Reset your password</h2>
        <p>We received a request to reset your password. Click below — this link expires in <strong style="color:#a78bfa;">15 minutes</strong>.</p>
        ${btn("Reset Password", resetUrl)}
        <p style="color:rgba(255,255,255,0.4);font-size:13px;">Didn't request this? Your account is safe — ignore this email.</p>
      `),
    }),

  /** Age verification approved */
  ageVerifyApproved: (to: string, username: string) =>
    sendEmail({
      to,
      subject: "Age verification approved ✓",
      html: base(`
        <h2 style="color:#fff;margin:0 0 16px;">You're verified, ${username}!</h2>
        <p>Your identity has been verified. You now have full access to all CRAVR content.</p>
        ${btn("Explore CRAVR", "https://cravr.fun")}
      `),
    }),

  /** Age verification rejected */
  ageVerifyRejected: (to: string, reason: string) =>
    sendEmail({
      to,
      subject: "Age verification — action needed",
      html: base(`
        <h2 style="color:#fff;margin:0 0 16px;">Verification not approved</h2>
        <p>Your document was not accepted: <strong style="color:#f87171;">${reason}</strong></p>
        <p>Please re-submit with a clear, well-lit photo of a valid government-issued ID.</p>
        ${btn("Re-submit Verification", "https://cravr.fun/verify-age")}
      `),
    }),

  /** Manual age-verification request — sent to the support/admin inbox */
  manualVerifyRequest: (to: string, username: string, userEmail: string, userId: string) =>
    sendEmail({
      to,
      replyTo: userEmail || undefined,
      subject: `Manual age verification request — @${username}`,
      html: base(`
        <h2 style="color:#fff;margin:0 0 16px;">Manual verification requested</h2>
        <p>A member has requested manual age verification (CCBill purchase flow unavailable).</p>
        <ul style="color:rgba(255,255,255,0.8);line-height:1.8;">
          <li><strong>Username:</strong> @${username}</li>
          <li><strong>Email:</strong> ${userEmail || "—"}</li>
          <li><strong>User ID:</strong> ${userId}</li>
        </ul>
        <p>Review and approve in the admin queue:</p>
        ${btn("Open Admin Queue", "https://cravr.fun/admin/verify-queue")}
      `),
    }),

  /** New subscriber notification to creator */
  newSubscriber: (to: string, creatorName: string, subscriberName: string, tier: string) =>
    sendEmail({
      to,
      subject: `New subscriber: ${subscriberName}`,
      html: base(`
        <h2 style="color:#fff;margin:0 0 16px;">You have a new subscriber! 🎉</h2>
        <p><strong style="color:#a78bfa;">${subscriberName}</strong> just subscribed to your <strong>${tier}</strong> tier.</p>
        <p>Keep creating amazing content, ${creatorName}!</p>
        ${btn("View Dashboard", "https://cravr.fun/creator/dashboard")}
      `),
    }),

  /** Payout notification to creator */
  payoutSent: (to: string, amount: string, method: string) =>
    sendEmail({
      to,
      subject: `Payout sent: ${amount}`,
      html: base(`
        <h2 style="color:#fff;margin:0 0 16px;">Your payout is on the way 💸</h2>
        <p>We've sent <strong style="color:#4ade80;">${amount}</strong> via <strong>${method}</strong>.</p>
        <p>Transfers typically arrive within 1–3 business days.</p>
        ${btn("View Earnings", "https://cravr.fun/creator/dashboard")}
      `),
    }),
};
