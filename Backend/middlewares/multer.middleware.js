import multer from "multer";
import { ApiError } from "../utils/ApiError.js";

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 20 * 1024 * 1024; // default 20MB

// In your multer configuration file
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype === "application/pdf" ||
      file.mimetype === "application/msword" ||
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      cb(null, true);
    } else {
      cb(
        new ApiError(
          400,
          "Only image files, PDFs, and Word documents are allowed!"
        ),
        false
      );
    }
  },
});
