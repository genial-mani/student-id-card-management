import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/utils/prismaClient';
import { deleteImageFromCloudinary } from '@/utils/cloudinaryBackend';

function getAuth(request: NextRequest) {
  return {
    role: request.headers.get('x-user-role') || '',
    schoolId: request.headers.get('x-user-school-id') || '',
  };
}

// GET a single student by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { role, schoolId } = getAuth(request);

    const student = await prisma.student.findUnique({
      where: { id },
      include: { school: true, class: true },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Users can only view students from their own school
    if (role !== 'admin' && student.schoolId !== schoolId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(student);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch student' },
      { status: 500 }
    );
  }
}

// PUT update a student — admin only
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { role } = getAuth(request);

    if (role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden — only admins can edit students' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const student = await prisma.student.findUnique({ where: { id } });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

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

    const oldPhotoUrl = student.profilePictureUrl;
    if (profilePictureUrl !== undefined && oldPhotoUrl && profilePictureUrl !== oldPhotoUrl) {
      deleteImageFromCloudinary(oldPhotoUrl).catch((err) => {
        console.error("Failed to delete old photo during update:", err);
      });
    }

    const updatedStudent = await prisma.student.update({
      where: { id },
      data: {
        schoolId: schoolId || student.schoolId,
        name: name || student.name,
        idNo: idNo || student.idNo,
        camSno: camSno !== undefined ? camSno : student.camSno,
        fatherName: fatherName || student.fatherName,
        motherName: motherName || student.motherName,
        fatherPhone: fatherPhone !== undefined ? fatherPhone : student.fatherPhone,
        motherPhone: motherPhone !== undefined ? motherPhone : student.motherPhone,
        address: address !== undefined ? address : student.address,
        classId: classId || student.classId,
        profilePictureUrl:
          profilePictureUrl !== undefined
            ? profilePictureUrl
            : student.profilePictureUrl,
      },
      include: { school: true, class: true },
    });

    return NextResponse.json(updatedStudent);
  } catch {
    return NextResponse.json(
      { error: 'Failed to update student' },
      { status: 500 }
    );
  }
}

// DELETE a student — admin only
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { role } = getAuth(request);

    if (role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden — only admins can delete students' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const student = await prisma.student.findUnique({ where: { id } });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    if (student.profilePictureUrl) {
      deleteImageFromCloudinary(student.profilePictureUrl).catch((err) => {
        console.error("Failed to delete student photo during deletion:", err);
      });
    }

    await prisma.student.delete({ where: { id } });
    return NextResponse.json({ message: 'Student deleted successfully' });
  } catch {
    return NextResponse.json(
      { error: 'Failed to delete student' },
      { status: 500 }
    );
  }
}