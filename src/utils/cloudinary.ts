import { v2 as cloudinary } from 'cloudinary';
import config from '../config';
import * as fs from 'fs';

cloudinary.config({
  cloud_name: config.Cloudinary?.CLOUDINARY_CLOUD_NAME,
  api_key: config.Cloudinary?.CLOUDINARY_API_KEY,
  api_secret: config.Cloudinary?.CLOUDINARY_API_SECRET,
  secure: true,
});

export type CloudinaryUploadResult = {
  secure_url: string;
  public_id: string;
};

export type OptimizationLevel = 'low' | 'medium' | 'high' | 'ultra';

const getOptimizationSettings = (
  level: OptimizationLevel,
  fileSize: number,
) => {
  const baseSettings = {
    fetch_format: 'auto',
  };

  // Apply different optimization based on file size and level
  if (fileSize > 2 * 1024 * 1024) {
    // > 2MB
    return {
      ...baseSettings,
      quality: 'auto:good',
      width: 1000,
      height: 1000,
      crop: 'limit',
      gravity: 'center',
      format: 'webp',
    };
  }

  switch (level) {
    case 'low':
      return {
        ...baseSettings,
        quality: 60,
        width: 800,
        height: 800,
        crop: 'limit',
        gravity: 'center',
        format: 'webp',
      };
    case 'medium':
      return {
        ...baseSettings,
        quality: 75,
        width: 1000,
        height: 1000,
        crop: 'limit',
        gravity: 'center',
        format: 'webp',
      };
    case 'high':
      return {
        ...baseSettings,
        quality: 85,
        width: 1200,
        height: 1200,
        crop: 'limit',
        gravity: 'center',
        format: 'webp',
      };
    case 'ultra':
      return {
        ...baseSettings,
        quality: 90,
        width: 1500,
        height: 1500,
        crop: 'limit',
        gravity: 'center',
        format: 'webp',
      };
    default:
      return {
        ...baseSettings,
        quality: 80,
        width: 1200,
        height: 1200,
        crop: 'limit',
        gravity: 'center',
        format: 'webp',
      };
  }
};

export const uploadImageToCloudinary = async (
  filePath: string,
  folder: string,
  optimizationLevel: OptimizationLevel = 'medium',
): Promise<CloudinaryUploadResult> => {
  if (
    !config.Cloudinary?.CLOUDINARY_CLOUD_NAME ||
    !config.Cloudinary?.CLOUDINARY_API_KEY ||
    !config.Cloudinary?.CLOUDINARY_API_SECRET
  ) {
    throw new Error('Cloudinary credentials are not configured');
  }

  // Check file size
  const stats = fs.statSync(filePath);
  const fileSize = stats.size;

  // Log file size for monitoring
  console.log(
    `Uploading image: ${filePath}, Size: ${(fileSize / 1024 / 1024).toFixed(2)}MB`,
  );

  // Get optimization settings based on file size and level
  const optimizationSettings = getOptimizationSettings(
    optimizationLevel,
    fileSize,
  );

  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: 'image',
    transformation: [optimizationSettings],
  });

  console.log(
    `Image optimized and uploaded: ${result.secure_url}, Original size: ${(fileSize / 1024 / 1024).toFixed(2)}MB`,
  );

  return {
    secure_url: result.secure_url,
    public_id: result.public_id,
  };
};

export const uploadBufferToCloudinary = async (
  buffer: Buffer,
  folder: string,
  optimizationLevel: OptimizationLevel = 'medium',
): Promise<CloudinaryUploadResult> => {
  if (
    !config.Cloudinary?.CLOUDINARY_CLOUD_NAME ||
    !config.Cloudinary?.CLOUDINARY_API_KEY ||
    !config.Cloudinary?.CLOUDINARY_API_SECRET
  ) {
    throw new Error('Cloudinary credentials are not configured');
  }

  const fileSize = buffer.length;
  const optimizationSettings = getOptimizationSettings(
    optimizationLevel,
    fileSize,
  );

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [optimizationSettings],
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return reject(error);
        }
        if (!result) {
          return reject(new Error('Cloudinary upload result is undefined'));
        }

        console.log(
          `Buffer image optimized and uploaded: ${result.secure_url}, Size: ${(fileSize / 1024 / 1024).toFixed(2)}MB`,
        );

        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
        });
      },
    );

    uploadStream.end(buffer);
  });
};

export const deleteFromCloudinary = async (publicId: string) => {
  if (!publicId) return;

  await cloudinary.uploader.destroy(publicId, {
    resource_type: 'image',
  });
};
