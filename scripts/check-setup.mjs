import { existsSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const required = [
  ["Workspace dependencies", existsSync(resolve(root, "node_modules", "next"))],
  ["Platform application", existsSync(resolve(root, "apps", "platform", "package.json"))],
  ["CRM module", existsSync(resolve(root, "modules", "crm", "module.manifest.json"))],
];
const frontendEnv = existsSync(resolve(root, "apps", "platform", ".env.local"));
const [major, minor] = process.versions.node.split(".").map(Number);
const nodeSupported = major > 20 || (major === 20 && minor >= 9);

console.log(`Node.js ${process.versions.node} ${nodeSupported ? "OK" : "UNSUPPORTED (requires 20.9+)"}\n`);
for (const [label, ready] of required) console.log(`${ready ? "OK" : "MISSING"} ${label}`);
console.log(`${frontendEnv ? "OK" : "OPTIONAL"} Platform environment${frontendEnv ? "" : " (defaults to same-origin /api)"}`);

const ready = nodeSupported && required.every(([, present]) => present);
if (!ready) {
  console.log("\nSetup is incomplete. Follow README.md -> Fresh clone setup.");
  process.exitCode = 1;
} else {
  console.log("\nLocal frontend workspace prerequisites are present.");
}