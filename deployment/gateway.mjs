import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer, request as proxyRequest } from 'node:http';
import { extname, isAbsolute, normalize, relative, resolve } from 'node:path';
import { spawn } from 'node:child_process';

const publicPort = Number(process.env.PORT || 3000);
const portalPort = Number(process.env.PORTAL_PORT || 3001);
const landingRoot = resolve(process.env.LANDING_ROOT || '/app/landing');
const portalServer = process.env.PORTAL_SERVER || 'apps/platform/server.js';
let shuttingDown = false;

const contentTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.ttf', 'font/ttf'],
  ['.webp', 'image/webp'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
]);

const portal = spawn(process.execPath, [portalServer], {
  env: {
    ...process.env,
    HOSTNAME: '127.0.0.1',
    PORT: String(portalPort),
  },
  stdio: 'inherit',
});

portal.on('exit', (code, signal) => {
  if (!shuttingDown) {
    console.error(`Portal server stopped unexpectedly (${signal || code || 'unknown'}).`);
    process.exit(code || 1);
  }
});

function applyPublicHeaders(response) {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.setHeader('X-Frame-Options', 'DENY');
  response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
}

function sendRedirect(response, location) {
  applyPublicHeaders(response);
  response.writeHead(302, {
    Location: location,
    'Cache-Control': 'no-store',
    'Content-Type': 'text/plain; charset=utf-8',
  });
  response.end(`Continue to ${location}`);
}

function proxyToPortal(request, response, upstreamPath = request.url) {
  const upstream = proxyRequest({
    hostname: '127.0.0.1',
    port: portalPort,
    method: request.method,
    path: upstreamPath,
    headers: {
      ...request.headers,
      'x-forwarded-host': request.headers.host || '',
      'x-forwarded-proto': request.headers['x-forwarded-proto'] || 'https',
    },
  }, (upstreamResponse) => {
    response.writeHead(upstreamResponse.statusCode || 502, upstreamResponse.headers);
    upstreamResponse.pipe(response);
  });

  upstream.on('error', (error) => {
    console.error('Portal proxy error:', error.message);
    if (!response.headersSent) {
      applyPublicHeaders(response);
      response.writeHead(503, {
        'Cache-Control': 'no-store',
        'Content-Type': 'text/plain; charset=utf-8',
      });
    }
    response.end('The SuperCampus portal is starting. Please try again shortly.');
  });

  request.pipe(upstream);
}

function landingFile(pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }

  const relativePath = decoded === '/' ? 'index.html' : decoded.replace(/^\/+/, '');
  const candidate = resolve(landingRoot, normalize(relativePath));
  const pathFromRoot = relative(landingRoot, candidate);
  if (pathFromRoot.startsWith('..') || isAbsolute(pathFromRoot)) return null;
  if (!existsSync(candidate) || !statSync(candidate).isFile()) return null;
  return candidate;
}

const server = createServer((request, response) => {
  const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);

  // `/mec` is a stable tenant shortcut. Tenant selection remains server-side;
  // the query value only provides clear Madras Engineering College branding.
  if (url.pathname === '/mec' || url.pathname === '/mec/') {
    sendRedirect(response, '/login?campus=mec');
    return;
  }

  if (url.pathname === '/login' || url.pathname.startsWith('/login/')) {
    proxyToPortal(request, response);
    return;
  }

  if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
    proxyToPortal(request, response, `/login${url.pathname}${url.search}`);
    return;
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    applyPublicHeaders(response);
    response.writeHead(405, { Allow: 'GET, HEAD', 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Method not allowed');
    return;
  }

  const filePath = landingFile(url.pathname);
  if (!filePath) {
    applyPublicHeaders(response);
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Page not found');
    return;
  }

  applyPublicHeaders(response);
  const extension = extname(filePath).toLowerCase();
  const isVersionedAsset = url.pathname.startsWith('/assets/');
  response.writeHead(200, {
    'Content-Type': contentTypes.get(extension) || 'application/octet-stream',
    'Cache-Control': isVersionedAsset ? 'public, max-age=31536000, immutable' : 'no-cache',
  });
  if (request.method === 'HEAD') response.end();
  else createReadStream(filePath).pipe(response);
});

server.listen(publicPort, '0.0.0.0', () => {
  console.log(`SuperCampus gateway listening on ${publicPort}; portal on ${portalPort}.`);
});

function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  portal.kill(signal);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
