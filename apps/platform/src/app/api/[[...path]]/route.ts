const HOP_BY_HOP_HEADERS = [
  "connection",
  "content-length",
  "expect",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
];

type ProxyContext = {
  params: Promise<{ path?: string[] }>;
};

function apiTarget(): URL {
  // Reading through an aliased environment object keeps NEXT_PUBLIC_API_URL
  // runtime-readable in this server-only route instead of letting Next inline
  // its build-time value into the standalone bundle.
  const runtimeProcess = Reflect.get(globalThis, "process") as NodeJS.Process;
  const runtimeEnvironment = runtimeProcess.env;
  const configured = process.env.API_PROXY_TARGET?.trim()
    || runtimeEnvironment.NEXT_PUBLIC_API_URL?.trim();
  if (!configured && process.env.NODE_ENV === "production") {
    throw new Error("API_PROXY_TARGET or NEXT_PUBLIC_API_URL is required in production");
  }
  const value = configured || "http://127.0.0.1:4000/api";
  const target = new URL(value.endsWith("/") ? value : `${value}/`);

  if (target.protocol !== "http:" && target.protocol !== "https:") {
    throw new Error("API_PROXY_TARGET must use http or https");
  }

  return target;
}

async function proxy(request: Request, context: ProxyContext): Promise<Response> {
  try {
    const { path = [] } = await context.params;
    const incoming = new URL(request.url);
    const target = new URL(path.map(encodeURIComponent).join("/"), apiTarget());
    target.search = incoming.search;

    const headers = new Headers(request.headers);
    for (const name of HOP_BY_HOP_HEADERS) headers.delete(name);
    headers.set("accept-encoding", "identity");
    headers.set("x-forwarded-host", incoming.host);
    headers.set("x-forwarded-proto", incoming.protocol.replace(":", ""));

    const hasBody = request.method !== "GET" && request.method !== "HEAD" && request.body !== null;
    const init: RequestInit & { duplex?: "half" } = {
      method: request.method,
      headers,
      body: hasBody ? request.body : undefined,
      cache: "no-store",
      redirect: "manual",
      signal: request.signal,
    };
    if (hasBody) init.duplex = "half";

    const upstream = await fetch(target, init);
    const responseHeaders = new Headers(upstream.headers);
    for (const name of HOP_BY_HOP_HEADERS) responseHeaders.delete(name);

    return new Response(request.method === "HEAD" ? null : upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("API proxy request failed", error);
    return Response.json(
      { error: "API service unavailable" },
      { status: 502, headers: { "cache-control": "no-store" } },
    );
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = proxy;
export const HEAD = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
