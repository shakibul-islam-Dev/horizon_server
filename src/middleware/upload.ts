import multer from "multer";
import { MAX_IMAGE_SIZE, MAX_DATA_SIZE } from "../utils/constants";

const storage = multer.memoryStorage();

const imageFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"));
  }
};

const dataFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = [
    "text/csv",
    "application/json",
    "application/vnd.ms-excel",
    "text/plain",
  ];
  if (allowedMimes.includes(file.mimetype) || file.originalname.endsWith(".csv") || file.originalname.endsWith(".json")) {
    cb(null, true);
  } else {
    cb(new Error("Only CSV, JSON, or Excel files are allowed"));
  }
};

export const uploadImage = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: MAX_IMAGE_SIZE },
});

export const uploadData = multer({
  storage,
  fileFilter: dataFilter,
  limits: { fileSize: MAX_DATA_SIZE },
});
