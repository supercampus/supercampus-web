import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const loginPage = await readFile(new URL('../src/components/auth/LoginPage.tsx', import.meta.url), 'utf8');
const appContext = await readFile(new URL('../src/lib/context.tsx', import.meta.url), 'utf8');

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