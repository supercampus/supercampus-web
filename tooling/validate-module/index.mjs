import { access, readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const expected = [
  "academics", "admissions", "alumni", "analytics", "application-desk",
  "attendance", "communications",
  "counselling-wellness", "crm", "documents", "employee-self-service",
  "examinations", "feedback-grievance", "fees", "form-builder", "gatepass",
  "hostel", "library", "no-due", "parents-self-service", "placement",
  "repairs-maintenance", "roles-modules", "sick-room-medical-records",
  "student-onboarding", "student-self-service", "timetable", "transport",
  "vendor-management", "visitor-management",
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
  const manifest = JSON.parse((await readFile(manifestPath, "utf8")).replace(/^\uFEFF/, ""));
  const required = ["key", "name", "version", "frontendEntry", "permissions", "capabilities"];
  const absent = required.filter((field) => manifest[field] === undefined);
  if (absent.length) throw new Error(`${key}: missing ${absent.join(", ")}`);
  if (manifest.key !== key) throw new Error(`${key}: manifest key must match its directory`);
  if (!manifest.permissions.every((permission) => permission.startsWith(`${key}.`))) {
    throw new Error(`${key}: every permission must use the ${key}.* namespace`);
  }

  const workflowDocsPath = resolve(modulesRoot, key, "docs", "workflows");
  const flowsPath = resolve(modulesRoot, key, "src", "flows.ts");
  const flowsJsonPath = resolve(modulesRoot, key, "src", "flows.json");
  try {
    await access(workflowDocsPath);
    const flows = await readFile(flowsPath, "utf8");
    const flowsJson = JSON.parse(await readFile(flowsJsonPath, "utf8"));
    const index = await readFile(resolve(modulesRoot, key, "src", "index.ts"), "utf8");
    if (!flows.includes("satisfies ModuleWorkflowCatalog")) {
      throw new Error(`${key}: workflow docs exist but src/flows.ts does not export a typed catalog`);
    }
    if (!Array.isArray(flowsJson.deliveryTargets) || flowsJson.deliveryTargets.length === 0) {
      throw new Error(`${key}: src/flows.json must declare deliveryTargets for Flutter/web consumers`);
    }
    if (key !== "roles-modules" && !flowsJson.deliveryTargets.some((target) => target.startsWith("flutter-"))) {
      throw new Error(`${key}: imported workflow must include at least one Flutter delivery target`);
    }
    if (flows.includes("workflows: []")) {
      throw new Error(`${key}: workflow catalog must include at least one workflow`);
    }
    if (!index.includes("workflowCatalog:")) {
      throw new Error(`${key}: module registration must expose workflowCatalog`);
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

console.log(`Validated ${expected.length} SuperCampus frontend modules: ${expected.join(", ")}`);
