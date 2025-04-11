// Cloudinary configuration
export default {
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  apiKey: process.env.CLOUDINARY_API_KEY,
  apiSecret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Use HTTPS
  folder: process.env.CLOUDINARY_FOLDER || 'whatsapp-uploads'
};