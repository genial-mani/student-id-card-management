import crypto from 'crypto';
import axios from 'axios';

/**
 * Extracts the public ID of an asset from its Cloudinary URL.
 * Example URL: https://res.cloudinary.com/diumsbsrb/image/upload/v1717524905/Arun/f38d38e2bc13.jpg
 * Returns: "Arun/f38d38e2bc13"
 */
export function getPublicIdFromUrl(url: string): string | null {
  if (!url || !url.includes("res.cloudinary.com")) return null;
  const parts = url.split("/image/upload/");
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
