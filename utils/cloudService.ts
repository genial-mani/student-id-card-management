import axios from 'axios';

/**
 * Compresses an image file client-side if it exceeds the 5MB threshold.
 * Scales dimensions to at most maxDimension and encodes at 0.90 JPEG quality.
 */
async function compressImageFile(file: File, maxDimension: number = 2000): Promise<File> {
  if (typeof window === 'undefined' || typeof document === 'undefined' || !file.type.startsWith('image/')) {
    return file;
  }

  // Do not convert SVGs or GIFs
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob && blob.size < file.size) {
              const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          0.90
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads an image file directly to Cloudflare R2 via a Presigned URL.
 * File bytes flow directly from browser to R2, completely bypassing Vercel serverless
 * payload limits and bandwidth restrictions (preventing HTTP 413).
 *
 * Automatically compresses images exceeding the 5MB threshold.
 *
 * @param {File} imageFile - The image File to upload
 * @param {string} [folderName] - Optional folder prefix (e.g. school name "Delhi")
 * @param {string} [publicId] - Optional public ID / filename without extension (e.g. camSno "a3f8b2c1d4e5")
 * @returns {Promise<string>} The public URL of the uploaded image
 */
const uploadImage = async (imageFile: File, folderName?: string, publicId?: string): Promise<string> => {
  let fileToUpload = imageFile;

  // Compress images larger than 5MB threshold client-side to prevent oversized uploads
  const MAX_FILE_SIZE_THRESHOLD = 5 * 1024 * 1024; // 5MB
  if (imageFile.size > MAX_FILE_SIZE_THRESHOLD && imageFile.type.startsWith('image/')) {
    try {
      fileToUpload = await compressImageFile(imageFile);
    } catch {
      fileToUpload = imageFile;
    }
  }

  try {
    // 1. Request presigned PUT URL from our server (tiny JSON payload)
    const presignRes = await axios.post('/api/upload/presign', {
      folder: folderName,
      publicId: publicId,
      filename: fileToUpload.name,
      contentType: fileToUpload.type || 'image/jpeg',
    });

    const { uploadUrl, publicUrl } = presignRes.data;
    if (!uploadUrl || !publicUrl) {
      throw new Error('Server failed to provide a valid presigned upload URL.');
    }

    // 2. Direct upload: browser sends bytes straight to Cloudflare R2
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      body: fileToUpload,
      headers: {
        'Content-Type': fileToUpload.type || 'image/jpeg',
      },
    });

    if (!uploadRes.ok) {
      throw new Error(`Direct R2 upload failed with HTTP status ${uploadRes.status}`);
    }

    return publicUrl;
  } catch (error: any) {
    console.error('Error uploading image to R2:', error);
    const message = error.response?.data?.error || error.message || 'Error uploading image';
    throw new Error(message);
  }
};

export default uploadImage;
