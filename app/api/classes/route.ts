import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/utils/prismaClient';

// GET all classes
export async function GET(request: NextRequest) {
  try {
    const classes = await prisma.class.findMany({
      include: {
        school: true,
        students: true,
      },
    });
    return NextResponse.json(classes);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch classes' },
      { status: 500 }
    );
  }
}

// POST create a new class
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, schoolId } = body;

    if (!name || !schoolId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const schoolExists = await prisma.school.findUnique({
      where: { id: schoolId },
    });

    if (!schoolExists) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      );
    }

    const newClass = await prisma.class.create({
      data: {
        name,
        schoolId,
      },
      include: {
        school: true,
        students: true,
      },
    });

    return NextResponse.json(newClass, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create class' },
      { status: 500 }
    );
  }
}
