import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/utils/prismaClient';

function getAuth(request: NextRequest) {
  return {
    role: request.headers.get('x-user-role') || '',
  };
}

// GET a specific document template
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

    const document = await prisma.documentTemplate.findUnique({
      where: { id }
    });

    if (!document) {
      return NextResponse.json({ error: 'Document template not found' }, { status: 404 });
    }

    return NextResponse.json(document);
  } catch (error) {
    console.error('Error fetching document template:', error);
    return NextResponse.json({ error: 'Failed to fetch document template' }, { status: 500 });
  }
}

// PUT to update a specific document template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { role } = getAuth(request);

    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.width !== undefined) updateData.width = body.width;
    if (body.height !== undefined) updateData.height = body.height;
    if (body.backgroundUrl !== undefined) updateData.backgroundUrl = body.backgroundUrl;
    if (body.fieldsConfig !== undefined) updateData.fieldsConfig = body.fieldsConfig;
    if (body.layoutConfig !== undefined) updateData.layoutConfig = body.layoutConfig;

    const updatedDocument = await prisma.documentTemplate.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(updatedDocument);
  } catch (error) {
    console.error('Error updating document template:', error);
    return NextResponse.json({ error: 'Failed to update document template' }, { status: 500 });
  }
}

// DELETE a specific document template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { role } = getAuth(request);

    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.documentTemplate.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Document template deleted successfully' });
  } catch (error) {
    console.error('Error deleting document template:', error);
    return NextResponse.json({ error: 'Failed to delete document template' }, { status: 500 });
  }
}
