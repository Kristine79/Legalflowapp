import OpenAI from "openai";
import { logger } from "./logger";

export const MODEL = "gpt-4o-mini";

interface AIConfig {
  apiKey: string;
  baseURL: string | undefined;
  provider: string;
}

function getAIConfig(): AIConfig | null {
  if (
    process.env.AI_INTEGRATIONS_OPENAI_API_KEY &&
    process.env.AI_INTEGRATIONS_OPENAI_BASE_URL
  ) {
    return {
      provider: "replit-openai",
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    };
  }

  if (process.env.OPENROUTER_API_KEY) {
    return {
      provider: "openrouter",
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
    };
  }

  if (process.env.OPENAI_API_KEY) {
    return {
      provider: "openai",
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL,
    };
  }

  return null;
}

let aiClient: OpenAI | null = null;
let provider: string | null = null;

export function getAIClient(): { client: OpenAI; provider: string } | null {
  const config = getAIConfig();
  if (!config) {
    return null;
  }

  if (!aiClient) {
    aiClient = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
    });
    provider = config.provider;
    logger.info({ provider, model: MODEL }, "AI provider initialized");
  }

  return { client: aiClient, provider: provider! };
}

export function resetAIClientForTests(): void {
  aiClient = null;
  provider = null;
}

export interface DocumentAnalysis {
  summary: string;
  risks: string[];
  disputedClauses: string[];
}

const DOCUMENT_SYSTEM_PROMPT = `You are a senior contract review lawyer for a Russian law firm. Analyze the contract text below and produce a structured review in Russian.

Return ONLY a valid JSON object with no markdown and no commentary. The JSON must have exactly these keys:
- summary: a concise 1-2 sentence summary of the contract
- risks: an array of strings describing legal or financial risks or unfavorable clauses
- disputedClauses: an array of strings describing ambiguous, contradictory, or heavily one-sided clauses that may cause disputes

Guidelines:
- Be specific and cite clause topics where possible.
- Output only the JSON object.`;

export async function analyzeDocument(text: string): Promise<DocumentAnalysis> {
  const ai = getAIClient();
  if (!ai) {
    throw new Error("AI provider is not configured");
  }

  const completion = await ai.client.chat.completions.create({
    model: MODEL,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: DOCUMENT_SYSTEM_PROMPT },
      { role: "user", content: text.slice(0, 12000) },
    ],
    max_completion_tokens: 1200,
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("Empty response from AI");
  }

  const parsed = JSON.parse(raw) as Record<string, unknown>;
  return {
    summary: typeof parsed.summary === "string" ? parsed.summary.trim() : "Сводка не сгенерирована",
    risks: Array.isArray(parsed.risks)
      ? parsed.risks.map((r) => String(r).trim()).filter(Boolean)
      : [],
    disputedClauses: Array.isArray(parsed.disputedClauses)
      ? parsed.disputedClauses.map((c) => String(c).trim()).filter(Boolean)
      : [],
  };
}
