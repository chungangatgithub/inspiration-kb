import Database from "better-sqlite3";
import * as path from "path";
import * as fs from "fs";

export interface CardRow {
  id: string;
  source_type: string | null;
  source_title: string | null;
  source_url: string | null;
  user_note: string | null;
  ai_summary: string | null;
  ai_tags: string;
  ai_themes: string;
  format: string;
  digestion_status: string;
  captured_at: string;
  updated_at: string;
}

export interface ConnectionRow {
  card_id: string;
  target_id: string;
  reason: string;
  source: "ai" | "user";
}

export class DatabaseService {
  private db: Database.Database;

  constructor(dataDir: string) {
    fs.mkdirSync(dataDir, { recursive: true });
    const dbPath = path.join(dataDir, "cards.db");
    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");
    this.initTables();
  }

  initTables(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS cards (
        id TEXT PRIMARY KEY,
        source_type TEXT,
        source_title TEXT,
        source_url TEXT,
        user_note TEXT,
        ai_summary TEXT,
        ai_tags TEXT DEFAULT '[]',
        ai_themes TEXT DEFAULT '[]',
        format TEXT DEFAULT 'text',
        digestion_status TEXT DEFAULT 'pending',
        captured_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE VIRTUAL TABLE IF NOT EXISTS cards_fts USING fts5(
        source_title,
        source_url,
        user_note,
        ai_summary,
        ai_tags,
        ai_themes
      );

      CREATE TABLE IF NOT EXISTS connections (
        card_id TEXT NOT NULL,
        target_id TEXT NOT NULL,
        reason TEXT NOT NULL DEFAULT '',
        source TEXT NOT NULL DEFAULT 'ai',
        PRIMARY KEY (card_id, target_id)
      );
    `);
  }

  upsertCard(row: CardRow): void {
    const existing = this.db.prepare("SELECT rowid FROM cards WHERE id = ?").get(row.id) as { rowid: number } | undefined;

    const stmt = this.db.prepare(`
      INSERT INTO cards (id, source_type, source_title, source_url, user_note, ai_summary, ai_tags, ai_themes, format, digestion_status, captured_at, updated_at)
      VALUES (@id, @source_type, @source_title, @source_url, @user_note, @ai_summary, @ai_tags, @ai_themes, @format, @digestion_status, @captured_at, @updated_at)
      ON CONFLICT(id) DO UPDATE SET
        source_type = @source_type,
        source_title = @source_title,
        source_url = @source_url,
        user_note = @user_note,
        ai_summary = @ai_summary,
        ai_tags = @ai_tags,
        ai_themes = @ai_themes,
        format = @format,
        digestion_status = @digestion_status,
        updated_at = @updated_at
    `);
    stmt.run(row);

    // Sync FTS index: remove old entry, insert new one
    if (existing) {
      this.db.prepare("DELETE FROM cards_fts WHERE rowid = ?").run(existing.rowid);
    }
    const current = this.db.prepare("SELECT rowid FROM cards WHERE id = ?").get(row.id) as { rowid: number };
    this.db.prepare("INSERT INTO cards_fts(rowid, source_title, source_url, user_note, ai_summary, ai_tags, ai_themes) VALUES(?, ?, ?, ?, ?, ?, ?)")
      .run(current.rowid, row.source_title, row.source_url, row.user_note, row.ai_summary, row.ai_tags, row.ai_themes);
  }

  getCard(id: string): CardRow | undefined {
    return this.db.prepare("SELECT * FROM cards WHERE id = ?").get(id) as CardRow | undefined;
  }

  getAllCards(): CardRow[] {
    return this.db.prepare("SELECT * FROM cards ORDER BY captured_at DESC").all() as CardRow[];
  }

  search(query: string): CardRow[] {
    return this.db.prepare(`
      SELECT c.* FROM cards c
      JOIN cards_fts fts ON c.rowid = fts.rowid
      WHERE cards_fts MATCH ?
      ORDER BY rank
      LIMIT 50
    `).all(query) as CardRow[];
  }

  filterByTheme(theme: string): CardRow[] {
    return this.db.prepare("SELECT * FROM cards WHERE ai_themes LIKE ? ORDER BY captured_at DESC")
      .all(`%${theme}%`) as CardRow[];
  }

  filterByTag(tag: string): CardRow[] {
    return this.db.prepare("SELECT * FROM cards WHERE ai_tags LIKE ? ORDER BY captured_at DESC")
      .all(`%${tag}%`) as CardRow[];
  }

  filterByType(type: string): CardRow[] {
    return this.db.prepare("SELECT * FROM cards WHERE source_type = ? ORDER BY captured_at DESC")
      .all(type) as CardRow[];
  }

  upsertConnection(conn: ConnectionRow): void {
    this.db.prepare(`
      INSERT INTO connections (card_id, target_id, reason, source)
      VALUES (@card_id, @target_id, @reason, @source)
      ON CONFLICT(card_id, target_id) DO UPDATE SET
        reason = @reason,
        source = @source
    `).run(conn);
  }

  getConnections(cardId: string): ConnectionRow[] {
    return this.db.prepare(
      "SELECT * FROM connections WHERE card_id = ? OR target_id = ?"
    ).all(cardId, cardId) as ConnectionRow[];
  }

  getAllConnections(): ConnectionRow[] {
    return this.db.prepare("SELECT * FROM connections").all() as ConnectionRow[];
  }

  close(): void {
    this.db.close();
  }
}
