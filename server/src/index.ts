import express from "express";
import type { ErrorRequestHandler } from "express";
import cors from "cors";
import multer from "multer";
import { unlink } from "node:fs/promises";
import { join } from "node:path";
import { pool } from "./db.js";
import {
  upload,
  uploadDirectory,
  UploadValidationError,
} from "./upload.js";
import { processDocument } from "./processDocument.js";
import {
  checkMiniMaxConnection,
  generateDocumentAnswer,
  isMiniMaxConfigured,
  type DocumentSource,
} from "./minimax.js";

export const app = express();
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
// MiniMax API bağlantı kontrolü
app.get("/api/health/ai", async (_request, response) => {
  if (!isMiniMaxConfigured()) {
    response.status(503).json({
      status: "error",
      message: "MiniMax API anahtarı tanımlanmamış.",
    });
    return;
  }

  try {
    const result = await checkMiniMaxConnection();

    response.json({
      status: "ok",
      provider: "MiniMax",
      model: result.model,
      response: result.response,
    });
  } catch (error) {
    console.error("MiniMax bağlantı hatası:", error);

    response.status(503).json({
      status: "error",
      message: "MiniMax API bağlantısı kurulamadı.",
    });
  }
});

// Doküman parçalarını kullanarak soruyu yanıtla
app.post("/api/questions", async (request, response, next) => {
  const question =
    typeof request.body.question === "string"
      ? request.body.question.trim()
      : "";

  if (question.length < 3) {
    response.status(400).json({
      message: "Soru en az 3 karakter olmalıdır.",
    });
    return;
  }

  if (question.length > 1000) {
    response.status(400).json({
      message: "Soru en fazla 1000 karakter olabilir.",
    });
    return;
  }

  if (!isMiniMaxConfigured()) {
    response.status(503).json({
      message: "MiniMax API bağlantısı yapılandırılmamış.",
    });
    return;
  }

  const startedAt = Date.now();

  try {
    const chunksResult = await pool.query(
      `SELECT
        dc.id,
        dc.content,
        dc.source_page,
        d.filename,
        ts_rank_cd(
          to_tsvector('simple', dc.content),
          plainto_tsquery('simple', $1)
        ) AS relevance
       FROM document_chunks dc
       INNER JOIN documents d
         ON d.id = dc.document_id
       ORDER BY
         relevance DESC,
         d.created_at DESC,
         dc.chunk_index ASC
       LIMIT 6`,
      [question]
    );

    const sources: DocumentSource[] =
      chunksResult.rows.map((row) => ({
        id: row.id,
        filename: row.filename,
        content: row.content,
        sourcePage: row.source_page,
      }));

    if (sources.length === 0) {
      response.status(400).json({
        message:
          "Soru yanıtlanmadan önce en az bir doküman yükleyin.",
      });
      return;
    }

    const result = await generateDocumentAnswer(
      question,
      sources
    );

    const responseTimeMs = Date.now() - startedAt;

    try {
      await pool.query(
        `INSERT INTO query_logs
          (
            question,
            chunk_ids,
            response,
            response_time_ms,
            token_count
          )
         VALUES ($1, $2::uuid[], $3, $4, $5)`,
        [
          question,
          sources.map((source) => source.id),
          result.answer,
          responseTimeMs,
          result.tokenCount,
        ]
      );
    } catch (logError) {
      console.error(
        "Sorgu geçmişi kaydedilemedi:",
        logError
      );
    }

    response.json({
      answer: result.answer,
      model: result.model,
      response_time_ms: responseTimeMs,
      token_count: result.tokenCount,
      sources: sources.map((source) => ({
        chunk_id: source.id,
        filename: source.filename,
        source_page: source.sourcePage,
      })),
    });
  } catch (error) {
    next(error);
  }
});
// Son soru-cevap kayıtlarını listele
app.get("/api/queries", async (_request, response, next) => {
  try {
    const result = await pool.query(
      `SELECT
        id,
        question,
        response,
        response_time_ms,
        token_count,
        created_at
       FROM query_logs
       ORDER BY created_at DESC
       LIMIT 20`
    );

    response.json({
      queries: result.rows,
    });
  } catch (error) {
    next(error);
  }
});
// Yüklenen dokümanları listele
app.get("/api/documents", async (_request, response, next) => {
  try {
    const result = await pool.query(
      `SELECT
        id,
        filename,
        file_type,
        file_size,
        chunk_count,
        created_at
       FROM documents
       ORDER BY created_at DESC`
    );

    response.json({
      documents: result.rows,
    });
  } catch (error) {
    next(error);
  }
});
// Tek bir dokümanın bilgilerini ve parçalarını getir
app.get(
  "/api/documents/:id",
  async (request, response, next) => {
    const documentId = request.params.id;

    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidPattern.test(documentId)) {
      response.status(400).json({
        message: "Geçersiz doküman kimliği.",
      });
      return;
    }

    try {
      const documentResult = await pool.query(
        `SELECT
          id,
          filename,
          file_type,
          file_size,
          chunk_count,
          created_at
         FROM documents
         WHERE id = $1`,
        [documentId]
      );

      const document = documentResult.rows[0];

      if (!document) {
        response.status(404).json({
          message: "Doküman bulunamadı.",
        });
        return;
      }

      const chunksResult = await pool.query(
        `SELECT
          id,
          chunk_index,
          content,
          source_page,
          created_at
         FROM document_chunks
         WHERE document_id = $1
         ORDER BY chunk_index`,
        [documentId]
      );

      response.json({
        document,
        chunks: chunksResult.rows,
      });
    } catch (error) {
      next(error);
    }
  }
);
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
      // İşlenemeyen dosyayı diskte bırakma
      try {
        await unlink(file.path);
      } catch (cleanupError) {
        console.error("Dosya temizleme hatası:", cleanupError);
      }

      next(error);
    }
  }
);

// Dokümanı, parçalarını ve yüklenen dosyayı sil
app.delete(
  "/api/documents/:id",
  async (request, response, next) => {
    const documentId = request.params.id;

    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidPattern.test(documentId)) {
      response.status(400).json({
        message: "Geçersiz doküman kimliği.",
      });
      return;
    }

    try {
      const result = await pool.query(
        `DELETE FROM documents
         WHERE id = $1
         RETURNING id, filename, file_type`,
        [documentId]
      );

      const document = result.rows[0];

      if (!document) {
        response.status(404).json({
          message: "Doküman bulunamadı.",
        });
        return;
      }

      // Foreign key üzerindeki ON DELETE CASCADE sayesinde
      // dokümana ait chunk kayıtları otomatik silinir.
      const storedFilePath = join(
        uploadDirectory,
        `${document.id}.${document.file_type}`
      );

      try {
        await unlink(storedFilePath);
      } catch (fileError) {
        const errorCode = (fileError as NodeJS.ErrnoException).code;

        if (errorCode !== "ENOENT") {
          console.error("Yüklenen dosyayı silme hatası:", fileError);
        }
      }

      response.json({
        message: "Doküman ve ilgili parçalar başarıyla silindi.",
        document: {
          id: document.id,
          filename: document.filename,
        },
      });
    } catch (error) {
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
if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => {
    console.log(
      `AskDocs API http://localhost:${port} adresinde çalışıyor`
    );
  });
}