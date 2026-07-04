import * as fs from "fs";
import * as path from "path";
import type { DeepSeekClient } from "../../deepseek.client";

function loadPrompt(): string {
  const promptPath = path.join(__dirname, "..", "prompts", "summarize.txt");
  return fs.readFileSync(promptPath, "utf-8");
}

export async function summarize(
  client: DeepSeekClient,
  input: { body: string },
): Promise<string | null> {
  const prompt = loadPrompt().replace("{body}", input.body);

  const response = await client.chat(prompt, input.body);
  const result = response.trim();
	  if (result.length === 0) return null;
	  // Safely truncate by code points to avoid breaking multi-byte characters
	  const chars = Array.from(result);
	  return chars.length <= 50 ? result : chars.slice(0, 50).join('');
}
