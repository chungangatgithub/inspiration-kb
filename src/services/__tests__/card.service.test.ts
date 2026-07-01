import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { CardService } from "../card.service";
import type { CardCreateInput, CardUpdateInput } from "../card.service";

function tempDir(): string {
  const dir = path.join(os.tmpdir(), `kb-test-card-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

describe("CardService", () => {
  let dataDir: string;
  let service: CardService;

  beforeEach(() => {
    dataDir = tempDir();
    service = new CardService(dataDir);
  });

  afterEach(() => {
    service.close();
    fs.rmSync(dataDir, { recursive: true, force: true });
  });

  const createInput = (overrides: Partial<CardCreateInput> = {}): CardCreateInput => ({
    body: "# Test\n\nSome body text.",
    userNote: "Interesting",
    sourceUrl: "https://example.com/article",
    attachments: [],
    ...overrides,
  });

  it("creates and retrieves a card by ID", () => {
    const card = service.create(createInput());
    const loaded = service.getById(card.id);
    expect(loaded).toBeDefined();
    expect(loaded!.id).toBe(card.id);
    expect(loaded!.user_note).toBe("Interesting");
    expect(loaded!.source.url).toBe("https://example.com/article");
  });

  it("reads body content for a created card", () => {
    const card = service.create(createInput());
    const body = service.getBody(card.id);
    expect(body).toBe("# Test\n\nSome body text.");
  });

  it("lists all cards sorted by captured_at DESC", () => {
    const c1 = service.create(createInput());
    // Small delay to ensure distinct timestamps
    const c2 = service.create(createInput({ body: "Second card" }));
    const all = service.listAll();
    expect(all).toHaveLength(2);
    expect(all[0].id).toBe(c2.id);
    expect(all[1].id).toBe(c1.id);
  });

  it("searches cards via FTS", () => {
    const card = service.create(createInput({ body: "React hooks patterns" }));
    // Update to have meaningful searchable content in DB
    service.update(card.id, {
      sourceTitle: "React Patterns",
      aiSummary: "React hooks and patterns",
    });
    const results = service.search("React");
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.some(r => r.id === card.id)).toBe(true);
  });

  it("updates card fields", () => {
    const card = service.create(createInput());
    const updated = service.update(card.id, {
      userNote: "Updated note",
      sourceTitle: "New Title",
      aiTags: ["react", "design"],
    });
    expect(updated).toBeDefined();
    expect(updated!.user_note).toBe("Updated note");
    expect(updated!.source.title).toBe("New Title");
    expect(updated!.ai_tags).toEqual(["react", "design"]);
  });

  it("update returns null for missing card", () => {
    expect(service.update("nonexistent", { userNote: "nope" })).toBeNull();
  });

  it("filters cards by theme", () => {
    const card = service.create(createInput());
    service.update(card.id, { aiThemes: ["ui-design", "accessibility"] });
    const results = service.filterByTheme("design");
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe(card.id);
  });

  it("filters cards by tag", () => {
    const card = service.create(createInput());
    service.update(card.id, { aiTags: ["typescript", "react"] });
    const results = service.filterByTag("typescript");
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe(card.id);
  });
});
