import { NextRequest, NextResponse } from 'next/server';
import { verifyTokenWithVersion } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const payload = await verifyTokenWithVersion(token);

  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  return NextResponse.json({
    userId: payload.userId,
    username: payload.username,
    role: payload.role,
    schoolId: payload.schoolId,
  });
}