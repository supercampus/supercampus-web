import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const loginPage = await readFile(new URL('../src/components/auth/LoginPage.tsx', import.meta.url), 'utf8');
const appContext = await readFile(new URL('../src/lib/context.tsx', import.meta.url), 'utf8');
const api = await readFile(new URL('../src/lib/api.ts', import.meta.url), 'utf8');
const homePage = await readFile(new URL('../src/app/page.tsx', import.meta.url), 'utf8');
const portalAccess = await readFile(new URL('../src/lib/portal-access.ts', import.meta.url), 'utf8');

test('login inputs do not expose seeded credentials', () => {
  assert.match(loginPage, /const \[email, setEmail\] = useState\(''\);/);
  assert.match(loginPage, /const \[password, setPassword\] = useState\(''\);/);
  assert.doesNotMatch(loginPage, /Student@123|Campus@123|arun\.kumar@|priya\.sharma@/i);
});

test('login failures cannot create an authenticated frontend session', () => {
  const start = appContext.indexOf('const login = useCallback');
  const end = appContext.indexOf('const logout = useCallback', start);
  const loginBlock = appContext.slice(start, end);

  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  assert.doesNotMatch(loginBlock, /mockStudent|fallback to demo/);
  assert.match(loginBlock, /catch \(error\)[\s\S]*setStudent\(null\)/);
  assert.match(loginBlock, /catch \(error\)[\s\S]*setAuthStatus\('unauthenticated'\)/);
  assert.match(loginBlock, /catch \(error\)[\s\S]*throw error/);
});

test('web login lets the API resolve the tenant from the globally unique identity', () => {
  const start = api.indexOf('export function login');
  const end = api.indexOf('export function forgotPassword', start);
  const loginBlock = api.slice(start, end);

  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  assert.doesNotMatch(loginBlock, /DEFAULT_TENANT_ID|resolveTenantId|x-tenant-id/);
  assert.doesNotMatch(loginPage, /tenant[ -]?id/i);
});

test('authenticated URLs use the tenant code and keep the database tenant id private', () => {
  const slugStart = portalAccess.indexOf('export function tenantSlug');
  const slugBlock = portalAccess.slice(slugStart);

  assert.notEqual(slugStart, -1);
  assert.match(slugBlock, /identity\.tenant\.code/);
  assert.doesNotMatch(slugBlock, /tenantId/);
  assert.match(homePage, /tenantPortalPath\(student/);
  assert.match(homePage, /window\.location\.replace\(authenticatedPath\)/);
  assert.doesNotMatch(homePage, /\/login\/dashboard/);
});
