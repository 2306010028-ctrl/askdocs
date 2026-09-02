import express from "express";
import type { ErrorRequestHandler } from "express";
import cors from "cors";
import multer from "multer";
import { unlink } from "node:fs/promises";
import { extname, basename } from "node:path";
import { pool } from "./db.js";
import { upload, UploadValidationError } from "./upload.js";

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(cors());
app.use(express.json());

app.get("/api/health", (_request, response) => {
  response.json({
    status: "ok",
    message: "AskDocs API çalışıyor",
  });
});

app.get("/api/health/db", async (_request, response) => {
  try {
    const result = await pool.query(
      "SELECT current_database() AS database"
    );

    response.json({
      status: "ok",
      database: result.rows[0].database,
    });
  } catch (error) {
    console.error("Veritabanı bağlantı hatası:", error);

    response.status(503).json({
      status: "error",
      message: "Veritabanına bağlanılamadı.",
    });
  }
});

app.post(
  "/api/documents",
  upload.single("file"),
  async (request, response, next) => {
    const file = request.file;

    if (!file) {
      response.status(400).json({
        message: "Lütfen bir dosya seçin.",
      });
      return;
    }

    try {
      if (file.size === 0) {
        throw new UploadValidationError("Boş dosya yüklenemez.");
      }

      const extension = extname(file.filename);
      const documentId = basename(file.filename, extension);
      const fileType = extension.slice(1);

      const result = await pool.query(
        `INSERT INTO documents
          (id, filename, file_type, file_size)
         VALUES ($1, $2, $3, $4)
         RETURNING
          id, filename, file_type, file_size, chunk_count, created_at`,
        [
          documentId,
          file.originalname,
          fileType,
          file.size,
        ]
      );

      response.status(201).json({
        message: "Dosya başarıyla yüklendi.",
        document: result.rows[0],
      });
    } catch (error) {
      // Veritabanına kaydedilemeyen dosyayı diskte bırakma.
      try {
        await unlink(file.path);
      } catch (cleanupError) {
        console.error("Dosya temizleme hatası:", cleanupError);
      }

      next(error);
    }
  }
);

const errorHandler: ErrorRequestHandler = (
  error,
  _request,
  response,
  _next
) => {
  if (error instanceof multer.MulterError) {
    const message =
      error.code === "LIMIT_FILE_SIZE"
        ? "Dosya boyutu en fazla 20 MB olabilir."
        : "Tek seferde yalnızca bir dosya yükleyin; dosya alanı 'file' olmalıdır.";

    response
      .status(error.code === "LIMIT_FILE_SIZE" ? 413 : 400)
      .json({ message });
    return;
  }

  if (error instanceof UploadValidationError) {
    response.status(400).json({ message: error.message });
    return;
  }

  console.error("API hatası:", error);

  response.status(500).json({
    message: "İşlem tamamlanamadı. Lütfen tekrar deneyin.",
  });
};

app.use(errorHandler);

app.listen(port, () => {
  console.log(`AskDocs API http://localhost:${port} adresinde çalışıyor`);
});