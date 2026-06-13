import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import prisma from '@/utils/prismaClient';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (token) {
      const payload = await verifyToken(token);
      if (payload) {
        let schoolName = undefined;
        if (payload.schoolId) {
          const school = await prisma.school.findUnique({
            where: { id: payload.schoolId },
            select: { name: true }
          });
          schoolName = school?.name;
        }

        await prisma.auditLog.create({
          data: {
            userId: payload.userId,
            username: payload.username,
            role: payload.role,
            action: 'LOGOUT',
            schoolId: payload.schoolId || undefined,
            schoolName: schoolName || undefined,
          },
        });
      }
    }
  } catch (error) {
    console.error('Failed to log logout event:', error);
  }

  const response = NextResponse.json({ success: true });
  response.cookies.delete('auth_token');
  return response;
}