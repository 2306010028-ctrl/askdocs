import multer from "multer";
import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { extname } from "node:path";
import { fileURLToPath } from "node:url";

export const uploadDirectory = fileURLToPath(
  new URL("../uploads/", import.meta.url)
);

mkdirSync(uploadDirectory, { recursive: true });

const allowedTypes: Record<string, string> = {
  ".pdf": "application/pdf",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".txt": "text/plain",
};

export class UploadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadValidationError";
  }
}

const storage = multer.diskStorage({
  destination: (_request, _file, callback) => {
    callback(null, uploadDirectory);
  },

  filename: (_request, file, callback) => {
    const extension = extname(file.originalname).toLowerCase();
    callback(null, `${randomUUID()}${extension}`);
  },
});

export const upload = multer({
  storage,

  limits: {
    fileSize: 20 * 1024 * 1024,
    files: 1,
    fields: 5,
    parts: 6,
  },

  fileFilter: (_request, file, callback) => {
    const extension = extname(file.originalname).toLowerCase();
    const expectedType = allowedTypes[extension];

    if (!expectedType || file.mimetype !== expectedType) {
      callback(
        new UploadValidationError(
          "Yalnızca PDF, DOCX ve TXT dosyaları yüklenebilir."
        )
      );
      return;
    }

    callback(null, true);
  },
});