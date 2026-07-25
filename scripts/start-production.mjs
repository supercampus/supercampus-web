import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const backendRoot = join(appRoot, 'backend');
const frontendRoot = join(appRoot, 'frontend');

function start(name, args, cwd, env = process.env) {
  const child = spawn(process.execPath, args, { cwd, env, stdio: 'inherit' });
  child.on('error', (error) => console.error(`${name} failed to start`, error));
  return child;
}
function waitForExit(child) {
  if (child.exitCode !== null || child.signalCode !== null) {
    return Promise.resolve({ code: child.exitCode, signal: child.signalCode });
  }
  return new Promise((resolve) => child.once('exit', (code, signal) => resolve({ code, signal })));
}

console.log('Applying database migrations...');
const migration = start('migration', ['src/migrate.js'], backendRoot);
const migrationResult = await waitForExit(migration);
if (migrationResult.code !== 0) {
  console.error('Database migration failed; application startup cancelled.');
  process.exit(migrationResult.code ?? 1);
}

console.log('Starting Super Campus frontend and backend...');
const backend = start('backend', ['src/server.js'], backendRoot, { ...process.env, NODE_ENV: 'production', PORT: '4000' });
const frontend = start('frontend', ['server.js'], frontendRoot, { ...process.env, NODE_ENV: 'production', HOSTNAME: '0.0.0.0', PORT: '3000' });
const children = [backend, frontend];
let shuttingDown = false;

async function shutdown(signal, exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} received; stopping application...`);
  for (const child of children) if (!child.killed) child.kill('SIGTERM');
  const forceTimer = setTimeout(() => {
    for (const child of children) {
      if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
    }
  }, 8_000);
  await Promise.all(children.map(waitForExit));
  clearTimeout(forceTimer);
  process.exit(exitCode);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
for (const [name, child] of [['backend', backend], ['frontend', frontend]]) {
  child.once('exit', (code, signal) => {
    if (!shuttingDown) {
      console.error(`${name} exited unexpectedly (${signal ?? code ?? 'unknown'}).`);
      shutdown(`${name.toUpperCase()}_EXIT`, code ?? 1);
    }
  });
}