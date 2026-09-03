import type { ExtractedPage } from "./extractText.js";

export type TextChunk = {
  chunkIndex: number;
  pageNumber: number | null;
  text: string;
};

export function chunkText(
  pages: ExtractedPage[],
  chunkSize = 800,
  overlap = 100
): TextChunk[] {
  if (
    !Number.isInteger(chunkSize) ||
    !Number.isInteger(overlap) ||
    chunkSize <= 0 ||
    overlap < 0 ||
    overlap >= chunkSize
  ) {
    throw new Error(
      "Parça boyutu pozitif olmalı; örtüşme, parça boyutundan küçük olmalıdır."
    );
  }

  const chunks: TextChunk[] = [];

  for (const page of pages) {
    const text = page.text
      .replace(/\r\n?/g, "\n")
      .trim();

    if (!text) {
      continue;
    }

    // Array.from, emoji gibi karakterlerin ortadan bölünmesini önler.
    const characters = Array.from(text);

    for (
      let start = 0;
      start < characters.length;
      start += chunkSize - overlap
    ) {
      const end = Math.min(
        start + chunkSize,
        characters.length
      );

      const chunk = characters.slice(start, end).join("");

      if (chunk.trim()) {
        chunks.push({
          chunkIndex: chunks.length + 1,
          pageNumber: page.pageNumber,
          text: chunk,
        });
      }

      if (end === characters.length) {
        break;
      }
    }
  }

  return chunks;
}