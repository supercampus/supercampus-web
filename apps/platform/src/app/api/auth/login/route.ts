import { NextResponse } from 'next/server';
import { DEMO_SESSION_COOKIE, findDemoUserByCredentials, toAuthStudent } from '@/lib/demo-auth';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { email?: string; password?: string } | null;
  const user = findDemoUserByCredentials(body?.email ?? '', body?.password ?? '');

  if (!user) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  const response = NextResponse.json({ data: { student: toAuthStudent(user) } });
  response.cookies.set(DEMO_SESSION_COOKIE, user.id, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  });

  return response;
}
