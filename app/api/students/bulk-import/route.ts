import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/utils/prismaClient';

function getAuth(request: NextRequest) {
  return {
    role: request.headers.get('x-user-role') || '',
    schoolId: request.headers.get('x-user-school-id') || '',
  };
}

export async function POST(request: NextRequest) {
  try {
    const { role, schoolId: userSchoolId } = getAuth(request);
    
    // Authorization: Admin, school_admin, and user are allowed as long as they have a schoolId (unless admin).
    // The previous students API allows any role if they match the schoolId.
    if (!role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { students } = body;

    if (!Array.isArray(students) || students.length === 0) {
      return NextResponse.json({ error: 'No student data provided' }, { status: 400 });
    }

    // Verify all students belong to a valid school and class, and check permissions
    const schoolIds = new Set(students.map(s => s.schoolId));
    
    if (role !== 'admin') {
      // Non-admins can only import into their own school
      if (schoolIds.size > 1 || !schoolIds.has(userSchoolId)) {
        return NextResponse.json(
          { error: 'Forbidden — you can only import students into your own school' },
          { status: 403 }
        );
      }
    }

    // Auto-generate camSno if not present. Use crypto to match frontend pattern.
    // Resolve class names to classIds if classId is missing but className is provided
    const schoolClasses = await prisma.class.findMany({
      where: { schoolId: { in: Array.from(schoolIds) } },
      select: { id: true, name: true, schoolId: true }
    });

    const dataToInsert = students.map((student, index) => {
      const generatedCamSno = crypto.randomUUID().replace(/-/g, '').substring(0, 12);
      
      let resolvedClassId = student.classId;
      if (!resolvedClassId && student.className) {
        const foundClass = schoolClasses.find(c => 
          c.schoolId === student.schoolId && 
          c.name.toLowerCase() === student.className.toString().trim().toLowerCase()
        );
        if (foundClass) resolvedClassId = foundClass.id;
      }

      if (!resolvedClassId) {
        throw new Error(`Could not find a valid class for student ${student.name}. Please ensure the class name matches exactly.`);
      }

      return {
        schoolId: student.schoolId,
        name: student.name,
        camSno: student.camSno || generatedCamSno,
        fatherName: student.fatherName || '',
        fatherPhone: student.fatherPhone || '',
        address: student.address || '',
        classId: resolvedClassId,
        profilePictureUrl: '', // Profile pictures will be added later
        customValues: student.customValues || null,
      };
    });

    const result = await prisma.student.createMany({
      data: dataToInsert,
    });

    return NextResponse.json({ 
      message: `Successfully imported ${result.count} students`,
      count: result.count
    });
  } catch (error) {
    console.error('Failed to bulk import students:', error);
    return NextResponse.json(
      { error: 'Failed to bulk import students' },
      { status: 500 }
    );
  }
}
