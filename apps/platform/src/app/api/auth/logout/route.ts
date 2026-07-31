import { NextResponse } from 'next/server';
import { DEMO_SESSION_COOKIE } from '@/lib/demo-auth';

export async function POST() {
  const response = new NextResponse(null, { status: 204 });
  response.cookies.delete(DEMO_SESSION_COOKIE);
  return response;
}
