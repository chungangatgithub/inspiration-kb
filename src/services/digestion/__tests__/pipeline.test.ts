import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { CardService } from "../../card.service";
import { DeepSeekClient } from "../../deepseek.client";
import { runDigestionPipeline } from "../pipeline";

// Mock all step modules
vi.mock("../steps/classify", () => ({
  classify: vi.fn(),
}));
vi.mock("../steps/extract-meta", () => ({
  extractMeta: vi.fn(),
}));
vi.mock("../steps/tag", () => ({
  tag: vi.fn(),
}));
vi.mock("../steps/theme", () => ({
  theme: vi.fn(),
}));
vi.mock("../steps/summarize", () => ({
  summarize: vi.fn(),
}));
vi.mock("../steps/connect", () => ({
  connect: vi.fn(),
}));

import { classify } from "../steps/classify";
import { extractMeta } from "../steps/extract-meta";
import { tag } from "../steps/tag";
import { theme } from "../steps/theme";
import { summarize } from "../steps/summarize";
import { connect } from "../steps/connect";

function tempDir(): string {
  const dir = path.join(
    os.tmpdir(),
    `kb-test-pipeline-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

describe("runDigestionPipeline", () => {
  let dataDir: string;
  let cardService: CardService;
  let client: DeepSeekClient;

  beforeEach(() => {
    vi.clearAllMocks();
    dataDir = tempDir();
    cardService = new CardService(dataDir);
    client = new DeepSeekClient("test-key");
  });

  afterEach(() => {
    cardService.close();
    fs.rmSync(dataDir, { recursive: true, force: true });
  });

  function createCard(body = "# Test\n\nSome body content.") {
    return cardService.create({
      body,
      userNote: "Interesting note",
      sourceUrl: "https://example.com",
      attachments: [],
    });
  }

  it("runs all 6 steps successfully and marks status done", async () => {
    const card = createCard();
    // Seed another card with a summary so connect finds it
    const existingCard = createCard("Other content");
    cardService.update(existingCard.id, { aiSummary: "另一张卡片的摘要" });

    vi.mocked(classify).mockResolvedValue("webpage");
    vi.mocked(extractMeta).mockResolvedValue({
      title: "Test Title",
      meta: { author: "Jane", site: "example.com" },
    });
    vi.mocked(tag).mockResolvedValue(["typescript", "tutorial"]);
    vi.mocked(theme).mockResolvedValue(["programming", "webdev"]);
    vi.mocked(summarize).mockResolvedValue("一篇关于TypeScript的教程文章");
    vi.mocked(connect).mockResolvedValue([
      { cardId: existingCard.id, reason: "相关主题" },
    ]);

    await runDigestionPipeline(cardService, client, card.id);

    const updated = cardService.getById(card.id)!;
    expect(updated.digestion_status).toBe("done");
    expect(updated.source.type).toBe("webpage");
    expect(updated.source.title).toBe("Test Title");
    expect(updated.source.meta).toEqual({ author: "Jane", site: "example.com" });
    expect(updated.ai_tags).toEqual(["typescript", "tutorial"]);
    expect(updated.ai_themes).toEqual(["programming", "webdev"]);
    expect(updated.ai_summary).toBe("一篇关于TypeScript的教程文章");
    expect(updated.connections).toHaveLength(1);
    expect(updated.connections[0].cardId).toBe(existingCard.id);
    expect(updated.connections[0].source).toBe("ai");

    expect(classify).toHaveBeenCalledTimes(1);
    expect(extractMeta).toHaveBeenCalledTimes(1);
    expect(tag).toHaveBeenCalledTimes(1);
    expect(theme).toHaveBeenCalledTimes(1);
    expect(summarize).toHaveBeenCalledTimes(1);
    expect(connect).toHaveBeenCalledTimes(1);
  });

  it("marks status partial when classify fails", async () => {
    const card = createCard();

    vi.mocked(classify).mockRejectedValue(new Error("API error"));
    vi.mocked(extractMeta).mockResolvedValue({
      title: "Test Title",
      meta: null,
    });
    vi.mocked(tag).mockResolvedValue(["tag1"]);
    vi.mocked(theme).mockResolvedValue(["theme1"]);
    vi.mocked(summarize).mockResolvedValue("一个摘要");
    vi.mocked(connect).mockResolvedValue([]);

    await runDigestionPipeline(cardService, client, card.id);

    const updated = cardService.getById(card.id)!;
    expect(updated.digestion_status).toBe("partial");
    expect(updated.source.type).toBeNull();
    expect(updated.source.title).toBe("Test Title");
    expect(updated.ai_tags).toEqual(["tag1"]);
    expect(extractMeta).toHaveBeenCalledTimes(1);
    expect(tag).toHaveBeenCalledTimes(1);
  });

  it("marks status partial when a middle step fails", async () => {
    const card = createCard();

    vi.mocked(classify).mockResolvedValue("book");
    vi.mocked(extractMeta).mockResolvedValue({
      title: "Book Title",
      meta: { author: "Author" },
    });
    vi.mocked(tag).mockRejectedValue(new Error("Tagging failed"));
    vi.mocked(theme).mockResolvedValue(["literature"]);
    vi.mocked(summarize).mockResolvedValue("关于一本书的摘要");
    vi.mocked(connect).mockResolvedValue([]);

    await runDigestionPipeline(cardService, client, card.id);

    const updated = cardService.getById(card.id)!;
    expect(updated.digestion_status).toBe("partial");
    expect(updated.source.type).toBe("book");
    expect(updated.source.title).toBe("Book Title");
    expect(updated.ai_tags).toEqual([]);
    expect(updated.ai_themes).toEqual(["literature"]);
    expect(updated.ai_summary).toBe("关于一本书的摘要");
    expect(theme).toHaveBeenCalledTimes(1);
    expect(summarize).toHaveBeenCalledTimes(1);
  });

  it("does nothing for a nonexistent card", async () => {
    await runDigestionPipeline(cardService, client, "nonexistent-id");

    expect(classify).not.toHaveBeenCalled();
  });

  it("uses null for meta when extractMeta returns null", async () => {
    const card = createCard();

    vi.mocked(classify).mockResolvedValue("thought");
    vi.mocked(extractMeta).mockResolvedValue(null);
    vi.mocked(tag).mockResolvedValue([]);
    vi.mocked(theme).mockResolvedValue([]);
    vi.mocked(summarize).mockResolvedValue("一个想法");
    vi.mocked(connect).mockResolvedValue([]);

    await runDigestionPipeline(cardService, client, card.id);

    const updated = cardService.getById(card.id)!;
    expect(updated.digestion_status).toBe("partial");
    expect(updated.source.title).toBeNull();
    expect(updated.source.meta).toBeNull();
  });

  it("skips connect step when no summary is available", async () => {
    const card = createCard();

    vi.mocked(classify).mockResolvedValue("webpage");
    vi.mocked(extractMeta).mockResolvedValue({
      title: "Title",
      meta: null,
    });
    vi.mocked(tag).mockResolvedValue(["tag"]);
    vi.mocked(theme).mockResolvedValue(["theme"]);
    vi.mocked(summarize).mockResolvedValue(null);
    vi.mocked(connect).mockResolvedValue([]);

    await runDigestionPipeline(cardService, client, card.id);

    expect(connect).not.toHaveBeenCalled();
  });
});
