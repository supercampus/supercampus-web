// Diffs the OpenAPI contract against the paths the frontend actually calls.
import fs from 'node:fs';
import path from 'node:path';

const SPEC = process.env.OPENAPI_SPEC ?? '../supercampus-backend/docs/openapi.yaml';
const SRC = process.env.PLATFORM_SRC ?? 'apps/platform/src';

const spec = JSON.parse(fs.readFileSync(SPEC, 'utf8'));
const METHODS = ['get', 'post', 'put', 'patch', 'delete'];

const operations = [];
for (const [p, item] of Object.entries(spec.paths)) {
  for (const m of METHODS) {
    if (item[m]) operations.push({ method: m.toUpperCase(), path: p, tag: (item[m].tags ?? ['Other'])[0], summary: item[m].summary ?? '' });
  }
}

// Collect every source file
const files = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(ts|tsx)$/.test(entry.name)) files.push(full);
  }
})(SRC);

// Clients compose paths from constants, so expand those before matching.
const source = files
  .map((f) => fs.readFileSync(f, 'utf8'))
  .join('\n')
  .replaceAll('${CRM_ROOT}', '/v1/crm')
  .replaceAll('${AUTHORIZATION_ROOT}', '/v1/authorization')
  .replaceAll('${V1}', '/v1');

// Normalise a spec path into a regex that tolerates template literals in the client,
// e.g. /api/v1/crm/leads/{id}/assign  ->  /crm/leads/${...}/assign
function matcherFor(specPath) {
  const withoutPrefix = specPath.replace(/^\/api/, '');
  const escaped = withoutPrefix
    .split('/')
    .map((seg) => {
      if (/^\{.+\}$/.test(seg)) return '(?:\\$\\{[^}]*\\}|[A-Za-z0-9_$.\\-]+)';
      return seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    })
    .join('/');
  // A client path may continue with a template expression (`${query}`) or end at a
  // quote, backtick, query string or call close.
  return new RegExp(escaped.replace(/^\//, '/') + '(?:[`\'"?)]|\\$\\{)');
}

const missing = [];
const covered = [];
for (const op of operations) {
  const re = matcherFor(op.path);
  (re.test(source) ? covered : missing).push(op);
}

console.log(`total operations : ${operations.length}`);
console.log(`referenced in UI : ${covered.length}`);
console.log(`NOT referenced   : ${missing.length}`);

const byTag = {};
for (const op of missing) (byTag[op.tag] ??= []).push(op);
console.log('\n--- unmapped, grouped by tag ---');
for (const [tag, ops] of Object.entries(byTag).sort((a, b) => b[1].length - a[1].length)) {
  console.log(`\n${tag} (${ops.length})`);
  for (const op of ops) console.log(`   ${op.method.padEnd(6)} ${op.path}`);
}
