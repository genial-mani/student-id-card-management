import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/utils/prismaClient';
import { generateCredentials, hashPassword } from '@/lib/auth';

function getAuth(req: NextRequest) {
  return {
    role:     req.headers.get('x-user-role') || '',
    schoolId: req.headers.get('x-user-school-id') || '',
  };
}

/**
 * GET /api/schools/[id]/credentials
 * Returns the username for a school's user account.
 * Admin only — used so admin can view / share credentials with school staff.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { role } = getAuth(request);
  if (role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id: schoolId } = await params;

  const user = await prisma.user.findFirst({
    where: { schoolId, role: 'user' },
    select: { id: true, username: true, createdAt: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'No user found for this school' }, { status: 404 });
  }

  return NextResponse.json({
    userId:    user.id,
    username:  user.username,
    createdAt: user.createdAt,
    note:      'Password is hashed and cannot be recovered. Use POST to reset it.',
  });
}

/**
 * POST /api/schools/[id]/credentials/reset  — but we mount on the same route
 * POST /api/schools/[id]/credentials
 * Generates a new random password for the school's user, returns plaintext once.
 * Admin only.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { role } = getAuth(request);
  if (role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id: schoolId } = await params;

  // Find the school to get its name for a fresh slug if needed
  const school = await prisma.school.findUnique({ where: { id: schoolId } });
  if (!school) {
    return NextResponse.json({ error: 'School not found' }, { status: 404 });
  }

  const existingUser = await prisma.user.findFirst({
    where: { schoolId, role: 'user' },
  });

  // Generate a new password (keep same username)
  const { password: newPassword } = generateCredentials(school.name);
  const hashed = await hashPassword(newPassword);

  if (existingUser) {
    // Reset password on existing user AND increment tokenVersion
    await prisma.user.update({
      where: { id: existingUser.id },
      data:  {
        password: hashed,
        tokenVersion: {
          increment: 1
        }
      },
    });


    return NextResponse.json({
      username: existingUser.username,
      password: newPassword, // returned plaintext ONCE
      reset:    true,
    });
  } else {
    // No user yet (edge case) — create one
    const { username } = generateCredentials(school.name);
    await prisma.user.create({
      data: { username, password: hashed, role: 'user', schoolId },
    });

    return NextResponse.json({
      username,
      password: newPassword,
      reset: false,
    });
  }
}