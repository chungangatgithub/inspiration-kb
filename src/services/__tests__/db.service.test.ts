import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { DatabaseService } from "../db.service";
import type { CardRow, ConnectionRow } from "../db.service";

function tempDir(): string {
  const dir = path.join(os.tmpdir(), `kb-test-db-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

describe("DatabaseService", () => {
  let dataDir: string;
  let db: DatabaseService;

  beforeEach(() => {
    dataDir = tempDir();
    db = new DatabaseService(dataDir);
  });

  afterEach(() => {
    db.close();
    fs.rmSync(dataDir, { recursive: true, force: true });
  });

  const sampleCard = (overrides: Partial<CardRow> = {}): CardRow => ({
    id: "card-1",
    source_type: "webpage",
    source_title: "Test Article",
    source_url: "https://example.com/test",
    user_note: "Interesting read",
    ai_summary: "A summary of the article",
    ai_tags: JSON.stringify(["tech", "design"]),
    ai_themes: JSON.stringify(["innovation", "ux"]),
    format: "text",
    digestion_status: "done",
    captured_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    ...overrides,
  });

  it("upserts and retrieves a card", () => {
    db.upsertCard(sampleCard());
    const card = db.getCard("card-1");
    expect(card).toBeDefined();
    expect(card!.source_title).toBe("Test Article");
    expect(card!.ai_tags).toBe('["tech","design"]');
  });

  it("upsert updates an existing card", () => {
    db.upsertCard(sampleCard());
    db.upsertCard(sampleCard({ user_note: "Updated note", updated_at: "2025-02-01T00:00:00Z" }));
    const card = db.getCard("card-1");
    expect(card!.user_note).toBe("Updated note");
    expect(card!.updated_at).toBe("2025-02-01T00:00:00Z");
  });

  it("returns all cards ordered by captured_at DESC", () => {
    db.upsertCard(sampleCard({ id: "old", captured_at: "2024-01-01T00:00:00Z" }));
    db.upsertCard(sampleCard({ id: "new", captured_at: "2025-01-01T00:00:00Z" }));
    const all = db.getAllCards();
    expect(all).toHaveLength(2);
    expect(all[0].id).toBe("new");
    expect(all[1].id).toBe("old");
  });

  it("searches cards via FTS", () => {
    db.upsertCard(sampleCard({ id: "c1", source_title: "React Patterns" }));
    db.upsertCard(sampleCard({ id: "c2", source_title: "Vue Guide" }));
    const results = db.search("React");
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("c1");
  });

  it("filters by theme using LIKE", () => {
    db.upsertCard(sampleCard({ id: "c1", ai_themes: JSON.stringify(["ui-design"]) }));
    db.upsertCard(sampleCard({ id: "c2", ai_themes: JSON.stringify(["backend"]) }));
    const results = db.filterByTheme("design");
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("c1");
  });

  it("filters by tag using LIKE", () => {
    db.upsertCard(sampleCard({ id: "c1", ai_tags: JSON.stringify(["react"]) }));
    db.upsertCard(sampleCard({ id: "c2", ai_tags: JSON.stringify(["python"]) }));
    const results = db.filterByTag("react");
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("c1");
  });

  it("filters by source type exact match", () => {
    db.upsertCard(sampleCard({ id: "c1", source_type: "webpage" }));
    db.upsertCard(sampleCard({ id: "c2", source_type: "book" }));
    const results = db.filterByType("book");
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("c2");
  });

  it("upserts and retrieves connections", () => {
    const conn: ConnectionRow = { card_id: "c1", target_id: "c2", reason: "related topic", source: "ai" };
    db.upsertConnection(conn);
    const connections = db.getConnections("c1");
    expect(connections).toHaveLength(1);
    expect(connections[0].reason).toBe("related topic");
  });

  it("getConnections returns connections from either direction", () => {
    db.upsertConnection({ card_id: "c1", target_id: "c2", reason: "link", source: "ai" });
    const fromC1 = db.getConnections("c1");
    const fromC2 = db.getConnections("c2");
    expect(fromC1).toHaveLength(1);
    expect(fromC2).toHaveLength(1);
  });

  it("getAllConnections returns all", () => {
    db.upsertConnection({ card_id: "c1", target_id: "c2", reason: "a", source: "ai" });
    db.upsertConnection({ card_id: "c1", target_id: "c3", reason: "b", source: "user" });
    expect(db.getAllConnections()).toHaveLength(2);
  });
});
