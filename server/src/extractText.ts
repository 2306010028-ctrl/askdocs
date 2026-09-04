import { readFile } from "node:fs/promises";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

export type ExtractedPage = {
  pageNumber: number | null;
  text: string;
};

export async function extractTxt(
  filePath: string
): Promise<ExtractedPage[]> {
  const buffer = await readFile(filePath);

  // Geçersiz UTF-8 verisini sessizce bozuk metne çevirmeden reddet.
  const text = new TextDecoder("utf-8", { fatal: true })
    .decode(buffer)
    .trim();

  if (!text) {
    throw new Error("Dosyada okunabilir metin bulunamadı.");
  }

  return [
    {
      pageNumber: null,
      text,
    },
  ];
}
export async function extractDocx(
  filePath: string
): Promise<ExtractedPage[]> {
  const result = await mammoth.extractRawText({
    path: filePath,
  });

  const text = result.value.trim();

  if (!text) {
    throw new Error("Word belgesinde okunabilir metin bulunamadı.");
  }

  if (result.messages.length > 0) {
    console.warn(
      "DOCX metin çıkarma uyarıları:",
      result.messages
    );
  }

  return [
    {
      pageNumber: null,
      text,
    },
  ];
}
export async function extractPdf(
  filePath: string
): Promise<ExtractedPage[]> {
  const buffer = await readFile(filePath);
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();

    const pages: ExtractedPage[] = result.pages.map((page) => ({
      pageNumber: page.num,
      text: page.text.trim(),
    }));

    if (!pages.some((page) => page.text.length > 0)) {
      throw new Error(
        "PDF içinde okunabilir metin bulunamadı. " +
        "Belge taranmış görüntülerden oluşuyorsa OCR gerekebilir."
      );
    }

    return pages;
  } finally {
    await parser.destroy();
  }
}