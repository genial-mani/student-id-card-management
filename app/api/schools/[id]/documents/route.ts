import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/utils/prismaClient';

function getAuth(request: NextRequest) {
  return {
    role: request.headers.get('x-user-role') || '',
    schoolId: request.headers.get('x-user-school-id') || '',
  };
}

// GET all document templates for a school
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { role } = getAuth(request);

    // Only admin can access document studio
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const documents = await prisma.documentTemplate.findMany({
      where: { schoolId: id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error fetching document templates:', error);
    return NextResponse.json({ error: 'Failed to fetch document templates' }, { status: 500 });
  }
}

// POST a new document template for a school
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { role } = getAuth(request);

    // Only admin can access document studio
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, width, height, layoutConfig, fieldsConfig, backgroundUrl } = body;

    const newDocument = await prisma.documentTemplate.create({
      data: {
        schoolId: id,
        name: name || 'Untitled Document',
        width: typeof width === 'number' ? width : 210, // Default to A4 width in mm
        height: typeof height === 'number' ? height : 297, // Default to A4 height in mm
        backgroundUrl: backgroundUrl || null,
        fieldsConfig: fieldsConfig || null,
        layoutConfig: layoutConfig || {},
      }
    });

    return NextResponse.json(newDocument, { status: 201 });
  } catch (error) {
    console.error('Error creating document template:', error);
    return NextResponse.json({ error: 'Failed to create document template' }, { status: 500 });
  }
}
