import { basename, extname } from "node:path";
import { pool } from "./db.js";
import {
  extractTxt,
  extractDocx,
  extractPdf,
} from "./extractText.js";
import { chunkText } from "./chunkText.js";
import { UploadValidationError } from "./upload.js";

type UploadedDocument = {
  filename: string;
  originalname: string;
  path: string;
  size: number;
};

async function extractDocument(filePath: string, fileType: string) {
  switch (fileType) {
    case "txt":
      return extractTxt(filePath);
    case "docx":
      return extractDocx(filePath);
    case "pdf":
      return extractPdf(filePath);
    default:
      throw new UploadValidationError("Desteklenmeyen dosya türü.");
  }
}

export async function processDocument(file: UploadedDocument) {
  if (file.size === 0) {
    throw new UploadValidationError("Boş dosya yüklenemez.");
  }

  const extension = extname(file.filename).toLowerCase();
  const fileType = extension.slice(1);
  const documentId = basename(file.filename, extension);

  const pages = await extractDocument(file.path, fileType);
  const chunks = chunkText(pages);

  if (chunks.length === 0) {
    throw new UploadValidationError(
      "Dosyada işlenebilir metin bulunamadı."
    );
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `INSERT INTO documents
        (id, filename, file_type, file_size, chunk_count)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING
        id, filename, file_type, file_size, chunk_count, created_at`,
      [
        documentId,
        file.originalname,
        fileType,
        file.size,
        chunks.length,
      ]
    );

    for (const chunk of chunks) {
      await client.query(
        `INSERT INTO document_chunks
          (document_id, chunk_index, content, source_page)
         VALUES ($1, $2, $3, $4)`,
        [
          documentId,
          chunk.chunkIndex,
          chunk.text,
          chunk.pageNumber,
        ]
      );
    }

    await client.query("COMMIT");

    return result.rows[0];
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("İşlemi geri alma hatası:", rollbackError);
    }

    throw error;
  } finally {
    client.release();
  }
}