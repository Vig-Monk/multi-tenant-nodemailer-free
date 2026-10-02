multi-tenant-nodemailer-pool

Fingerprint-based SMTP connection pooling and transporter caching for Nodemailer.

«Built for multi-tenant SaaS applications where every tenant can bring their own SMTP credentials.»

Full version — $7: https://gumroad.com/l/multi-tenant-nodemailer-pool

---

The Problem

In multi-tenant SaaS applications, tenants may use their own SMTP providers such as Google Workspace, AWS SES, or Brevo.

Creating a new Nodemailer transporter for every email can cause:

- Repeated TLS handshakes
- Increased connection latency
- Excessive socket creation
- SMTP connection-limit errors
- Provider rate limiting
- Unnecessary resource usage

At the same time, simply sharing one global transporter can create a serious cross-tenant credential isolation problem.

The Solution

"multi-tenant-nodemailer-pool" maintains a dynamic transporter cache indexed by tenant keys.

Each SMTP configuration is SHA-256 fingerprinted, allowing the library to detect credential changes and automatically evict stale transporters.

Before

A new transporter and connection are created for every email:

app.post('/api/send', async (req, res) => {
  const creds = await getTenantSmtp(req.tenantId);

  const transporter = nodemailer.createTransport(creds);

  // New TLS connection for every request
  await transporter.sendMail(payload);

  transporter.close();
});

After

Transporters are reused while remaining isolated by tenant:

import { getOrCreateTransporter } from 'multi-tenant-nodemailer-pool';

app.post('/api/send', async (req, res) => {
  const creds = await getTenantSmtp(req.tenantId);

  const {
    transporter,
    from,
    replyTo,
  } = getOrCreateTransporter(req.tenantId, creds);

  await transporter.sendMail({
    from,
    replyTo: replyTo || undefined,
    to: req.body.to,
    subject: req.body.subject,
    html: req.body.html,
  });
});

When a tenant's SMTP configuration changes, the old cached transporter can be detected and evicted rather than continuing to use stale credentials.

---

Quick Start

npm install

Run the example:

npm run example

---

Features

- 🔐 SHA-256 SMTP configuration fingerprinting
- ♻️ Transporter pooling and connection reuse
- 🧹 Automatic stale-transporter eviction
- 🏢 Tenant-isolated transporter caching
- 📧 Nodemailer-based SMTP delivery
- ⚡ Avoids unnecessary TLS handshakes
- 🔌 Supports tenant-specific SMTP credentials

---

Free vs. Paid

Feature| Free| Paid ($7)
SHA-256 config fingerprinting| ✓| ✓
Transporter pooling and reuse| ✓| ✓
Stale socket cache eviction| ✓| ✓
Platform default SMTP fallback| —| ✓
AES-256-GCM encrypted credential boundary| —| ✓
Live connection verification| —| ✓
Test delivery helper| —| ✓
PostgreSQL encrypted SMTP schema migration| —| ✓
Automated unit test suite| —| ✓

Get the Full Version

"Get the full version for $7 →" (https://gumroad.com/l/multi-tenant-nodemailer-pool)

The paid version adds production-oriented functionality for applications that need encrypted credential storage, platform SMTP fallback, connection testing, PostgreSQL integration, and automated tests.

---

Example Architecture

                    ┌─────────────────────┐
                    │   Incoming Request  │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │     Tenant ID       │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   SMTP Credentials  │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ SHA-256 Fingerprint │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  Transporter Cache  │
                    └──────┬────────┬─────┘
                           │        │
                    Existing?     Changed?
                           │        │
                           ▼        ▼
                        Reuse     Evict
                           │        │
                           └────┬───┘
                                ▼
                     ┌────────────────────┐
                     │ Nodemailer SMTP    │
                     │     Transporter    │
                     └────────────────────┘

---

Use Cases

This is particularly useful for:

- Multi-tenant SaaS platforms
- CRM systems
- Transactional email services
- Marketplace platforms
- Business management systems
- Applications where tenants configure their own SMTP provider

---

License

The free version is released under the MIT License.

---

Full version — $7: https://gumroad.com/l/multi-tenant-nodemailer-pool
