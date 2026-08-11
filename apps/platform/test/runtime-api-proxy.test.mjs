import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const routeSource = await readFile(
  new URL("../src/app/api/[[...path]]/route.ts", import.meta.url),
  "utf8",
);
const configSource = await readFile(
  new URL("../next.config.ts", import.meta.url),
  "utf8",
);
const healthSource = await readFile(
  new URL("../src/app/health/route.ts", import.meta.url),
  "utf8",
);
const dockerSource = await readFile(
  new URL("../../../Dockerfile", import.meta.url),
  "utf8",
);

test("API requests use a runtime route instead of a build-time rewrite", () => {
  assert.match(routeSource, /process\.env\.API_PROXY_TARGET/);
  assert.match(routeSource, /API_PROXY_TARGET is required in production/);
  assert.match(routeSource, /export const POST = proxy/);
  assert.match(routeSource, /export const dynamic = "force-dynamic"/);
  assert.doesNotMatch(configSource, /async rewrites\(\)/);
});

test("runtime proxy preserves streaming requests and upstream responses", () => {
  assert.match(routeSource, /body: hasBody \? request\.body : undefined/);
  assert.match(routeSource, /init\.duplex = "half"/);
  assert.match(routeSource, /upstream\.body/);
  assert.match(routeSource, /redirect: "manual"/);
  assert.match(routeSource, /"expect"/);
});

test("container health requires connectivity to the Rust API", () => {
  assert.match(healthSource, /process\.env\.API_PROXY_TARGET/);
  assert.match(healthSource, /target\.pathname = target\.pathname\.replace/);
  assert.match(healthSource, /"\/health"/);
  assert.match(healthSource, /status: 503/);
  assert.match(dockerSource, /127\.0\.0\.1:3000\/health/);
});
