# 📬 multi-tenant-nodemailer-pool

> Fingerprint-based SMTP connection pooling and transporter caching for Nodemailer. Built for multi-tenant SaaS applications where each tenant uses their own SMTP credentials.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![Nodemailer](https://img.shields.io/badge/Nodemailer-v6.x-007acc.svg)](https://nodemailer.com/)
[![Full Version](https://img.shields.io/badge/Gumroad-Full%20Version%20($7)-FF6B6B.svg?style=flat&logo=gumroad)](https://gumroad.com/l/multi-tenant-nodemailer-pool)

---

## The Problem

In multi-tenant SaaS applications, tenants often configure their own SMTP providers (such as Google Workspace, AWS SES, or Brevo). 

Creating a new Nodemailer transporter for every email causes severe production bottlenecks:

- **Repeated TLS handshakes** introducing latency to every outgoing email
- **Excessive socket creation** leading to connection and file-descriptor exhaustion
- **SMTP connection-limit errors** and provider-side rate limiting
- **Unnecessary resource consumption** from continually tearing down and setting up pools
- **Cross-tenant leaks** if a naive global transporter is shared without tenant isolation

---

## The Solution

`multi-tenant-nodemailer-pool` maintains an in-memory, tenant-isolated cache of active Nodemailer transporters.

Each tenant's SMTP configuration is digested into a **SHA-256 fingerprint**. When a tenant updates their credentials, the library detects the change, terminates and evicts the stale transporter, and creates a fresh connection pool transparently.

---

## Code Comparison

### Before (Naive Approach)
A brand-new transporter and TLS handshake are created for every single email:

```javascript
import nodemailer from 'nodemailer';

app.post('/api/send', async (req, res) => {
  const creds = await getTenantSmtp(req.tenantId);

  // New connection setup and TLS handshake for every request
  const transporter = nodemailer.createTransport(creds);

  await transporter.sendMail(req.body.payload);

  transporter.close();
  res.json({ success: true });
});
```

### After (`multi-tenant-nodemailer-pool`)
Transporters are pooled, isolated by tenant ID, and reused across requests:

```javascript
import { getOrCreateTransporter } from 'multi-tenant-nodemailer-pool';

app.post('/api/send', async (req, res) => {
  const creds = await getTenantSmtp(req.tenantId);

  // Reuses warm socket; automatically detects config changes and evicts stale pools
  const { transporter, from, replyTo } = getOrCreateTransporter(
    req.tenantId,
    creds
  );

  await transporter.sendMail({
    from,
    replyTo: replyTo || undefined,
    to: req.body.to,
    subject: req.body.subject,
    html: req.body.html,
  });

  res.json({ success: true });
});
```

---

## Quick Start

### Installation

```bash
npm install
```

### Run Example

```bash
npm run example
```

---

## Architecture

```text
Incoming Request
       |
       v
   Tenant ID
       |
       v
SMTP Credentials
       |
       v
SHA-256 Fingerprint
       |
       v
Transporter Cache
       |
   +---+---+
   |       |
Exists?  Changed?
   |       |
 Reuse    Evict
   |       |
   +---+---+
       |
       v
Nodemailer SMTP Transporter
```

---

## Features

- **SHA-256 Configuration Fingerprinting** — Tracks credential modifications without storing raw credentials in cache keys.
- **Tenant-Isolated Transporter Caching** — Strict key-based partitioning prevents cross-tenant data leaks.
- **Transporter Pooling & Connection Reuse** — Keeps SMTP sockets warm to avoid recurrent TLS handshake latency.
- **Automatic Stale-Transporter Eviction** — Safely closes and removes out-of-date or disconnected transporter instances.
- **Native Nodemailer Compatibility** — Works directly with standard Nodemailer configurations and options.
- **Zero Overhead** — Minimal, lightweight footprint without heavy third-party dependencies.

---

## Free vs. Paid

| Feature | Free (MIT) | [Paid ($7)](https://gumroad.com/l/multi-tenant-nodemailer-pool) |
| :--- | :---: | :---: |
| SHA-256 config fingerprinting | ✓ | ✓ |
| Transporter pooling and reuse | ✓ | ✓ |
| Stale socket cache eviction | ✓ | ✓ |
| Platform default SMTP fallback | — | ✓ |
| AES-256-GCM encrypted credential boundary | — | ✓ |
| Live connection verification | — | ✓ |
| Test delivery helper | — | ✓ |
| PostgreSQL encrypted SMTP schema migration | — | ✓ |
| Automated unit test suite | — | ✓ |

### Pro Version Details

The paid version adds production-oriented functionality for applications requiring encrypted credential storage at rest, platform fallback configurations, connection diagnostics, PostgreSQL migrations, and a comprehensive test suite.

👉 **[Get the Full Version for $7 on Gumroad](https://gumroad.com/l/multi-tenant-nodemailer-pool)**

---

## Use Cases

- **Multi-Tenant SaaS Platforms** — Enabling customer organizations to send transactional emails via their own custom SMTP accounts.
- **CRM & Helpdesk Software** — Keeping outbound support tickets routed through client-owned mail servers.
- **E-Commerce & Marketplaces** — Allowing individual vendor storefronts to configure distinct notification providers.
- **Transactional Delivery Relays** — Managing dynamic routing and failover across multiple SMTP endpoints.

---

## License

The free version of this project is licensed under the [MIT License](LICENSE).
