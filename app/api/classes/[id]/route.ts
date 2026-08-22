import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/utils/prismaClient';
import { bulkDeleteImages } from '@/utils/cloudinaryBackend';

function getAuth(request: NextRequest) {
  return {
    role: request.headers.get('x-user-role') || '',
    schoolId: request.headers.get('x-user-school-id') || '',
  };
}

// GET a single class by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { role, schoolId } = getAuth(request);

    const classData = await prisma.class.findUnique({
      where: { id },
      include: { school: true, students: true },
    });

    if (!classData) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    // Users can only view classes from their school
    if (role !== 'admin' && classData.schoolId !== schoolId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(classData);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch class' }, { status: 500 });
  }
}

// PUT update a class — admin only
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { role } = getAuth(request);
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, schoolId, customValues } = body;

    const classData = await prisma.class.findUnique({ where: { id } });
    if (!classData) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    if (schoolId) {
      const schoolExists = await prisma.school.findUnique({ where: { id: schoolId } });
      if (!schoolExists) {
        return NextResponse.json({ error: 'School not found' }, { status: 404 });
      }
    }

    const updatedClass = await prisma.class.update({
      where: { id },
      data: {
        name: name || classData.name,
        schoolId: schoolId || classData.schoolId,
        customValues: customValues !== undefined ? customValues : classData.customValues,
      },
      include: { school: true, students: true },
    });

    return NextResponse.json(updatedClass);
  } catch {
    return NextResponse.json({ error: 'Failed to update class' }, { status: 500 });
  }
}

// DELETE a class — admin, school admin, staff
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { role, schoolId } = getAuth(request);
    
    const { id } = await params;
    const classData = await prisma.class.findUnique({ where: { id } });
    if (!classData) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    if (role !== 'admin') {
      if ((role !== 'school_admin' && role !== 'user') || classData.schoolId !== schoolId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Fetch all students in the class to delete their photos in bulk
    const students = await prisma.student.findMany({ where: { classId: id }, select: { profilePictureUrl: true } });
    const photoUrls = students.map(s => s.profilePictureUrl).filter(Boolean);
    if (photoUrls.length > 0) {
      await bulkDeleteImages(photoUrls);
    }

    await prisma.student.deleteMany({ where: { classId: id } });
    await prisma.class.delete({ where: { id } });
    return NextResponse.json({ message: 'Class deleted successfully' });
  } catch {
    return NextResponse.json({ error: 'Failed to delete class' }, { status: 500 });
  }
}