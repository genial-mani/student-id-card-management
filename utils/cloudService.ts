import axios from 'axios';

/**
 * Uploads an image file to R2 via the server-side /api/upload endpoint.
 * Uses the same folder/publicId naming convention as Cloudinary.
 *
 * @param {File} imageFile - The image File to upload
 * @param {string} [folderName] - Optional folder prefix (e.g. school name "Delhi")
 * @param {string} [publicId] - Optional public ID / filename without extension (e.g. camSno "a3f8b2c1d4e5")
 * @returns {Promise<string>} The public URL of the uploaded image
 */
const uploadImage = async (imageFile: File, folderName?: string, publicId?: string): Promise<string> => {
  const formData = new FormData();
  formData.append('file', imageFile);

  if (folderName) {
    formData.append('folder', folderName);
  }

  if (publicId) {
    formData.append('publicId', publicId);
  }

  try {
    const response = await axios.post('/api/upload', formData);
    return response.data.url;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

export default uploadImage;
