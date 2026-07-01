export type SourceType =
  | "webpage"
  | "video"
  | "book"
  | "social_post"
  | "game"
  | "screenshot"
  | "thought";

export type MediaFormat = "text" | "image" | "video" | "audio" | "file";

export type DigestionStatus = "pending" | "processing" | "done" | "partial";

export interface Connection {
  cardId: string;
  reason: string;
  source: "ai" | "user";
}

export interface Attachment {
  filename: string;
  type: string;
  size: number;
}

export interface CardSource {
  url: string | null;
  type: SourceType | null;
  title: string | null;
  meta: Record<string, string> | null;
}

export interface Card {
  id: string;
  source: CardSource;
  captured_at: string;
  user_note: string | null;
  ai_tags: string[];
  ai_themes: string[];
  ai_summary: string | null;
  ai_review: string | null;
  user_review: string | null;
  connections: Connection[];
  attachments: Attachment[];
  format: MediaFormat;
  digestion_status: DigestionStatus;
  updated_at: string;
}

export interface AppConfig {
  dataDir: string;
  deepseekApiKey: string;
}

export interface SearchFilters {
  query?: string;
  theme?: string;
  tag?: string;
  type?: SourceType;
  dateFrom?: string;
  dateTo?: string;
}
