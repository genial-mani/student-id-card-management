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
 * converts the canvas to a JPEG Blob, and uploads it to storage (R2).
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

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth || img.width || 600;
  canvas.height = img.naturalHeight || img.height || 800;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Unable to create 2D canvas context.");
  }

  // Clear background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Apply CSS 2D canvas filter
  ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;

  // Draw enhanced image at full resolution
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  // Convert canvas to Blob (High quality JPEG 0.95)
  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error("Canvas to Blob conversion failed."));
      },
      "image/jpeg",
      0.95
    );
  });

  // Create a File object from the Blob
  const fileName = `student_photo_${Date.now()}.jpg`;
  const file = new File([blob], fileName, { type: "image/jpeg" });

  // Upload processed file to R2
  const newUrl = await uploadImage(file, folder);
  return newUrl;
}
