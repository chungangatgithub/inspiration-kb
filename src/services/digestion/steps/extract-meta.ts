import * as fs from "fs";
import * as path from "path";
import type { DeepSeekClient } from "../../deepseek.client";

function loadPrompt(): string {
  const promptPath = path.join(__dirname, "..", "prompts", "extract-meta.txt");
  return fs.readFileSync(promptPath, "utf-8");
}

export async function extractMeta(
  client: DeepSeekClient,
  input: { body: string; type: string },
): Promise<{ title: string | null; meta: Record<string, string> | null } | null> {
  const prompt = loadPrompt()
    .replace("{body}", input.body)
    .replace("{type}", input.type);

  const response = await client.chat(prompt, input.body);
  try {
    const parsed = JSON.parse(response.trim());
    return {
      title: typeof parsed.title === "string" ? parsed.title : null,
      meta: parsed.meta && typeof parsed.meta === "object" ? parsed.meta : null,
    };
  } catch {
    return null;
  }
}
