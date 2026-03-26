import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/utils/prismaClient';

// GET a single class by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const classData = await prisma.class.findUnique({
      where: { id },
      include: {
        school: true,
        students: true,
      },
    });

    if (!classData) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(classData);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch class' },
      { status: 500 }
    );
  }
}

// PUT update a class by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, schoolId } = body;

    const classData = await prisma.class.findUnique({
      where: { id },
    });

    if (!classData) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      );
    }

    if (schoolId) {
      const schoolExists = await prisma.school.findUnique({
        where: { id: schoolId },
      });

      if (!schoolExists) {
        return NextResponse.json(
          { error: 'School not found' },
          { status: 404 }
        );
      }
    }

    const updatedClass = await prisma.class.update({
      where: { id },
      data: {
        name: name || classData.name,
        schoolId: schoolId || classData.schoolId,
      },
      include: {
        school: true,
        students: true,
      },
    });

    return NextResponse.json(updatedClass);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update class' },
      { status: 500 }
    );
  }
}

// DELETE a class by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const classData = await prisma.class.findUnique({
      where: { id },
    });

    if (!classData) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      );
    }

    await prisma.class.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: 'Class deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete class' },
      { status: 500 }
    );
  }
}
