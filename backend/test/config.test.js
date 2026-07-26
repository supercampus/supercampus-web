import test from 'node:test';
import assert from 'node:assert/strict';

process.env.DATABASE_URL ??= 'postgresql://user:password@127.0.0.1:5432/supercampus';
process.env.JWT_SECRET ??= 'local-test-secret-that-is-at-least-32-characters';
process.env.FRONTEND_ORIGIN ??= 'http://localhost:3000';

const { loadConfig } = await import('../src/config.js');

const baseEnvironment = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://user:password@postgres:5432/supercampus',
  DATABASE_SSL: 'disable',
  PGPOOL_MAX: '10',
  JWT_SECRET: 'production-test-secret-that-is-at-least-32-characters',
  FRONTEND_ORIGIN: 'https://student.supercampus.ai',
};

test('production configuration accepts the Dokploy deployment shape', () => {
  const result = loadConfig(baseEnvironment);
  assert.equal(result.apiHost, '127.0.0.1');
  assert.equal(result.frontendOrigin, 'https://student.supercampus.ai');
  assert.equal(result.poolMax, 10);
});

test('production configuration requires an HTTPS frontend origin', () => {
  assert.throws(
    () => loadConfig({ ...baseEnvironment, FRONTEND_ORIGIN: undefined }),
    /FRONTEND_ORIGIN is required in production/,
  );
  assert.throws(
    () => loadConfig({ ...baseEnvironment, FRONTEND_ORIGIN: 'http://student.supercampus.ai' }),
    /must use HTTPS in production/,
  );
});

test('production configuration rejects example JWT secrets', () => {
  assert.throws(
    () => loadConfig({ ...baseEnvironment, JWT_SECRET: 'replace-with-a-long-random-production-secret' }),
    /non-placeholder value/,
  );
});