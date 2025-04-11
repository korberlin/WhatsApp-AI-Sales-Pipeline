  import path from 'path';
  import { v2 as cloudinary } from 'cloudinary';
  import config from '../config/index.js';
  import logger from '../utils/logger.js';

  // Configure Cloudinary
  cloudinary.config({
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
    cloud_name: config.cloudinary.cloudName
  });

  /**
   * Determine resource type based on file extension
   * @param {string} filePath - Path to the file
   * @returns {string} Resource type ('image', 'video', or 'auto')
   */
  function getResourceType(filePath) {
    const extension = path.extname(filePath).toLowerCase();
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.flv', '.wmv'];

    if (imageExtensions.includes(extension)) return 'image';
    if (videoExtensions.includes(extension)) return 'video';
    
    return 'auto';
  }

  /**
   * Upload buffer data to Cloudinary
   * @param {Buffer} buffer - The binary data buffer
   * @param {string} mimeType - The MIME type of the media
   * @returns {Promise<Object>} Upload result
   */
  export async function uploadBufferToCloudinary(buffer, mimeType) {
    return new Promise((resolve, reject) => {
      let resourceType;
      if (mimeType.startsWith('image')) {
        resourceType = 'image';
      } else if (mimeType.startsWith('video')) {
        resourceType = 'video';
      } else {
        resourceType = 'auto';
      }
      
      const uploadOptions = {
        resource_type: resourceType,
        folder: config.cloudinary.folder
      };
      
      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions, 
        (error, result) => {
          if (error) {
            logger.error(`Error uploading buffer to Cloudinary: ${error.message}`);
            reject(error);
          } else {
            logger.info(`Uploaded buffer to ${result.secure_url}`);
            resolve({url: result.secure_url, publicId: result.public_id});
          }
        }
      );
      
      // Write buffer to the stream
      uploadStream.write(buffer);
      uploadStream.end();
    });
  }

  /**
   * Upload multiple media files to Cloudinary
   * @param {Array} filePaths - Array of file paths to upload
   * @returns {Promise<Array>} Array of uploaded file URLs
   */
  export async function uploadMediaFilesToCloudinary(filePaths) {
    if (!Array.isArray(filePaths) || filePaths.length === 0) {
      return [];
    }

    logger.info(`Uploading ${filePaths.length} files to Cloudinary`);
    
    const uploadPromises = filePaths.map(async (filePath) => {
      try {
        const resourceType = getResourceType(filePath);
        logger.info(`Uploading ${filePath} as ${resourceType}`);
        
        const result = await cloudinary.uploader.upload(filePath, {
          resource_type: resourceType,
          folder: config.cloudinary.folder
        });
        
        logger.info(`Uploaded file to ${result.secure_url}`);
        return { url: result.secure_url, publicId: result.public_id };
      } catch (error) {
        logger.error(`Error uploading ${filePath} to Cloudinary: ${error.message}`);
        return null;
      }
    });

    const uploadedFiles = await Promise.all(uploadPromises);
    return uploadedFiles.filter(urlObj => urlObj !== null);
  }

  /**
   * Upload a single file to Cloudinary
   * @param {string} filePath - Path to the file to upload
   * @returns {Promise<Object>} Upload result with URL
   */
  export async function uploadSingleFileToCloudinary(filePath) {
    try {
      const resourceType = getResourceType(filePath);
      logger.info(`Uploading single file ${filePath} as ${resourceType}`);
      
      const result = await cloudinary.uploader.upload(filePath, {
        resource_type: resourceType,
        folder: config.cloudinary.folder
      });
      
      logger.info(`Uploaded file to ${result.secure_url}`);
      return { 
        success: true, 
        url: result.secure_url, 
        publicId: result.public_id 
      };
    } catch (error) {
      logger.error(`Error uploading file to Cloudinary: ${error.message}`);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  export default {
    uploadBufferToCloudinary,
    uploadMediaFilesToCloudinary,
    uploadSingleFileToCloudinary
  };