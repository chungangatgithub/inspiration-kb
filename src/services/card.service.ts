import { randomUUID } from "node:crypto";
import { FileService } from "./file.service";
import { DatabaseService } from "./db.service";
import type { CardRow } from "./db.service";
import type { Card, CardSource, Connection, Attachment } from "@/types/card";

export interface CardCreateInput {
  body: string;
  userNote: string | null;
  sourceUrl: string | null;
  attachments: { sourcePath: string; filename: string }[];
}

export interface CardUpdateInput {
  userNote?: string | null;
  sourceUrl?: string | null;
  sourceTitle?: string | null;
  sourceType?: CardSource["type"];
  body?: string;
  aiTags?: string[];
  aiThemes?: string[];
  aiSummary?: string | null;
  format?: Card["format"];
  digestionStatus?: Card["digestion_status"];
  connections?: Connection[];
  attachments?: Attachment[];
}

function nowISO(): string {
  return new Date().toISOString();
}

function cardToRow(card: Card): CardRow {
  return {
    id: card.id,
    source_type: card.source.type,
    source_title: card.source.title,
    source_url: card.source.url,
    user_note: card.user_note,
    ai_summary: card.ai_summary,
    ai_tags: JSON.stringify(card.ai_tags),
    ai_themes: JSON.stringify(card.ai_themes),
    format: card.format,
    digestion_status: card.digestion_status,
    captured_at: card.captured_at,
    updated_at: card.updated_at,
  };
}

export class CardService {
  private fileService: FileService;
  private dbService: DatabaseService;

  constructor(dataDir: string) {
    this.fileService = new FileService(dataDir);
    this.dbService = new DatabaseService(dataDir);
  }

  create(input: CardCreateInput): Card {
    const id = randomUUID();
    const now = nowISO();

    const source: CardSource = {
      url: input.sourceUrl,
      type: null,
      title: null,
      meta: null,
    };

    const card: Card = {
      id,
      source,
      captured_at: now,
      user_note: input.userNote,
      ai_tags: [],
      ai_themes: [],
      ai_summary: null,
      ai_review: null,
      user_review: null,
      connections: [],
      attachments: [],
      format: "text",
      digestion_status: "pending",
      updated_at: now,
    };

    // Write files
    this.fileService.writeCard(card);
    this.fileService.writeBody(id, input.body);

    // Copy attachments
    for (const att of input.attachments) {
      this.fileService.copyAttachment(id, att.sourcePath, att.filename);
    }

    // Upsert to DB
    this.dbService.upsertCard(cardToRow(card));

    return card;
  }

  getById(id: string): Card | null {
    return this.fileService.readCard(id);
  }

  getBody(id: string): string {
    return this.fileService.readBody(id);
  }

  listAll(): Card[] {
    const ids = this.fileService.listCardIds();
    const cards: Card[] = [];
    for (const id of ids) {
      const card = this.fileService.readCard(id);
      if (card) cards.push(card);
    }
    cards.sort((a, b) => b.captured_at.localeCompare(a.captured_at));
    return cards;
  }

  update(id: string, input: CardUpdateInput): Card | null {
    const card = this.fileService.readCard(id);
    if (!card) return null;

    if (input.userNote !== undefined) card.user_note = input.userNote;
    if (input.sourceUrl !== undefined) card.source.url = input.sourceUrl;
    if (input.sourceTitle !== undefined) card.source.title = input.sourceTitle;
    if (input.sourceType !== undefined) card.source.type = input.sourceType;
    if (input.body !== undefined) this.fileService.writeBody(id, input.body);
    if (input.aiTags !== undefined) card.ai_tags = input.aiTags;
    if (input.aiThemes !== undefined) card.ai_themes = input.aiThemes;
    if (input.aiSummary !== undefined) card.ai_summary = input.aiSummary;
    if (input.format !== undefined) card.format = input.format;
    if (input.digestionStatus !== undefined) card.digestion_status = input.digestionStatus;
    if (input.connections !== undefined) card.connections = input.connections;
    if (input.attachments !== undefined) card.attachments = input.attachments;

    card.updated_at = nowISO();

    // Write updated card
    this.fileService.writeCard(card);

    // Sync DB
    this.dbService.upsertCard(cardToRow(card));

    // Sync connections
    if (input.connections !== undefined) {
      for (const conn of card.connections) {
        this.dbService.upsertConnection({
          card_id: id,
          target_id: conn.cardId,
          reason: conn.reason,
          source: conn.source,
        });
      }
    }

    return card;
  }

  search(query: string): Card[] {
    const rows = this.dbService.search(query);
    return rows.map(r => this.fileService.readCard(r.id)).filter(Boolean) as Card[];
  }

  filterByTheme(theme: string): Card[] {
    const rows = this.dbService.filterByTheme(theme);
    return rows.map(r => this.fileService.readCard(r.id)).filter(Boolean) as Card[];
  }

  filterByTag(tag: string): Card[] {
    const rows = this.dbService.filterByTag(tag);
    return rows.map(r => this.fileService.readCard(r.id)).filter(Boolean) as Card[];
  }

  close(): void {
    this.dbService.close();
  }
}
