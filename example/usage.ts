import {
  getOrCreateTransporter,
  invalidateTransporter,
  computeSmtpFingerprint,
} from '../src/index';

const tenantAConfig = {
  host: 'smtp.sendgrid.net',
  port: 465,
  secure: true,
  user: 'apikey',
  pass: 'SG.dummy_key_123',
  fromName: 'Acme Sales',
  fromEmail: 'sales@acme.com',
};

console.log('--- 1. Generating Configuration Fingerprint ---');
const fp = computeSmtpFingerprint(tenantAConfig);
console.log('SHA-256 Fingerprint:', fp);

console.log('\n--- 2. Resolving Transporter (First Request: Created) ---');
const channel1 = getOrCreateTransporter('tenant_acme', tenantAConfig);
console.log('Channel Resolved:', channel1.from);

console.log('\n--- 3. Resolving Transporter (Second Request: Reused Cache) ---');
const channel2 = getOrCreateTransporter('tenant_acme', tenantAConfig);
console.log('Reused Same Instance:', channel1.transporter === channel2.transporter); // true

console.log('\n--- 4. Invalidating Transporter on Credential Update ---');
const evicted = invalidateTransporter('tenant_acme');
console.log('Transporter Evicted and Closed:', evicted); // true