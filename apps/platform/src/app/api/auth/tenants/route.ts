import { NextResponse } from 'next/server';
import { DEMO_TENANT } from '@/lib/demo-auth';

export async function GET() {
  return NextResponse.json({ data: [DEMO_TENANT] });
}
