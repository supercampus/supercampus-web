import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const workspace = await readFile(new URL('../src/components/modules/VendorShopsWorkspace.tsx', import.meta.url), 'utf8');
const api = await readFile(new URL('../src/lib/campus-operations-api.ts', import.meta.url), 'utf8');
const shell = await readFile(new URL('../src/components/modules/CampusOperationsWorkspace.tsx', import.meta.url), 'utf8');

test('shops remain a permission-aware workspace inside the unified staff portal', () => {
  assert.match(shell, /tab === 'Shops'[\s\S]*?<VendorShopsWorkspace/);
  assert.match(workspace, /capabilities\?\.createShops/);
  assert.match(workspace, /capabilities\?\.updateShops/);
  assert.match(workspace, /capabilities\?\.deleteShops/);
  assert.match(workspace, /capabilities\?\.topUpWallets/);
});

test('shops and mobile canteen operations share the same live API boundary', () => {
  assert.match(api, /operations\/canteen\/store/);
  assert.match(api, /operations\/canteen\/shops/);
  assert.match(api, /operations\/canteen\/wallets\/\$\{encodeURIComponent\(userId\)\}\/top-ups/);
  assert.match(workspace, /window\.setInterval/);
  assert.match(workspace, /5000/);
});
