import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/utils/prismaClient';
import { generateCredentials, hashPassword } from '@/lib/auth';

function getRole(request: NextRequest): string {
  return request.headers.get('x-user-role') || '';
}

// GET all schools
export async function GET(request: NextRequest) {
  try {
    const role = getRole(request);
    const schoolId = request.headers.get('x-user-school-id') || '';

    // Users can only see their own school
    const where = role === 'admin' ? {} : { id: schoolId };

    // Fetch schools with database-level counts instead of loading all 6,000+ student documents
    const schools = await prisma.school.findMany({
      where,
      select: {
        id: true,
        name: true,
        caption: true,
        address: true,
        phone: true,
        logoUrl: true,
        signatureUrl: true,
        idCardLayout: true,
        idCardTheme: true,
        idCardLayoutConfig: true,
        customFieldsConfig: true,
        customValues: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            students: true,
            classes: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Format output providing lightweight counts and backwards-compatible array lengths
    const formatted = schools.map((s) => ({
      ...s,
      studentCount: s._count.students,
      classCount: s._count.classes,
      // Array length compatibility for UI consumers (e.g. school.students.length, school.classes.length)
      students: { length: s._count.students },
      classes: { length: s._count.classes },
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Failed to fetch schools:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schools' },
      { status: 500 }
    );
  }
}

// POST create a new school — admin only
export async function POST(request: NextRequest) {
  try {
    const role = getRole(request);

    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, caption, address, phone, logoUrl, signatureUrl, idCardLayout, idCardTheme, customFieldsConfig, idCardLayoutConfig, customValues } = body;

    if (!name || !caption || !address || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create school
    const school = await prisma.school.create({
      data: {
        name,
        caption,
        address,
        phone,
        logoUrl: logoUrl || '',
        signatureUrl: signatureUrl || '',
        idCardLayout: idCardLayout !== undefined ? parseInt(String(idCardLayout), 10) : 1,
        idCardTheme: idCardTheme || null,
        customFieldsConfig: customFieldsConfig || null,
        idCardLayoutConfig: idCardLayoutConfig || null,
        customValues: customValues || null,
      },
    });

    // Auto-generate admin user credentials for this school
    const adminCreds = generateCredentials(name + ' Admin');
    const hashedAdminPassword = await hashPassword(adminCreds.password);

    await prisma.user.create({
      data: {
        username: adminCreds.username,
        password: hashedAdminPassword,
        role: 'school_admin',
        schoolId: school.id,
      },
    });

    // Auto-generate staff user credentials for this school
    const staffCreds = generateCredentials(name + ' Staff');
    const hashedStaffPassword = await hashPassword(staffCreds.password);

    await prisma.user.create({
      data: {
        username: staffCreds.username,
        password: hashedStaffPassword,
        role: 'user',
        schoolId: school.id,
      },
    });

    // Return school + plaintext credentials (shown once)
    return NextResponse.json(
      {
        school,
        credentials: [
          { role: 'school_admin', username: adminCreds.username, password: adminCreds.password },
          { role: 'user', username: staffCreds.username, password: staffCreds.password }
        ],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to create school' },
      { status: 500 }
    );
  }
}