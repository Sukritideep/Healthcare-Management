import { NextResponse } from 'next/server';

function allowedOrigin(origin, requestUrl) {
  if (!origin) return false;
  try {
    const normalized = new URL(origin).origin;
    return normalized === new URL(requestUrl).origin
      || (process.env.FRONTEND_ORIGIN
        && normalized === new URL(process.env.FRONTEND_ORIGIN).origin);
  } catch {
    return false;
  }
}

export function proxy(request) {
  const origin = request.headers.get('origin');
  const isAllowed = allowedOrigin(origin, request.url);

  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 });
    if (isAllowed) {
      response.headers.set('Access-Control-Allow-Origin', new URL(origin).origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
      response.headers.set('Vary', 'Origin');
    }
    return response;
  }

  const response = NextResponse.next();
  if (isAllowed) {
    response.headers.set('Access-Control-Allow-Origin', new URL(origin).origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Vary', 'Origin');
  }
  return response;
}

export const config = { matcher: '/api/:path*' };
