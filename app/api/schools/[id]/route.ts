import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/utils/prismaClient';

// GET a single school by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('Fetching school with ID:', id);

    const school = await prisma.school.findUnique({
      where: { id },
      include: {
        classes: true,
        students: true,
      },
    });

    if (!school) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(school);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch school' },
      { status: 500 }
    );
  }
}

// PUT update a school by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      name,
      caption,
      address,
      phone,
      logoUrl,
      signatureUrl,
    } = body;

    const school = await prisma.school.findUnique({
      where: { id },
    });

    if (!school) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      );
    }

    const updatedSchool = await prisma.school.update({
      where: { id },
      data: {
        name: name || school.name,
        caption: caption || school.caption,
        address: address || school.address,
        phone: phone || school.phone,
        logoUrl: logoUrl !== undefined ? logoUrl : school.logoUrl,
        signatureUrl: signatureUrl !== undefined ? signatureUrl : school.signatureUrl,
      },
      include: {
        classes: true,
        students: true,
      },
    });

    return NextResponse.json(updatedSchool);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update school' },
      { status: 500 }
    );
  }
}

// DELETE a school by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const school = await prisma.school.findUnique({
      where: { id },
    });

    if (!school) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      );
    }

    await prisma.school.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: 'School deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete school' },
      { status: 500 }
    );
  }
}
