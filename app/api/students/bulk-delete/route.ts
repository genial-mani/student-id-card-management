import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/utils/prismaClient';
import { bulkDeleteImagesFromCloudinary } from '@/utils/cloudinaryBackend';

function getAuth(request: NextRequest) {
  return {
    role: request.headers.get('x-user-role') || '',
    schoolId: request.headers.get('x-user-school-id') || '',
  };
}

export async function POST(request: NextRequest) {
  try {
    const { role, schoolId } = getAuth(request);
    
    const body = await request.json();
    const { studentIds } = body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json({ error: 'No student IDs provided' }, { status: 400 });
    }

    // Fetch the students to ensure permissions and to get their photo URLs
    const students = await prisma.student.findMany({
      where: { id: { in: studentIds } },
      select: { id: true, schoolId: true, profilePictureUrl: true }
    });

    if (students.length === 0) {
      return NextResponse.json({ error: 'Students not found' }, { status: 404 });
    }

    // Authorization check: Admin can delete any, school_admin/user can only delete their own school's students
    if (role !== 'admin') {
      const unauthorized = students.some(s => s.schoolId !== schoolId);
      if (unauthorized) {
        return NextResponse.json(
          { error: 'Forbidden — you can only delete students in your own school' },
          { status: 403 }
        );
      }
    }

    // Extract photo URLs and bulk delete from Cloudinary
    const photoUrls = students.map(s => s.profilePictureUrl).filter(Boolean);
    if (photoUrls.length > 0) {
      await bulkDeleteImagesFromCloudinary(photoUrls);
    }

    // Delete the students from database
    await prisma.student.deleteMany({
      where: { id: { in: studentIds } }
    });

    return NextResponse.json({ message: `Successfully deleted ${studentIds.length} students` });
  } catch (error) {
    console.error('Failed to bulk delete students:', error);
    return NextResponse.json(
      { error: 'Failed to bulk delete students' },
      { status: 500 }
    );
  }
}
