import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/utils/prismaClient';

// GET all students
export async function GET(request: NextRequest) {
  try {
    const students = await prisma.student.findMany({
      include: {
        school: true,
        class: true,
      },
    });
    return NextResponse.json(students);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}

// POST create a new student
export async function POST(request: NextRequest) {
  try {
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

    if (
      !schoolId ||
      !name ||
      !classId
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const student = await prisma.student.create({
      data: {
        schoolId,
        name,
        idNo,
        camSno: camSno || '',
        fatherName,
        motherName,
        fatherPhone: fatherPhone || '',
        motherPhone: motherPhone || '',
        address: address || '',
        classId,
        profilePictureUrl: profilePictureUrl || '',
      },
      include: {
        school: true,
        class: true,
      },
    });

    return NextResponse.json(student, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create student' },
      { status: 500 }
    );
  }
}
