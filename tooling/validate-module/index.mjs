import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const expected = [
  "academics", "admissions", "attendance", "crm", "documents", "examinations",
  "fees", "gatepass", "hostel", "library", "placement", "transport",
];
const modulesRoot = resolve("modules");
const directories = (await readdir(modulesRoot, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const missing = expected.filter((key) => !directories.includes(key));
const unexpected = directories.filter((key) => !expected.includes(key));
if (missing.length || unexpected.length) {
  throw new Error(`Module structure mismatch. Missing: ${missing.join(", ") || "none"}; unexpected: ${unexpected.join(", ") || "none"}`);
}

for (const key of expected) {
  const manifestPath = resolve(modulesRoot, key, "module.manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const required = ["key", "name", "version", "frontendEntry", "permissions", "capabilities"];
  const absent = required.filter((field) => manifest[field] === undefined);
  if (absent.length) throw new Error(`${key}: missing ${absent.join(", ")}`);
  if (manifest.key !== key) throw new Error(`${key}: manifest key must match its directory`);
  if (!manifest.permissions.every((permission) => permission.startsWith(`${key}.`))) {
    throw new Error(`${key}: every permission must use the ${key}.* namespace`);
  }
}

console.log(`Validated ${expected.length} SuperCampus frontend modules: ${expected.join(", ")}`);