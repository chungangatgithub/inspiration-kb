import * as fs from "fs";
import * as path from "path";
import type { DeepSeekClient } from "../../deepseek.client";

function loadPrompt(): string {
  const promptPath = path.join(__dirname, "..", "prompts", "theme.txt");
  return fs.readFileSync(promptPath, "utf-8");
}

export async function theme(
  client: DeepSeekClient,
  input: { body: string; existingThemes: string[] },
): Promise<string[]> {
  const prompt = loadPrompt()
    .replace("{body}", input.body)
    .replace("{existingThemes}", JSON.stringify(input.existingThemes));

  const response = await client.chat(prompt, input.body);
  try {
    const parsed = JSON.parse(response.trim());
    return Array.isArray(parsed) ? parsed.filter((t: unknown) => typeof t === "string") : [];
  } catch {
    return [];
  }
}
