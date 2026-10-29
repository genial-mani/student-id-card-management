import { NextRequest, NextResponse } from 'next/server';
import { createPresignedUploadUrl, isR2Configured } from '@/utils/r2Backend';

const MIME_MAP: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
  'image/bmp': '.bmp',
};

const SAFE_FOLDER_PATTERN = /^[a-zA-Z0-9_\-\/]{1,100}$/;
const SAFE_PUBLIC_ID_PATTERN = /^[a-zA-Z0-9_\-]{1,100}$/;

function getAuth(request: NextRequest) {
  return {
    role: request.headers.get('x-user-role') || '',
    schoolId: request.headers.get('x-user-school-id') || '',
  };
}

/**
 * POST /api/upload/presign
 *
 * Generates a presigned Cloudflare R2 upload URL so the browser can upload
 * files directly to R2 without streaming the bytes through Vercel.
 *
 * Request Body (JSON):
 *   - folder: optional folder/prefix (e.g. "Delhi")
 *   - publicId: optional ID/filename without extension (e.g. camSno)
 *   - contentType: required MIME type (e.g. "image/jpeg")
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

    // Role and school scoping: user must be authenticated, non-admins must be scoped to a school
    const { role, schoolId } = getAuth(request);
    if (!role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (role !== 'admin' && !schoolId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { folder, publicId, contentType } = body;

    // Validate contentType against allowed mimeMap
    if (!contentType || typeof contentType !== 'string' || !MIME_MAP[contentType]) {
      return NextResponse.json(
        {
          error: `Invalid or unsupported contentType. Supported types: ${Object.keys(MIME_MAP).join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validate folder format
    if (folder !== undefined && folder !== null) {
      if (
        typeof folder !== 'string' ||
        !SAFE_FOLDER_PATTERN.test(folder) ||
        folder.includes('..') ||
        folder.startsWith('/') ||
        folder.endsWith('/')
      ) {
        return NextResponse.json(
          { error: 'Invalid folder parameter format' },
          { status: 400 }
        );
      }
    }

    // Validate publicId format
    if (publicId !== undefined && publicId !== null) {
      if (typeof publicId !== 'string' || !SAFE_PUBLIC_ID_PATTERN.test(publicId)) {
        return NextResponse.json(
          { error: 'Invalid publicId parameter format' },
          { status: 400 }
        );
      }
    }

    const ext = getExtension(contentType);

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

/**
 * Derives file extension strictly from MIME type.
 */
function getExtension(mimeType: string): string {
  return MIME_MAP[mimeType] || '.jpg';
}

