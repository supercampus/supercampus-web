function backendHealthTarget(): URL {
  const runtimeProcess = Reflect.get(globalThis, "process") as NodeJS.Process;
  const runtimeEnvironment = runtimeProcess.env;
  const configured = process.env.API_PROXY_TARGET?.trim()
    || runtimeEnvironment.NEXT_PUBLIC_API_URL?.trim();
  if (!configured) {
    throw new Error("API_PROXY_TARGET or NEXT_PUBLIC_API_URL is required");
  }

  const target = new URL(configured);
  if (target.protocol !== "http:" && target.protocol !== "https:") {
    throw new Error("API upstream must use http or https");
  }
  target.pathname = target.pathname.replace(/\/api\/?$/, "/health");
  target.search = "";
  target.hash = "";
  return target;
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  try {
    const response = await fetch(backendHealthTarget(), {
      cache: "no-store",
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) throw new Error(`backend health returned ${response.status}`);

    return Response.json(
      { status: "ok", api: "connected" },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    console.error("Production health check failed", error);
    return Response.json(
      { status: "unavailable", api: "disconnected" },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
}
