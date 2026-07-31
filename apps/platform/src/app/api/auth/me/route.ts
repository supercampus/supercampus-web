import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { DEMO_SESSION_COOKIE, findDemoUserById, toAuthStudent } from '@/lib/demo-auth';

export async function GET() {
  const cookieStore = await cookies();
  const user = findDemoUserById(cookieStore.get(DEMO_SESSION_COOKIE)?.value);

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  return NextResponse.json({ data: { student: toAuthStudent(user) } });
}
