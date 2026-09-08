import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";

const apiKey = process.env.MINIMAX_API_KEY;
const baseURL =
  process.env.MINIMAX_BASE_URL ||
  "https://api.minimax.io/anthropic";
const model = process.env.MINIMAX_MODEL || "MiniMax-M3";

export type DocumentSource = {
  id: string;
  filename: string;
  content: string;
  sourcePage: number | null;
};

export function isMiniMaxConfigured() {
  return Boolean(apiKey);
}

function getMiniMaxClient() {
  if (!apiKey) {
    throw new Error("MINIMAX_API_KEY tanımlanmamış.");
  }

  return new Anthropic({
    apiKey,
    baseURL,
  });
}

function getTextContent(
  content: Anthropic.Messages.ContentBlock[]
) {
  return content
    .filter(
      (
        block
      ): block is Anthropic.Messages.TextBlock =>
        block.type === "text"
    )
    .map((block) => block.text)
    .join("\n")
    .trim();
}

export async function checkMiniMaxConnection() {
  const client = getMiniMaxClient();

  const result = await client.messages.create({
    model,
    max_tokens: 16,
    messages: [
      {
        role: "user",
        content: "Yalnızca OK yaz.",
      },
    ],
  });

  return {
    model: result.model,
    response: getTextContent(result.content),
  };
}

export async function generateDocumentAnswer(
  question: string,
  sources: DocumentSource[]
) {
  const client = getMiniMaxClient();

  const context = sources
    .map((source, index) => {
      const pageInformation =
        source.sourcePage === null
          ? "Sayfa bilgisi yok"
          : `Sayfa ${source.sourcePage}`;

      return [
        `[Kaynak ${index + 1}]`,
        `Belge: ${source.filename}`,
        pageInformation,
        source.content,
      ].join("\n");
    })
    .join("\n\n");

  const result = await client.messages.create({
    model,
    max_tokens: 1000,
    system: [
      "Sen AskDocs isimli bir doküman asistanısın.",
      "Yalnızca sana verilen belge parçalarını kullanarak Türkçe cevap ver.",
      "Belge parçalarında cevap yoksa bunu açıkça belirt.",
      "Bilgi uydurma ve dışarıdan bilgi ekleme.",
      "Kullandığın bilgilerin sonunda [Kaynak 1] biçiminde kaynak göster.",
      "Cevabı açık, anlaşılır ve mümkün olduğunca kısa tut.",
    ].join(" "),
    messages: [
      {
        role: "user",
        content: [
          "BELGE PARÇALARI:",
          context,
          "",
          "SORU:",
          question,
        ].join("\n"),
      },
    ],
  });

  const answer = getTextContent(result.content);

  if (!answer) {
    throw new Error("MiniMax boş cevap döndürdü.");
  }

  return {
    answer,
    model: result.model,
    tokenCount:
      result.usage.input_tokens +
      result.usage.output_tokens,
  };
}