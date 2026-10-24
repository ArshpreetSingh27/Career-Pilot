import { env } from '../config/env';

export interface TestEmail {
  to: string;
  subject: string;
  resetUrl: string;
}

// Kept in memory only for isolated integration tests. It is never exposed by
// an HTTP route, so reset tokens cannot be retrieved from the public API.
export const testEmailOutbox: TestEmail[] = [];

export const sendPasswordResetEmail = async (
  to: string,
  name: string,
  resetUrl: string
): Promise<void> => {
  const subject = 'Reset your CareerPilot password';
  if (env.NODE_ENV === 'test') {
    testEmailOutbox.push({ to, subject, resetUrl });
    return;
  }

  if (env.EMAIL_PROVIDER === 'console') {
    console.info(`[Email preview] Password reset for ${to}: ${resetUrl}`);
    return;
  }

  const html = `<p>Hello ${escapeHtml(name)},</p><p>Use the link below to reset your CareerPilot password. It expires in ${env.PASSWORD_RESET_EXPIRES_MINUTES} minutes and can only be used once.</p><p><a href="${escapeHtml(resetUrl)}">Reset password</a></p><p>If you did not request this, you can ignore this email.</p>`;

  if (env.EMAIL_PROVIDER === 'brevo') {
    if (!env.BREVO_API_KEY) throw new Error('BREVO_API_KEY is required when EMAIL_PROVIDER=brevo');
    await sendBrevoEmail({ to, subject, html, from: env.EMAIL_FROM, apiKey: env.BREVO_API_KEY });
    return;
  }

  if (!env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is required when EMAIL_PROVIDER=resend');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    console.error(JSON.stringify({ event: 'email_delivery_failed', provider: 'resend', status: response.status }));
    throw new Error(`Email provider rejected the request (${response.status})`);
  }
};

export const sendBrevoEmail = async (
  message: { to: string; subject: string; html: string; from: string; apiKey: string },
  fetchFn: typeof fetch = fetch
): Promise<void> => {
  const match = message.from.match(/^(?:([^<>]+)<)?([^<>\s]+@[^<>\s]+)>?$/);
  if (!match) throw new Error('EMAIL_FROM must be an email address or Name <email>');
  const response = await fetchFn('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': message.apiKey, Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sender: { name: match[1]?.trim() || 'CareerPilot', email: match[2] },
      to: [{ email: message.to }],
      subject: message.subject,
      htmlContent: message.html,
    }),
  });
  if (!response.ok) {
    console.error(JSON.stringify({ event: 'email_delivery_failed', provider: 'brevo', status: response.status }));
    throw new Error(`Email provider rejected the request (${response.status})`);
  }
};

const escapeHtml = (value: string): string => value.replace(/[&<>'"]/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
}[character] ?? character));
