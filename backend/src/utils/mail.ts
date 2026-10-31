import { env, isTest } from '../config/env.js';
import { logger } from './logger.js';

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
}

export interface MailTransport {
  name: string;
  send(message: MailMessage): Promise<void>;
}

const outbox: MailMessage[] = [];

/** Test-only view of delivered mail. Always empty outside NODE_ENV=test. */
export function getOutbox(): readonly MailMessage[] {
  return outbox;
}

export function clearOutbox(): void {
  outbox.length = 0;
}

const consoleTransport: MailTransport = {
  name: 'console',
  async send(message) {
    logger.info(`Mail → ${message.to}: ${message.subject}\n${message.text}`);
  },
};

function webhookTransport(url: string): MailTransport {
  return {
    name: 'webhook',
    async send(message) {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: env.MAIL_FROM, ...message }),
      });
      if (!response.ok) throw new Error(`Mail webhook responded ${response.status}`);
    },
  };
}

function resolveTransport(): MailTransport {
  if (env.MAIL_TRANSPORT === 'webhook' && env.MAIL_WEBHOOK_URL) {
    return webhookTransport(env.MAIL_WEBHOOK_URL);
  }
  return consoleTransport;
}

export async function sendMail(message: MailMessage): Promise<void> {
  if (isTest) {
    outbox.push(message);
    return;
  }
  try {
    await resolveTransport().send(message);
  } catch (error) {
    // Delivery failures never break the request: forgot-password must stay generic.
    logger.error('Mail delivery failed', { to: message.to, error: String(error) });
  }
}
