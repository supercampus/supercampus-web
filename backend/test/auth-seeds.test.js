import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import bcrypt from 'bcryptjs';
import { loginSchema } from '../src/schemas.js';

test('login email is validated and normalized', () => {
  const credentials = loginSchema.parse({ email: '  Arun.Kumar@SVCE.edu.in ', password: 'Student@123' });
  assert.equal(credentials.email, 'arun.kumar@svce.edu.in');
});

test('both seeded test passwords match their bcrypt hashes', async () => {
  const sql = await readFile(new URL('../src/migrations/002_tenant_auth.sql', import.meta.url), 'utf8');
  const hashes = [...sql.matchAll(/\$2b\$12\$[A-Za-z0-9./]{53}/g)].map((match) => match[0]);
  assert.equal(hashes.length, 2);
  assert.equal(await bcrypt.compare('Student@123', hashes[0]), true);
  assert.equal(await bcrypt.compare('Campus@123', hashes[1]), true);
});