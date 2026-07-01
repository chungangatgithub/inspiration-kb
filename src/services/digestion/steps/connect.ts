import * as fs from "fs";
import * as path from "path";
import type { DeepSeekClient } from "../../deepseek.client";

function loadPrompt(): string {
  const promptPath = path.join(__dirname, "..", "prompts", "connect.txt");
  return fs.readFileSync(promptPath, "utf-8");
}

export async function connect(
  client: DeepSeekClient,
  input: {
    summary: string;
    tags: string[];
    existingCards: { id: string; summary: string; tags: string[] }[];
  },
): Promise<{ cardId: string; reason: string }[]> {
  const prompt = loadPrompt()
    .replace("{summary}", input.summary)
    .replace("{tags}", JSON.stringify(input.tags))
    .replace("{existingCards}", JSON.stringify(input.existingCards));

  const response = await client.chat(prompt, input.summary);
  try {
    const parsed = JSON.parse(response.trim());
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (c: unknown) =>
        c &&
        typeof c === "object" &&
        typeof (c as Record<string, unknown>).cardId === "string" &&
        typeof (c as Record<string, unknown>).reason === "string",
    ) as { cardId: string; reason: string }[];
  } catch {
    return [];
  }
}
