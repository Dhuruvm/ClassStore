import multer from "multer";
import path from "path";
import fs from "fs";

const uploadsDir = path.join(process.cwd(), "server", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate secure random filename, strip user extension for safety
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    const safeExtension = file.mimetype === "image/jpeg" ? ".jpg" :
                         file.mimetype === "image/png" ? ".png" :
                         file.mimetype === "image/webp" ? ".webp" : ".jpg";
    cb(null, file.fieldname + "-" + uniqueSuffix + safeExtension);
  },
});

const fileFilter = (req: any, file: any, cb: any) => {
  // Strict allowlist: only safe image formats (no SVG)
  const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
  
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG, and WebP image files are allowed!"), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});
