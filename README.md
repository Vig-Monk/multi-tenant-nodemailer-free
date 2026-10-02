# multi-tenant-nodemailer-pool

Fingerprinted SMTP connection pool and transporter cache for Nodemailer.

→ Full version ($7): https://gumroad.com/l/multi-tenant-nodemailer-pool

In multi-tenant SaaS applications where tenants bring their own SMTP credentials (Google Workspace, AWS SES, Brevo), creating a new Nodemailer transporter on every outgoing email causes massive handshake latency, socket exhaustion, and mail provider rate bans. Naively sharing a global transporter risks cross-tenant credential leaks.

This utility manages a dynamic connection pool indexed by tenant keys with SHA-256 configuration fingerprinting and automatic stale-socket eviction.

## The Fix

### Before (Creates socket on every send, hits connection limits)

app.post('/api/send', async (req, res) => {
  const creds = await getTenantSmtp(req.tenantId);
  const transporter = nodemailer.createTransport(creds); // Slow: new TLS handshake every call
  await transporter.sendMail(payload);
  transporter.close();
});

### After (Zero-overhead connection reuse, auto-evicts on credential update)

import { getOrCreateTransporter } from 'multi-tenant-nodemailer-pool';

app.post('/api/send', async (req, res) => {
  const creds = await getTenantSmtp(req.tenantId);
  const { transporter, from, replyTo } = getOrCreateTransporter(req.tenantId, creds);

  await transporter.sendMail({
    from,
    replyTo: replyTo || undefined,
    to: req.body.to,
    subject: req.body.subject,
    html: req.body.html,
  });
});

## Quick Start

npm install
npm run example

## What's Free vs. Paid

| Feature | Free Tier | Paid Version ($7) |
|---|---|---|
| SHA-256 config fingerprinting | Included | Included |
| Transporter pooling and reuse | Included | Included |
| Stale socket cache eviction | Included | Included |
| Platform default SMTP fallback | - | Included |
| AES-256-GCM encrypted credential boundary | - | Included |
| Live connection verify + test delivery helper | - | Included |
| PostgreSQL encrypted SMTP schema migration | - | Included |
| Automated unit test suite | - | Included |

→ Full version ($7): https://gumroad.com/l/multi-tenant-nodemailer-pool

MIT (free tier)