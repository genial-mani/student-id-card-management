import uploadImageToCloudinary from "./cloudService";

/**
 * Loads an image from a URL into an HTMLImageElement with crossOrigin CORS enabled.
 */
export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error("Failed to load image for enhancement."));
    // Add cache busting query parameter if needed to bypass CORS cache issues
    const safeUrl = url.includes("cloudinary.com")
      ? url
      : `${url}${url.includes("?") ? "&" : "?"}_t=${Date.now()}`;
    img.src = safeUrl;
  });
}

/**
 * Renders an image onto an offscreen canvas with brightness and contrast filters applied,
 * converts the canvas to a JPEG Blob, and uploads it to Cloudinary.
 *
 * @param imageUrl The original student profile picture URL
 * @param brightness Percentage value (100 is default, e.g. 125 for +25% brightness)
 * @param contrast Percentage value (100 is default, e.g. 110 for +10% contrast)
 * @param folder Optional Cloudinary folder name (e.g. "student_photos")
 * @returns The new Cloudinary CDN image URL
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

  // Upload processed file to Cloudinary
  const newUrl = await uploadImageToCloudinary(file, folder);
  return newUrl;
}
