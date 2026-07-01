import * as fs from "fs";
import * as path from "path";
import type { Card } from "@/types/card";

export class FileService {
  private dataDir: string;
  private cardsDir: string;

  constructor(dataDir: string) {
    this.dataDir = dataDir;
    this.cardsDir = path.join(dataDir, "cards");
    fs.mkdirSync(this.cardsDir, { recursive: true });
  }

  cardDir(cardId: string): string {
    return path.join(this.cardsDir, cardId);
  }

  ensureCardDir(cardId: string): string {
    const dir = this.cardDir(cardId);
    fs.mkdirSync(dir, { recursive: true });
    return dir;
  }

  getAttachmentsDir(cardId: string): string {
    const dir = path.join(this.cardDir(cardId), "attachments");
    fs.mkdirSync(dir, { recursive: true });
    return dir;
  }

  writeCard(card: Card): void {
    const dir = this.ensureCardDir(card.id);
    const filePath = path.join(dir, "card.json");
    fs.writeFileSync(filePath, JSON.stringify(card, null, 2), "utf-8");
  }

  readCard(cardId: string): Card | null {
    const filePath = path.join(this.cardDir(cardId), "card.json");
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as Card;
  }

  writeBody(cardId: string, content: string): void {
    this.ensureCardDir(cardId);
    const filePath = path.join(this.cardDir(cardId), "body.md");
    fs.writeFileSync(filePath, content, "utf-8");
  }

  readBody(cardId: string): string {
    const filePath = path.join(this.cardDir(cardId), "body.md");
    if (!fs.existsSync(filePath)) return "";
    return fs.readFileSync(filePath, "utf-8");
  }

  listCardIds(): string[] {
    return fs.readdirSync(this.cardsDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);
  }

  copyAttachment(cardId: string, sourcePath: string, filename: string): string {
    const destDir = this.getAttachmentsDir(cardId);
    const destPath = path.join(destDir, filename);
    fs.copyFileSync(sourcePath, destPath);
    return destPath;
  }
}
