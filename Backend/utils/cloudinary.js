import { v2 as cloudinary } from "cloudinary";

// dotenv is loaded once at app startup (Backend/index.js).
// No need to load it again here — doing so can load the wrong .env file.

// Initialize Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export default cloudinary;
