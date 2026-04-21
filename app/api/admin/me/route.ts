import { NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/admin-auth';

export async function GET(request: Request) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;
  return NextResponse.json({ ok: true });
}
