import cloudinaryConfig from '../config/cloudinaryConfig.js';
import fs from 'fs-extra';
import fsNode from 'fs';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const downloadAndUploadImage = async (imageUrl, folder = 'students', studentId = null) => {
  try {
    if (!imageUrl) {
      throw new Error("No image URL provided");
    }

    const { isCloudinaryConfigured } = await import('../config/cloudinaryConfig.js');
    if (!isCloudinaryConfigured) {

      return {
        url: imageUrl,
        public_id: null,
      };
    }

    const tempDir = path.join(__dirname, '../temp');
    await fs.ensureDir(tempDir);

    const response = await axios({
      method: 'GET',
      url: imageUrl,
      responseType: 'stream',
      timeout: 10000,
    });

    const ext = path.extname(new URL(imageUrl).pathname) || '.jpg';
    const filename = studentId
      ? `student-${studentId}${ext}`
      : `image-${Date.now()}${ext}`;
    const tempPath = path.join(tempDir, filename);

    const writer = fsNode.createWriteStream(tempPath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    const uploadOptions = {
      folder: `online-voting-system/${folder}`,
      resource_type: 'image',
      use_filename: true,
      unique_filename: false,
      overwrite: true,
      transformation: [
        { width: 500, height: 500, crop: 'limit' },
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    };

    const result = await cloudinaryConfig.uploader.upload(tempPath, uploadOptions);

    await fs.remove(tempPath);

    return {
      url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error) {

    const tempDir = path.join(__dirname, '../temp');
    if (await fs.pathExists(tempDir)) {
      const files = await fs.readdir(tempDir);
      for (const file of files) {
        if (file.includes(studentId || 'image-')) {
          await fs.remove(path.join(tempDir, file)).catch(() => {});
        }
      }
    }

    console.error(`Failed to download/upload image from ${imageUrl}:`, error.message);
    return {
      url: imageUrl,
      public_id: null,
    };
  }
};

export const uploadImageToCloudinary = async (imagePath, folder) => {
  try {
    if (!imagePath) {
      throw new Error("No image path provided");
    }
    const result = await cloudinaryConfig.uploader.upload(imagePath, {
      folder: folder || "uploads",
      resource_type: "auto",
      use_filename: true,
      unique_filename: true,
    });
    return {
      url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error) {
    throw error;
  }
};

export const uploadImage = async (filePath, folder = 'general', options = {}) => {
  try {
    if (!filePath) {
      throw new Error('File path is required for image upload');
    }

    const fileExists = await fs.pathExists(filePath);
    if (!fileExists) {
      throw new Error(`File not found at path: ${filePath}`);
    }

    const uploadOptions = {
      folder: `online-voting-system/${folder}`,
      resource_type: 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      transformation: [
        { width: 1000, height: 1000, crop: 'limit' },
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ],
      ...options
    };

    const result = await cloudinaryConfig.uploader.upload(filePath, uploadOptions);
    return {
      url: result.secure_url,
      public_id: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      created_at: result.created_at
    };

  } catch (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};