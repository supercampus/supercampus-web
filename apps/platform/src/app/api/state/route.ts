import { NextResponse } from 'next/server';
import { DEFAULT_PERSISTED_STATE } from '@/lib/demo-auth';

export async function GET() {
  return NextResponse.json({
    data: {
      state: DEFAULT_PERSISTED_STATE,
      version: 1,
      updatedAt: new Date().toISOString(),
    },
  });
}

export async function PUT() {
  return NextResponse.json({ data: { saved: true, updatedAt: new Date().toISOString() } });
}
