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

    const schools = await prisma.school.findMany({
      where,
      include: {
        classes: true,
        students: true,
      },
    });
    return NextResponse.json(schools);
  } catch (error) {
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

    // Auto-generate user credentials for this school
    const { username, password } = generateCredentials(name);
    const hashedPassword = await hashPassword(password);

    await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: 'user',
        schoolId: school.id,
      },
    });

    // Return school + plaintext credentials (shown once)
    return NextResponse.json(
      {
        school,
        credentials: { username, password },
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