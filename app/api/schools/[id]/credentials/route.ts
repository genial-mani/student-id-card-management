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
 * Returns the username for a school's user accounts.
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

  const users = await prisma.user.findMany({
    where: { schoolId, role: { in: ['school_admin', 'user'] } },
    select: { id: true, username: true, role: true, createdAt: true },
  });

  if (users.length === 0) {
    return NextResponse.json({ error: 'No users found for this school' }, { status: 404 });
  }

  return NextResponse.json({
    users,
    note: 'Password is hashed and cannot be recovered. Use POST to reset it.',
  });
}

/**
 * POST /api/schools/[id]/credentials/reset  — but we mount on the same route
 * POST /api/schools/[id]/credentials
 * Generates new random passwords for the school's users, returns plaintext once.
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

  let body = {};
  try {
    body = await request.json();
  } catch {}
  const targetRole = (body as any).role; // optional: 'school_admin' or 'user'

  const school = await prisma.school.findUnique({ where: { id: schoolId } });
  if (!school) {
    return NextResponse.json({ error: 'School not found' }, { status: 404 });
  }

  const existingUsers = await prisma.user.findMany({
    where: { schoolId, role: { in: ['school_admin', 'user'] } },
  });

  const adminUser = existingUsers.find(u => u.role === 'school_admin');
  const staffUser = existingUsers.find(u => u.role === 'user');

  const result: any[] = [];

  if (!targetRole || targetRole === 'school_admin') {
    const adminCreds = generateCredentials(school.name + ' Admin');
    const hashedAdminPassword = await hashPassword(adminCreds.password);

    if (adminUser) {
      await prisma.user.update({
        where: { id: adminUser.id },
        data: { password: hashedAdminPassword, tokenVersion: { increment: 1 } },
      });
      result.push({ role: 'school_admin', username: adminUser.username, password: adminCreds.password });
    } else {
      await prisma.user.create({
        data: { username: adminCreds.username, password: hashedAdminPassword, role: 'school_admin', schoolId },
      });
      result.push({ role: 'school_admin', username: adminCreds.username, password: adminCreds.password });
    }
  }

  if (!targetRole || targetRole === 'user') {
    const staffCreds = generateCredentials(school.name + ' Staff');
    const hashedStaffPassword = await hashPassword(staffCreds.password);

    if (staffUser) {
      await prisma.user.update({
        where: { id: staffUser.id },
        data: { password: hashedStaffPassword, tokenVersion: { increment: 1 } },
      });
      result.push({ role: 'user', username: staffUser.username, password: staffCreds.password });
    } else {
      await prisma.user.create({
        data: { username: staffCreds.username, password: hashedStaffPassword, role: 'user', schoolId },
      });
      result.push({ role: 'user', username: staffCreds.username, password: staffCreds.password });
    }
  }

  return NextResponse.json({ credentials: result });
}