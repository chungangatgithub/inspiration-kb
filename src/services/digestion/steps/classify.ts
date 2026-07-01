import * as fs from "fs";
import * as path from "path";
import type { DeepSeekClient } from "../../deepseek.client";
import type { SourceType } from "@/types/card";

function loadPrompt(): string {
  const promptPath = path.join(__dirname, "..", "prompts", "classify.txt");
  return fs.readFileSync(promptPath, "utf-8");
}

export async function classify(
  client: DeepSeekClient,
  input: { body: string; userNote: string | null },
): Promise<SourceType | null> {
  const prompt = loadPrompt()
    .replace("{body}", input.body)
    .replace("{userNote}", input.userNote ?? "");

  const response = await client.chat(prompt, input.body);
  try {
    const parsed = JSON.parse(response.trim());
    const type = parsed.type as string;
    const validTypes: SourceType[] = [
      "webpage", "video", "book", "social_post", "game", "screenshot", "thought",
    ];
    return validTypes.includes(type as SourceType) ? (type as SourceType) : null;
  } catch {
    return null;
  }
}
