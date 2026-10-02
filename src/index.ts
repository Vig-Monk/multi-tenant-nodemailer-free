/**
 * multi-tenant-nodemailer-pool (Free Tier)
 * In-memory fingerprinted transporter cache preventing duplicate SMTP connections.
 */

import crypto from 'crypto';
import nodemailer, { Transporter } from 'nodemailer';

export interface SmtpConfig {
  host: string;
  port: number;
  secure?: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
  replyTo?: string | null;
}

export interface CachedTransporter {
  transporter: Transporter;
  fingerprint: string;
  fromAddress: string;
  replyToAddress?: string | null;
}

const pool = new Map<string, CachedTransporter>();

/**
 * Generates an immutable SHA-256 fingerprint for a set of SMTP credentials.
 */
export function computeSmtpFingerprint(config: SmtpConfig): string {
  const payload = `${config.host}:${config.port}:${config.secure ? '1' : '0'}:${config.user}:${config.pass}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
}

/**
 * Returns a cached Nodemailer transporter or creates a new pooled connection.
 * If credentials change for the tenant, the old connection is safely closed.
 */
export function getOrCreateTransporter(
  tenantKey: string,
  config: SmtpConfig
): {
  transporter: Transporter;
  from: string;
  replyTo?: string | null;
} {
  const fingerprint = computeSmtpFingerprint(config);
  const cached = pool.get(tenantKey);

  // Return existing transporter if credentials have not changed
  if (cached && cached.fingerprint === fingerprint) {
    return {
      transporter: cached.transporter,
      from: cached.fromAddress,
      replyTo: cached.replyToAddress,
    };
  }

  // Evict and close stale transporter if configuration was modified
  if (cached) {
    cached.transporter.close();
    pool.delete(tenantKey);
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure ?? config.port === 465,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
  });

  const fromAddress = `"${config.fromName}" <${config.fromEmail}>`;

  pool.set(tenantKey, {
    transporter,
    fingerprint,
    fromAddress,
    replyToAddress: config.replyTo,
  });

  return {
    transporter,
    from: fromAddress,
    replyTo: config.replyTo,
  };
}

/**
 * Removes a tenant's transporter from cache and terminates open sockets.
 */
export function invalidateTransporter(tenantKey: string): boolean {
  const cached = pool.get(tenantKey);
  if (cached) {
    cached.transporter.close();
    return pool.delete(tenantKey);
  }
  return false;
}

/**
 * Closes all pooled connections across all tenants (use during server shutdown).
 */
export function drainTransporterPool(): void {
  for (const [key, cached] of pool.entries()) {
    cached.transporter.close();
    pool.delete(key);
  }
}