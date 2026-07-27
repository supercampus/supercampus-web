import { NextRequest, NextResponse } from 'next/server';

async function proxyRequest(req: NextRequest, path: string[]) {
  const targetBase = (process.env.API_PROXY_TARGET || 'http://127.0.0.1:4000/api').replace(/\/$/, '');
  const url = `${targetBase}/${path.join('/')}${req.nextUrl.search}`;

  const headers = new Headers(req.headers);
  headers.delete('host');

  const body = ['GET', 'HEAD'].includes(req.method) ? undefined : await req.blob();

  try {
    const res = await fetch(url, {
      method: req.method,
      headers,
      body,
      redirect: 'manual',
    });

    const responseHeaders = new Headers(res.headers);
    return new NextResponse(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error('API Proxy Error:', err);
    return NextResponse.json({ error: 'Failed to reach backend API' }, { status: 502 });
  }
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxyRequest(req, path);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxyRequest(req, path);
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxyRequest(req, path);
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxyRequest(req, path);
}
