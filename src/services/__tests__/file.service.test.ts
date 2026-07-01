import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { FileService } from "../file.service";
import type { Card } from "@/types/card";

function tempDir(): string {
  const dir = path.join(os.tmpdir(), `kb-test-file-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function sampleCard(id: string): Card {
  return {
    id,
    source: { url: "https://example.com", type: "webpage", title: "Test", meta: null },
    captured_at: "2025-01-01T00:00:00Z",
    user_note: "A note",
    ai_tags: ["tech"],
    ai_themes: ["design"],
    ai_summary: "Summary text",
    ai_review: null,
    user_review: null,
    connections: [],
    attachments: [],
    format: "text",
    digestion_status: "done",
    updated_at: "2025-01-01T00:00:00Z",
  };
}

describe("FileService", () => {
  let dataDir: string;
  let service: FileService;

  beforeEach(() => {
    dataDir = tempDir();
    service = new FileService(dataDir);
  });

  afterEach(() => {
    fs.rmSync(dataDir, { recursive: true, force: true });
  });

  it("writes and reads a card", () => {
    const card = sampleCard("card-1");
    service.writeCard(card);
    const loaded = service.readCard("card-1");
    expect(loaded).toBeDefined();
    expect(loaded!.id).toBe("card-1");
    expect(loaded!.source.title).toBe("Test");
    expect(loaded!.user_note).toBe("A note");
  });

  it("returns null for missing card", () => {
    expect(service.readCard("nonexistent")).toBeNull();
  });

  it("writes and reads body content", () => {
    service.writeBody("card-1", "# Hello\n\nThis is body content.");
    const body = service.readBody("card-1");
    expect(body).toBe("# Hello\n\nThis is body content.");
  });

  it("returns empty string for missing body", () => {
    expect(service.readBody("nonexistent")).toBe("");
  });

  it("lists all card IDs", () => {
    service.ensureCardDir("card-a");
    service.ensureCardDir("card-b");
    service.ensureCardDir("card-c");
    const ids = service.listCardIds();
    expect(ids).toHaveLength(3);
    expect(ids).toContain("card-a");
    expect(ids).toContain("card-b");
    expect(ids).toContain("card-c");
  });

  it("copies an attachment file", () => {
    const srcDir = path.join(dataDir, "temp-src");
    fs.mkdirSync(srcDir, { recursive: true });
    const srcFile = path.join(srcDir, "test.png");
    fs.writeFileSync(srcFile, "fake png data");

    const destPath = service.copyAttachment("card-1", srcFile, "test.png");
    expect(fs.existsSync(destPath)).toBe(true);
    expect(fs.readFileSync(destPath, "utf-8")).toBe("fake png data");
    expect(destPath).toContain("attachments/test.png");
  });
});
