// Sends the verification code by email (Gmail SMTP by default).
// Configure SMTP_USER and SMTP_PASS in .env (for Gmail, SMTP_PASS must be a Google "App password").
import nodemailer from 'nodemailer'

const { SMTP_HOST = 'smtp.gmail.com', SMTP_PORT = '465', SMTP_USER, SMTP_PASS, MAIL_FROM } = process.env

export const mailConfigured = Boolean(SMTP_USER && SMTP_PASS)

const transport = mailConfigured
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  : null

function html(code, minutes) {
  const digits = code
    .split('')
    .map(
      (d) =>
        `<td style="width:44px;height:54px;border-radius:10px;background:#f0fdf4;border:1px solid #bbf7d0;font:800 28px Arial,sans-serif;color:#14532d;text-align:center">${d}</td>`,
    )
    .join('<td style="width:8px"></td>')
  return `<!doctype html><html><body style="margin:0;background:#f4f9f5;padding:32px 12px;font-family:Arial,sans-serif;color:#0b1f14">
  <table role="presentation" width="100%" style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:18px;border:1px solid #e0ece4">
    <tr><td style="padding:28px 28px 8px">
      <div style="font:800 26px Arial,sans-serif;color:#15803d">Fast<span style="color:#22c55e">op</span></div>
      <h1 style="font:700 20px Arial,sans-serif;margin:18px 0 8px">Confirm your email</h1>
      <p style="font:15px/1.5 Arial,sans-serif;color:#34493d;margin:0">Enter this code in Fastop to finish setting up your account.</p>
    </td></tr>
    <tr><td style="padding:22px 28px"><table role="presentation" style="margin:0 auto"><tr>${digits}</tr></table></td></tr>
    <tr><td style="padding:0 28px 28px">
      <p style="font:14px/1.5 Arial,sans-serif;color:#64806f;margin:0">The code expires in <b>${minutes} minutes</b>. If you didn't try to sign in to Fastop, you can ignore this email.</p>
    </td></tr>
  </table></body></html>`
}

export async function sendVerificationCode(to, code, minutes) {
  if (!transport) {
    // Development fallback: no mail account configured yet. The code is printed in the
    // server terminal only (never sent to the browser) so the flow can still be tested.
    console.warn(`[mail not configured] Verification code for ${to}: ${code} (expires in ${minutes} min)`)
    return
  }
  // Gmail only lets you send as the account you logged in with (or a verified alias),
  // so mail always comes FROM SMTP_USER; a different MAIL_FROM becomes the Reply-To.
  const fromAddr = (MAIL_FROM || '').match(/<([^>]+)>/)?.[1] || (MAIL_FROM || '').trim()
  const sameAccount = !fromAddr || fromAddr.toLowerCase() === SMTP_USER.toLowerCase()
  await transport.sendMail({
    from: { name: 'Fastop', address: SMTP_USER },
    replyTo: sameAccount ? undefined : fromAddr,
    to,
    subject: `${code} is your Fastop verification code`,
    text: `Your Fastop verification code is ${code}. It expires in ${minutes} minutes. If you didn't try to sign in, ignore this email.`,
    html: html(code, minutes),
  })
}
