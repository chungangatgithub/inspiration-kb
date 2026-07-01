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
  return result.length > 0 ? (result.length <= 50 ? result : result.slice(0, 50)) : null;
}
