import { NextRequest, NextResponse } from 'next/server';
import { createPresignedUploadUrl, isR2Configured } from '@/utils/r2Backend';

/**
 * POST /api/upload/presign
 *
 * Generates a presigned Cloudflare R2 upload URL so the browser can upload
 * files directly to R2 without streaming the bytes through Vercel.
 *
 * Request Body (JSON):
 *   - folder: optional folder/prefix (e.g. "Delhi")
 *   - publicId: optional ID/filename without extension (e.g. camSno)
 *   - filename: optional original filename (used for extension detection)
 *   - contentType: optional MIME type (e.g. "image/jpeg")
 *
 * Returns: { uploadUrl: string, publicUrl: string, key: string }
 */
export async function POST(request: NextRequest) {
  try {
    if (!isR2Configured()) {
      return NextResponse.json(
        { error: 'R2 storage is not configured. Please set R2 environment variables.' },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { folder, publicId, filename, contentType = 'image/jpeg' } = body;

    const ext = getExtension(contentType, filename || '');

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

    const { uploadUrl, publicUrl } = await createPresignedUploadUrl(key, contentType, 300);

    return NextResponse.json({ uploadUrl, publicUrl, key });
  } catch (error: any) {
    console.error('Failed to create presigned upload URL:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}

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

  const dotIndex = fileName.lastIndexOf('.');
  if (dotIndex !== -1) {
    return fileName.substring(dotIndex);
  }

  return '.jpg';
}

