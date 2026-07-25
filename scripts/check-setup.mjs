import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const required = [
  ['Frontend dependencies', existsSync(resolve(root, 'node_modules', 'next'))],
  ['Backend dependencies', existsSync(resolve(root, 'backend', 'node_modules', 'express'))],
  ['Backend environment', existsSync(resolve(root, 'backend', '.env'))],
];
const frontendEnv = existsSync(resolve(root, '.env.local'));
const [major, minor] = process.versions.node.split('.').map(Number);
const nodeSupported = major > 20 || (major === 20 && minor >= 9);

console.log(`Node.js ${process.versions.node} ${nodeSupported ? '✓' : '✗ (requires 20.9+)'}\n`);
for (const [label, ready] of required) console.log(`${ready ? '✓' : '✗'} ${label}`);
console.log(`${frontendEnv ? '✓' : '•'} Frontend environment ${frontendEnv ? '' : '(optional; defaults to http://localhost:4000/api)'}`);

const backendEnvPath = resolve(root, 'backend', '.env');
let backendVariablesReady = false;
if (existsSync(backendEnvPath)) {
  const env = readFileSync(backendEnvPath, 'utf8');
  const variables = ['DATABASE_URL', 'JWT_SECRET', 'FRONTEND_ORIGIN'];
  const results = variables.map((key) => [key, new RegExp(`^${key}=.+$`, 'm').test(env)]);
  for (const [key, ready] of results) console.log(`${ready ? '✓' : '✗'} backend/.env: ${key}`);
  backendVariablesReady = results.every(([, ready]) => ready);
}

const ready = nodeSupported && required.every(([, present]) => present) && backendVariablesReady;
if (!ready) {
  console.log('\nSetup is incomplete. Follow README.md → Fresh clone setup.');
  process.exitCode = 1;
} else {
  console.log('\nLocal project prerequisites are present.');
}