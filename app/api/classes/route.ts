import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/utils/prismaClient';

function getAuth(request: NextRequest) {
  return {
    role: request.headers.get('x-user-role') || '',
    schoolId: request.headers.get('x-user-school-id') || '',
  };
}

// GET all classes — filtered by school for non-admin users
export async function GET(request: NextRequest) {
  try {
    const { role, schoolId } = getAuth(request);

    const where = role === 'admin' ? {} : { schoolId };

    const classes = await prisma.class.findMany({
      where,
      include: { school: true, students: true },
    });
    return NextResponse.json(classes);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 });
  }
}

// POST create a new class
export async function POST(request: NextRequest) {
  try {
    const { role, schoolId: userSchoolId } = getAuth(request);
    const body = await request.json();
    const { name, schoolId, customValues } = body;

    if (!name || !schoolId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Users can only create classes in their own school
    if (role !== 'admin' && userSchoolId !== schoolId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const schoolExists = await prisma.school.findUnique({ where: { id: schoolId } });
    if (!schoolExists) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    const newClass = await prisma.class.create({
      data: { name, schoolId, customValues: customValues || null },
      include: { school: true, students: true },
    });

    return NextResponse.json(newClass, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create class' }, { status: 500 });
  }
}