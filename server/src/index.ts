import express from "express";
import type { ErrorRequestHandler } from "express";
import cors from "cors";
import multer from "multer";
import { unlink } from "node:fs/promises";
import { pool } from "./db.js";
import { upload, UploadValidationError } from "./upload.js";
import { processDocument } from "./processDocument.js";

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(cors());
app.use(express.json());

// API sağlık kontrolü
app.get("/api/health", (_request, response) => {
  response.json({
    status: "ok",
    message: "AskDocs API çalışıyor",
  });
});

// Veritabanı bağlantı kontrolü
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

// Dosya yükleme, metin çıkarma ve parçaları kaydetme
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
      const document = await processDocument(file);

      response.status(201).json({
        message:
          "Dosya yüklendi, metin çıkarıldı ve parçalar kaydedildi.",
        document,
      });
    } catch (error) {
      // İşlenemeyen dosyayı diskte bırakma.
      try {
        await unlink(file.path);
      } catch (cleanupError) {
        console.error("Dosya temizleme hatası:", cleanupError);
      }

      next(error);
    }
  }
);

// Merkezi hata yönetimi
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
    response.status(400).json({
      message: error.message,
    });
    return;
  }

  console.error("API hatası:", error);

  response.status(500).json({
    message: "İşlem tamamlanamadı. Lütfen tekrar deneyin.",
  });
};

app.use(errorHandler);

// Sunucuyu başlat
app.listen(port, () => {
  console.log(
    `AskDocs API http://localhost:${port} adresinde çalışıyor`
  );
});