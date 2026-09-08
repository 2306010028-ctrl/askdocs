import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";

const apiKey = process.env.MINIMAX_API_KEY;
const baseURL =
  process.env.MINIMAX_BASE_URL ||
  "https://api.minimax.io/anthropic";
const model = process.env.MINIMAX_MODEL || "MiniMax-M3";

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

  const textBlock = result.content.find(
    (block) => block.type === "text"
  );

  return {
    model: result.model,
    response:
      textBlock?.type === "text"
        ? textBlock.text.trim()
        : "",
  };
}