import axios from 'axios';

const uploadImageToCloudinary = async (imageFile, folderName, publicId) => {
  const url = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_NAME}/image/upload`;
  const formData = new FormData();
  formData.append('file', imageFile);
  formData.append('upload_preset', 'images_preset');

  if (folderName) {
    formData.append('folder', folderName); // Sets the URL path
    formData.append('asset_folder', folderName); // NEW: Forces the visual folder in the dashboard
  }
  
  if (publicId) {
    formData.append('public_id', publicId);
    formData.append('filename_override', publicId);  }

  try {
    const response = await axios.post(url, formData);
    return response.data.secure_url;
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    throw error;
  }
};

export default uploadImageToCloudinary;
