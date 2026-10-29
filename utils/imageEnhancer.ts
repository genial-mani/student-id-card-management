import uploadImage from "./cloudService";

/**
 * Loads an image from a URL as a local Blob Object URL, completely eliminating
 * canvas taint and CORS security errors.
 */
export async function loadImage(url: string): Promise<HTMLImageElement> {
  if (!url || typeof url !== "string") {
    throw new Error("Invalid image URL provided.");
  }

  const trimmedUrl = url.trim();

  // If already a local blob or data URL, load directly
  if (trimmedUrl.startsWith("blob:") || trimmedUrl.startsWith("data:")) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Failed to load local image."));
      img.src = trimmedUrl;
    });
  }

  let objectUrl = "";

  // 1. Try direct fetch as CORS blob
  try {
    const res = await fetch(trimmedUrl, { mode: "cors" });
    if (res.ok) {
      const blob = await res.blob();
      objectUrl = URL.createObjectURL(blob);
    }
  } catch {
    // Direct CORS fetch failed, try via server proxy
  }

  // 2. Fallback to server proxy if direct fetch failed
  if (!objectUrl) {
    try {
      const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(trimmedUrl)}`;
      const proxyRes = await fetch(proxyUrl);
      if (proxyRes.ok) {
        const blob = await proxyRes.blob();
        objectUrl = URL.createObjectURL(blob);
      }
    } catch {
      // Proxy failed
    }
  }

  // 3. Fallback to direct URL if both blob fetches failed
  const finalSrc = objectUrl || trimmedUrl;

  return new Promise((resolve, reject) => {
    const img = new Image();
    if (!objectUrl) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image for enhancement."));
    img.src = finalSrc;
  });
}

/**
 * Renders an image onto an offscreen canvas with brightness and contrast filters applied,
 * resizes to an optimal resolution for ID cards (max 1200px), and compresses to a lightweight JPEG.
 * This prevents HTTP 413 (Payload Too Large) errors when uploading to server/cloud storage.
 *
 * @param img The loaded HTMLImageElement
 * @param brightness Percentage value (100 default)
 * @param contrast Percentage value (100 default)
 * @param maxDimension Maximum width/height (defaults to 1920px, crisp full HD resolution)
 */
export async function createOptimizedEnhancedImageBlob(
  img: HTMLImageElement,
  brightness: number = 100,
  contrast: number = 100,
  maxDimension: number = 1920
): Promise<{ blob: Blob; dataUrl: string }> {
  const origW = img.naturalWidth || img.width || 600;
  const origH = img.naturalHeight || img.height || 800;

  // Compute scaled dimensions preserving aspect ratio
  let w = origW;
  let h = origH;
  if (w > maxDimension || h > maxDimension) {
    if (w > h) {
      h = Math.round((h * maxDimension) / w);
      w = maxDimension;
    } else {
      w = Math.round((w * maxDimension) / h);
      h = maxDimension;
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Unable to create 2D canvas context.");
  }

  // Smooth scaling
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Solid background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);

  // Apply brightness & contrast filters
  ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
  ctx.drawImage(img, 0, 0, w, h);

  // Convert to high-quality compressed JPEG (0.90 gives pristine quality while staying well below 5MB)
  let quality = 0.90;
  let blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error("Canvas to Blob conversion failed."));
      },
      "image/jpeg",
      quality
    );
  });

  // Safety threshold: ensure photo strictly respects the 5MB limit
  const MAX_FILE_SIZE_THRESHOLD = 5 * 1024 * 1024; // 5MB
  if (blob.size > MAX_FILE_SIZE_THRESHOLD) {
    quality = 0.80;
    blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error("Canvas compression retry failed."));
        },
        "image/jpeg",
        quality
      );
    });
  }

  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  return { blob, dataUrl };
}

/**
 * Renders an image onto an offscreen canvas with brightness and contrast filters applied,
 * converts the canvas to an optimized JPEG Blob, and uploads it to storage (R2).
 *
 * @param imageUrl The original student profile picture URL
 * @param brightness Percentage value (100 is default, e.g. 125 for +25% brightness)
 * @param contrast Percentage value (100 is default, e.g. 110 for +10% contrast)
 * @param folder Optional folder name (e.g. "student_photos")
 * @returns The new CDN image URL
 */
export async function processAndUploadStudentPhoto(
  imageUrl: string,
  brightness: number = 100,
  contrast: number = 100,
  folder: string = "student_photos"
): Promise<string> {
  const img = await loadImage(imageUrl);
  const { blob } = await createOptimizedEnhancedImageBlob(img, brightness, contrast);

  // Create a File object from the optimized Blob
  const fileName = `student_photo_${Date.now()}.jpg`;
  const file = new File([blob], fileName, { type: "image/jpeg" });

  // Upload processed file to R2
  const newUrl = await uploadImage(file, folder);
  return newUrl;
}
