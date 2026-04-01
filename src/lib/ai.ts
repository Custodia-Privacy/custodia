/**
 * Centralized AI client factory.
 *
 * Supports any OpenAI-compatible API via AI_BASE_URL / AI_API_KEY / AI_MODEL env vars.
 * Defaults to Anthropic (claude-sonnet-4-20250514) when ANTHROPIC_API_KEY is set.
 *
 * IMPORTANT: Never send raw PII (names, emails, phone numbers) in prompts.
 * Use the pseudonymizePII helper to strip identifiers before calling the AI.
 */
import OpenAI from "openai";

export function getAI(): OpenAI {
  const baseURL = process.env.AI_BASE_URL;
  const apiKey =
    process.env.AI_API_KEY ??
    process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Missing AI provider credentials. Set AI_API_KEY (or ANTHROPIC_API_KEY) in the environment.",
    );
  }

  return new OpenAI({
    apiKey,
    baseURL: baseURL ?? "https://api.anthropic.com/v1/",
  });
}

export function getAIModel(): string {
  return process.env.AI_MODEL ?? "claude-sonnet-4-20250514";
}

/**
 * Replace PII in text with pseudonymous placeholders.
 * Returns the scrubbed text and a mapping to restore originals if needed.
 */
export function pseudonymizePII(text: string): {
  scrubbed: string;
  mapping: Map<string, string>;
} {
  const mapping = new Map<string, string>();
  let counter = 1;

  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const scrubbed = text.replace(emailRegex, (match) => {
    const placeholder = `[EMAIL_${counter}]`;
    mapping.set(placeholder, match);
    counter++;
    return placeholder;
  });

  return { scrubbed, mapping };
}

/**
 * Redact specific known PII fields from a DSAR/preferences prompt context.
 * Replaces names and emails with pseudonyms while preserving structure.
 */
export function redactForPrompt(fields: {
  requesterName?: string;
  requesterEmail?: string;
  requesterPhone?: string | null;
}): {
  requesterName: string;
  requesterEmail: string;
  requesterPhone: string;
} {
  return {
    requesterName: "Data Subject (redacted)",
    requesterEmail: "[requester_email_redacted]",
    requesterPhone: fields.requesterPhone ? "[phone_redacted]" : "None",
  };
}
