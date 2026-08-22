import { S3Client, PutObjectCommand, DeleteObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3';

// ─── R2 Configuration ────────────────────────────────────────────────────────

function getR2Client(): S3Client {
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'R2 is not configured. Please set R2_ENDPOINT, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY in your .env file.'
    );
  }

  return new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

function getBucketName(): string {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) {
    throw new Error('R2_BUCKET_NAME is not configured in .env');
  }
  return bucket;
}

function getPublicUrl(): string {
  const url = process.env.R2_PUBLIC_URL;
  if (!url) {
    throw new Error('R2_PUBLIC_URL is not configured in .env');
  }
  // Remove trailing slash if present
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

// ─── Check if R2 is configured ──────────────────────────────────────────────

export function isR2Configured(): boolean {
  return !!(
    process.env.R2_ENDPOINT &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME &&
    process.env.R2_PUBLIC_URL
  );
}

// ─── Upload ──────────────────────────────────────────────────────────────────

/**
 * Uploads a file buffer to Cloudflare R2.
 * @param buffer - The file content as a Buffer or Uint8Array
 * @param key - The object key (path), e.g. "Delhi/a3f8b2c1d4e5.jpg"
 * @param contentType - The MIME type, e.g. "image/jpeg"
 * @returns The public URL of the uploaded file
 */
export async function uploadToR2(
  buffer: Buffer | Uint8Array,
  key: string,
  contentType: string
): Promise<string> {
  const client = getR2Client();
  const bucket = getBucketName();
  const publicUrl = getPublicUrl();

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  return `${publicUrl}/${key}`;
}

// ─── URL Helpers ─────────────────────────────────────────────────────────────

/**
 * Checks if a URL points to our R2 bucket.
 */
export function isR2Url(url: string): boolean {
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (!publicUrl || !url) return false;
  const normalizedPublicUrl = publicUrl.endsWith('/') ? publicUrl.slice(0, -1) : publicUrl;
  return url.startsWith(normalizedPublicUrl);
}

/**
 * Extracts the R2 object key from a public URL.
 * Example: "https://pub-xxx.r2.dev/Delhi/abc123.jpg" → "Delhi/abc123.jpg"
 */
export function getR2KeyFromUrl(url: string): string | null {
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (!publicUrl || !url) return null;

  const normalizedPublicUrl = publicUrl.endsWith('/') ? publicUrl.slice(0, -1) : publicUrl;
  
  // Strip query params
  const cleanUrl = url.split('?')[0];

  if (!cleanUrl.startsWith(normalizedPublicUrl)) return null;

  // Extract the path after the public URL base
  const key = cleanUrl.substring(normalizedPublicUrl.length + 1); // +1 for the "/"
  return key || null;
}

// ─── Delete ──────────────────────────────────────────────────────────────────

/**
 * Deletes a single object from R2 by its public URL.
 */
export async function deleteFromR2(url: string): Promise<void> {
  const key = getR2KeyFromUrl(url);
  if (!key) {
    console.warn(`Could not extract R2 key from URL: ${url}`);
    return;
  }

  try {
    const client = getR2Client();
    const bucket = getBucketName();

    await client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );
    console.log(`Successfully deleted R2 object: ${key}`);
  } catch (error: any) {
    console.error(`Failed to delete R2 object: ${key}`, error.message);
  }
}

/**
 * Deletes multiple objects from R2 by their public URLs.
 * R2 supports up to 1000 objects per batch delete.
 */
export async function bulkDeleteFromR2(urls: string[]): Promise<void> {
  const keys = urls
    .map((url) => getR2KeyFromUrl(url))
    .filter(Boolean) as string[];

  if (keys.length === 0) return;

  try {
    const client = getR2Client();
    const bucket = getBucketName();

    // R2 supports up to 1000 keys per DeleteObjects call
    for (let i = 0; i < keys.length; i += 1000) {
      const batch = keys.slice(i, i + 1000);
      await client.send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: {
            Objects: batch.map((key) => ({ Key: key })),
            Quiet: true,
          },
        })
      );
    }
    console.log(`Successfully bulk deleted ${keys.length} R2 objects.`);
  } catch (error: any) {
    console.error('Failed to bulk delete R2 objects:', error.message);
  }
}
