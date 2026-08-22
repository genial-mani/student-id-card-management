import crypto from 'crypto';
import axios from 'axios';

/**
 * Extracts the public ID of an asset from its Cloudinary URL.
 * Example URL: https://res.cloudinary.com/diumsbsrb/image/upload/v1717524905/Arun/f38d38e2bc13.jpg
 * Returns: "Arun/f38d38e2bc13"
 */
export function getPublicIdFromUrl(url: string): string | null {
  if (!url || !url.includes("res.cloudinary.com")) return null;
  const cleanUrl = url.split("?")[0];
  const parts = cleanUrl.split("/image/upload/");
  if (parts.length < 2) return null;
  
  // Remove version segment (starts with 'v' and followed by numbers)
  const path = parts[1];
  const pathParts = path.split("/");
  if (pathParts[0].startsWith("v") && /^\d+$/.test(pathParts[0].substring(1))) {
    pathParts.shift(); // Remove version part
  }
  
  // Join the remaining parts and strip the file extension
  const remaining = pathParts.join("/");
  const dotIndex = remaining.lastIndexOf(".");
  if (dotIndex !== -1) {
    return remaining.substring(0, dotIndex);
  }
  return remaining;
}

/**
 * Deletes an image from Cloudinary using the backend secure Destroy API.
 */
export async function deleteImageFromCloudinary(url: string): Promise<void> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret || apiKey === "your_cloudinary_api_key_here" || apiSecret === "your_cloudinary_api_secret_here") {
    console.warn("Cloudinary backend credentials are not configured in .env. Skipping asset deletion.");
    return;
  }

  const publicId = getPublicIdFromUrl(url);
  if (!publicId) {
    console.warn(`Could not extract public ID from url: ${url}`);
    return;
  }

  const timestamp = Math.round(new Date().getTime() / 1000);
  const paramsToSign = {
    public_id: publicId,
    timestamp: String(timestamp),
  };

  // Generate signature according to Cloudinary spec
  const sortedKeys = Object.keys(paramsToSign).sort();
  const serialized = sortedKeys.map(key => `${key}=${paramsToSign[key as keyof typeof paramsToSign]}`).join('&');
  const stringToSign = serialized + apiSecret;
  const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

  const destUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`;

  try {
    const formData = new URLSearchParams();
    formData.append('public_id', publicId);
    formData.append('timestamp', String(timestamp));
    formData.append('api_key', apiKey);
    formData.append('signature', signature);

    const response = await axios.post(destUrl, formData.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (response.data.result === 'ok') {
      console.log(`Successfully deleted Cloudinary asset: ${publicId}`);
    } else {
      console.warn(`Cloudinary destroy returned result: ${response.data.result} for asset: ${publicId}`);
    }
  } catch (error: any) {
    const errorData = error?.response?.data;
    console.error(`Failed to delete Cloudinary asset: ${publicId}`, errorData || error.message);
  }
}

/**
 * Deletes multiple images from Cloudinary using the Admin API.
 */
export async function bulkDeleteImagesFromCloudinary(urls: string[]): Promise<void> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret || apiKey === "your_cloudinary_api_key_here" || apiSecret === "your_cloudinary_api_secret_here") {
    console.warn("Cloudinary backend credentials are not configured in .env. Skipping bulk asset deletion.");
    return;
  }

  const publicIds = urls.map(url => getPublicIdFromUrl(url)).filter(Boolean) as string[];

  if (publicIds.length === 0) {
    return;
  }

  const destUrl = `https://api.cloudinary.com/v1_1/${cloudName}/resources/image/upload`;
  const auth = {
    username: apiKey,
    password: apiSecret
  };

  try {
    for (let i = 0; i < publicIds.length; i += 100) {
      const batch = publicIds.slice(i, i + 100);
      const queryString = batch.map(id => `public_ids[]=${encodeURIComponent(id)}`).join('&');
      
      const response = await axios.delete(`${destUrl}?${queryString}`, { auth });
      console.log(`Successfully bulk deleted Cloudinary assets batch.`);
    }
  } catch (error: any) {
    const errorData = error?.response?.data;
    console.error(`Failed to bulk delete Cloudinary assets`, errorData || error.message);
  }
}

// ─── Unified Dual-Mode Delete (Cloudinary + R2) ─────────────────────────────

import { isR2Url, deleteFromR2, bulkDeleteFromR2 } from './r2Backend';

/**
 * Deletes a single image from the correct storage provider.
 * Detects whether the URL belongs to Cloudinary or R2 and routes accordingly.
 */
export async function deleteImage(url: string): Promise<void> {
  if (!url) return;

  if (url.includes('res.cloudinary.com')) {
    await deleteImageFromCloudinary(url);
  } else if (isR2Url(url)) {
    await deleteFromR2(url);
  } else {
    console.warn(`Unknown image provider for URL: ${url}. Skipping deletion.`);
  }
}

/**
 * Deletes multiple images, splitting them by provider.
 * Cloudinary URLs go to Cloudinary bulk delete, R2 URLs go to R2 bulk delete.
 */
export async function bulkDeleteImages(urls: string[]): Promise<void> {
  if (!urls || urls.length === 0) return;

  const cloudinaryUrls: string[] = [];
  const r2Urls: string[] = [];
  const unknownUrls: string[] = [];

  for (const url of urls) {
    if (!url) continue;
    if (url.includes('res.cloudinary.com')) {
      cloudinaryUrls.push(url);
    } else if (isR2Url(url)) {
      r2Urls.push(url);
    } else {
      unknownUrls.push(url);
    }
  }

  if (unknownUrls.length > 0) {
    console.warn(`Skipping ${unknownUrls.length} images from unknown providers.`);
  }

  const promises: Promise<void>[] = [];

  if (cloudinaryUrls.length > 0) {
    promises.push(bulkDeleteImagesFromCloudinary(cloudinaryUrls));
  }

  if (r2Urls.length > 0) {
    promises.push(bulkDeleteFromR2(r2Urls));
  }

  await Promise.all(promises);
}
