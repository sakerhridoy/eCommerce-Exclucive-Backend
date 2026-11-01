import { v2 as cloudinary } from 'cloudinary';
import { config } from '../../config/index.js';

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret
});

export const uploadToCloudinary = async (filePath, folder = 'singlev') => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder
    });
    return {
      publicId: result.public_id,
      url: result.secure_url
    };
  } catch (error) {
    throw new Error('Failed to upload image to Cloudinary');
  }
};

export const deleteFromCloudinary = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    throw new Error('Failed to delete image from Cloudinary');
  }
};
