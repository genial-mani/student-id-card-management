import { NextRequest, NextResponse } from 'next/server';
import { uploadToR2, isR2Configured } from '@/utils/r2Backend';

/**
 * POST /api/upload
 * 
 * Receives a file via FormData and uploads it to Cloudflare R2.
 * Fields:
 *   - file: The image file (required)
 *   - folder: The folder/prefix name, e.g. "Delhi" (optional)
 *   - publicId: The file name without extension, e.g. "a3f8b2c1d4e5" (optional)
 * 
 * Returns: { url: "https://R2_PUBLIC_URL/folder/publicId.ext" }
 */
export async function POST(request: NextRequest) {
  try {
    if (!isR2Configured()) {
      return NextResponse.json(
        { error: 'R2 storage is not configured. Please set R2 environment variables.' },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = formData.get('folder') as string | null;
    const publicId = formData.get('publicId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Read the file into a buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Determine file extension from the MIME type or original filename
    const ext = getExtension(file.type, file.name);

    // Build the R2 object key: folder/publicId.ext or folder/uuid.ext
    let key: string;
    if (folder && publicId) {
      key = `${folder}/${publicId}${ext}`;
    } else if (folder) {
      key = `${folder}/${crypto.randomUUID()}${ext}`;
    } else if (publicId) {
      key = `${publicId}${ext}`;
    } else {
      key = `${crypto.randomUUID()}${ext}`;
    }

    const url = await uploadToR2(buffer, key, file.type);

    return NextResponse.json({ url });
  } catch (error: any) {
    console.error('Upload to R2 failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload file' },
      { status: 500 }
    );
  }
}

/**
 * Derive file extension from MIME type, falling back to the original filename.
 */
function getExtension(mimeType: string, fileName: string): string {
  const mimeMap: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'image/svg+xml': '.svg',
    'image/bmp': '.bmp',
  };

  if (mimeMap[mimeType]) {
    return mimeMap[mimeType];
  }

  // Fallback: extract from filename
  const dotIndex = fileName.lastIndexOf('.');
  if (dotIndex !== -1) {
    return fileName.substring(dotIndex);
  }

  return '.jpg'; // Default to jpg
}
