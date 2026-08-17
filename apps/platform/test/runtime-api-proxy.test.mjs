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
  assert.match(routeSource, /Reflect\.get\(globalThis, "process"\)/);
  assert.match(routeSource, /runtimeEnvironment\.NEXT_PUBLIC_API_URL/);
  assert.match(routeSource, /API_PROXY_TARGET is required in production/);
  assert.match(routeSource, /export const POST = proxy/);
  assert.match(routeSource, /export const dynamic = "force-dynamic"/);
  assert.doesNotMatch(routeSource, /API_PROXY_ENABLED/);
  assert.doesNotMatch(routeSource, /same-origin API proxy is disabled/);
  assert.doesNotMatch(configSource, /async rewrites\(\)/);
});

test("production CSP permits the configured API origin", () => {
  assert.match(configSource, /process\.env\.NEXT_PUBLIC_API_URL/);
  assert.match(configSource, /NEXT_PUBLIC_API_URL is required in production/);
  assert.match(configSource, /apiUrl\.origin/);
  assert.match(configSource, /connect-src \$\{apiConnectSource\(\)\}/);
  assert.doesNotMatch(configSource, /connect-src 'self';/);
  assert.match(dockerSource, /FROM node:22-alpine AS runner[\s\S]*ARG NEXT_PUBLIC_API_URL/);
  assert.match(dockerSource, /FROM node:22-alpine AS runner[\s\S]*ENV NEXT_PUBLIC_API_URL=\$NEXT_PUBLIC_API_URL/);
  assert.match(dockerSource, /ARG NEXT_PUBLIC_API_URL=\/api/);
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
  assert.match(healthSource, /runtimeEnvironment\.NEXT_PUBLIC_API_URL/);
  assert.match(healthSource, /target\.pathname = target\.pathname\.replace/);
  assert.match(healthSource, /"\/health"/);
  assert.match(healthSource, /status: 503/);
  assert.match(dockerSource, /127\.0\.0\.1:3000\/health/);
});
