import { Resend } from 'resend';
import { config } from '../../config/index.js';

// Lazily created so a missing RESEND_API_KEY degrades to "email skipped"
// instead of crashing the whole app at import time.
let resendClient = null;
const getResend = () => {
  if (!resendClient) resendClient = new Resend(config.email.resendApiKey);
  return resendClient;
};

/**
 * While the Resend domain is unverified, only the account owner's address can
 * receive mail — so every message is redirected to `adminEmail` and the real
 * recipient is prefixed onto the subject. Set EMAIL_MODE=live (after verifying
 * a domain in Resend) to deliver straight to customers, with no code change.
 */
const resolveRecipient = to => {
  if (config.email.mode === 'live') return to;
  return config.email.adminEmail || to;
};

/**
 * Send a transactional email through Resend.
 * Never throws — email failures must not break the order/auth flow.
 */
export const sendEmail = async ({ to, subject, html, attachments } = {}) => {
  if (!config.email.resendApiKey) {
    console.warn(`RESEND_API_KEY missing — skipped email: "${subject}"`);
    return { skipped: true };
  }

  const recipient = resolveRecipient(to);
  const isRedirected = recipient !== to;
  const finalSubject = isRedirected ? `[→ ${to}] ${subject}` : subject;

  try {
    const { data, error } = await getResend().emails.send({
      from: config.email.resendFrom,
      to: recipient,
      subject: finalSubject,
      html,
      ...(attachments?.length ? { attachments } : {}),
    });

    if (error) {
      console.error('RESEND API ERROR:', error);
      return { error };
    }

    console.log(`Email "${finalSubject}" delivered to ${recipient}`, data?.id);
    return { deliveredTo: recipient, id: data?.id };
  } catch (error) {
    console.error('RESEND CATCH ERROR:', error.message);
    return { error: error.message };
  }
};

/**
 * Admin alerts always go to the store owner's inbox, regardless of EMAIL_MODE.
 */
export const sendAdminAlert = async ({ subject, html } = {}) => {
  const to = config.email.adminEmail;
  if (!to) {
    console.warn(`ADMIN_EMAIL missing — skipped admin alert: "${subject}"`);
    return { skipped: true };
  }
  return sendEmail({ to, subject, html });
};
