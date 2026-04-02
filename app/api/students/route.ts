import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/utils/prismaClient';

function getAuth(request: NextRequest) {
  return {
    role: request.headers.get('x-user-role') || '',
    schoolId: request.headers.get('x-user-school-id') || '',
  };
}

// GET all students — scoped to school for non-admins
export async function GET(request: NextRequest) {
  try {
    const { role, schoolId } = getAuth(request);
    const where = role === 'admin' ? {} : { schoolId };

    const students = await prisma.student.findMany({
      where,
      include: { school: true, class: true },
    });
    return NextResponse.json(students);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
}

// POST create a new student — admin or school user
export async function POST(request: NextRequest) {
  try {
    const { role, schoolId: userSchoolId } = getAuth(request);
    const body = await request.json();
    const {
      schoolId,
      name,
      idNo,
      camSno,
      fatherName,
      motherName,
      fatherPhone,
      motherPhone,
      address,
      classId,
      profilePictureUrl,
    } = body;

    if (!schoolId || !name || !classId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Users can only create students in their own school
    if (role !== 'admin' && userSchoolId !== schoolId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const student = await prisma.student.create({
      data: {
        schoolId,
        name,
        idNo,
        camSno: camSno || '',
        fatherName: fatherName || '',
        motherName: motherName || '',
        fatherPhone: fatherPhone || '',
        motherPhone: motherPhone || '',
        address: address || '',
        classId,
        profilePictureUrl: profilePictureUrl || '',
      },
      include: { school: true, class: true },
    });

    return NextResponse.json(student, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create student' }, { status: 500 });
  }
}