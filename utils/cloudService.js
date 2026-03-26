import axios from 'axios';

const uploadImageToCloudinary = async (imageFile) => {
  const url = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_NAME}/image/upload`;
  const formData = new FormData();
  formData.append('file', imageFile);
  formData.append('upload_preset', 'images_preset');

  try {
    const response = await axios.post(url, formData);
    return response.data.secure_url;
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    throw error;
  }
};

export default uploadImageToCloudinary;
