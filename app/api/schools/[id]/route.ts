import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/utils/prismaClient';

function getAuth(request: NextRequest) {
  return {
    role: request.headers.get('x-user-role') || '',
    schoolId: request.headers.get('x-user-school-id') || '',
  };
}

// GET a single school by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { role, schoolId } = getAuth(request);

    // Non-admin users can only fetch their own school
    if (role !== 'admin' && schoolId !== id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const school = await prisma.school.findUnique({
      where: { id },
      include: { classes: { include: { students: true } }, students: true },
    });

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    return NextResponse.json(school);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch school' }, { status: 500 });
  }
}

// PUT update a school — admin or school staff
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { role, schoolId } = getAuth(request);
    const { id } = await params;

    if (role !== 'admin' && schoolId !== id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, caption, address, phone, logoUrl, signatureUrl, idCardLayout, idCardTheme } = body;

    const school = await prisma.school.findUnique({ where: { id } });
    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    const updated = await prisma.school.update({
      where: { id },
      data: {
        name: name || school.name,
        caption: caption || school.caption,
        address: address || school.address,
        phone: phone || school.phone,
        logoUrl: logoUrl !== undefined ? logoUrl : school.logoUrl,
        signatureUrl: signatureUrl !== undefined ? signatureUrl : school.signatureUrl,
        idCardLayout: idCardLayout !== undefined ? parseInt(String(idCardLayout), 10) : school.idCardLayout,
        idCardTheme: idCardTheme !== undefined ? idCardTheme : school.idCardTheme,
      },
      include: { classes: true, students: true },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Failed to update school' }, { status: 500 });
  }
}

// DELETE a school — admin only
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { role } = getAuth(request);
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const school = await prisma.school.findUnique({ where: { id } });
    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    await prisma.school.delete({ where: { id } });
    return NextResponse.json({ message: 'School deleted successfully' });
  } catch {
    return NextResponse.json({ error: 'Failed to delete school' }, { status: 500 });
  }
}