import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/utils/prismaClient';

// GET all schools
export async function GET(request: NextRequest) {
  try {
    const schools = await prisma.school.findMany({
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

// POST create a new school
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      caption,
      address,
      phone,
      logoUrl,
      signatureUrl,
    } = body;

    if (!name || !caption || !address || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const school = await prisma.school.create({
      data: {
        name,
        caption,
        address,
        phone,
        logoUrl: logoUrl || '',
        signatureUrl: signatureUrl || '',
      },
    });

    return NextResponse.json(school, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create school' },
      { status: 500 }
    );
  }
}
