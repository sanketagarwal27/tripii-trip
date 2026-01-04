import DataUriParser from "datauri/parser.js";
import path from "path";

const parser = new DataUriParser();

const getDataUri = (input) => {
  try {
    if (!input || !input.buffer) {
      throw new Error("getDataUri: buffer is required");
    }

    // Case 1: Multer file (old code)
    if (input.originalname) {
      const ext = path.extname(input.originalname);
      return parser.format(ext, input.buffer);
    }

    // Case 2: Sharp / manual buffer (new code)
    if (input.mimetype) {
      const ext = `.${input.mimetype.split("/")[1]}`;
      return parser.format(ext, input.buffer);
    }

    // Fallback (last resort)
    return parser.format(".jpg", input.buffer);
  } catch (err) {
    console.error("getDataUri error:", err.message);
    throw err;
  }
};

export default getDataUri;
