# 灵感知识库 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a cross-platform inspiration capture and knowledge organization tool with AI-powered digestion pipeline, local-first file storage, and a unified canvas/graph browsing experience.

**Architecture:** Electron-shelled Next.js web app with two routes (`/capture` and `/canvas`). Data stored as local files (JSON + Markdown + attachments) with SQLite for indexing and FTS. AI digestion via DeepSeek API as a fixed 6-step pipeline. Cross-device sync via external file sync tools.

**Tech Stack:** Electron, Next.js (App Router), React Flow, better-sqlite3, Zustand, Tailwind CSS, DeepSeek API, pnpm

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `next.config.js`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`, `.gitignore`

**Step 1: Initialize pnpm project with Next.js**

```bash
cd inspiration-kb
pnpm init
pnpm add next@latest react@latest react-dom@latest
pnpm add -D typescript @types/react @types/node tailwindcss postcss autoprefixer
```

**Step 2: Create next.config.js**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  transpilePackages: ['better-sqlite3'],
};
module.exports = nextConfig;
```

**Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "preserve",
    "paths": { "@/*": ["./src/*"] },
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules", "electron"]
}
```

**Step 4: Create tailwind.config.ts**

```typescript
import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
};
export default config;
```

**Step 5: Create .gitignore**

```
node_modules/
.next/
out/
dist/
*.db
.DS_Store
```

**Step 6: Install deps and verify build**

```bash
pnpm install
pnpm next build
```

Expected: build succeeds with empty app.

**Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js project with TypeScript and Tailwind"
```

---

### Task 2: Type Definitions

**Files:**
- Create: `src/types/card.ts`

**Step 1: Write card type definitions**

```typescript
// src/types/card.ts

export type SourceType =
  | 'webpage'
  | 'video'
  | 'book'
  | 'social_post'
  | 'game'
  | 'screenshot'
  | 'thought';

export type MediaFormat = 'text' | 'image' | 'video' | 'audio' | 'file';

export type DigestionStatus = 'pending' | 'processing' | 'done' | 'partial';

export interface Connection {
  cardId: string;
  reason: string;
  source: 'ai' | 'user';
}

export interface Attachment {
  filename: string;
  type: string; // MIME type
  size: number; // bytes
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
```

**Step 2: Verify TypeScript compilation**

```bash
pnpm tsc --noEmit
```

Expected: no errors.

**Step 3: Commit**

```bash
git add src/types/card.ts
git commit -m "feat: add card and config type definitions"
```

---

### Task 3: Config Management

**Files:**
- Create: `src/lib/config.ts`
- Test: `src/lib/__tests__/config.test.ts`

**Step 1: Install vitest**

```bash
pnpm add -D vitest @types/node
```

**Step 2: Write failing test**

```typescript
// src/lib/__tests__/config.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';

// We test the config module by importing after setup
describe('Config', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'insp-kb-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('loads default config when no config file exists', async () => {
    // Will import and test after implementation
  });

  it('loads config from existing config file', async () => {
    // Will implement after base
  });

  it('saves config to file', async () => {
    // Will implement after base
  });
});
```

**Step 3: Implement config module**

```typescript
// src/lib/config.ts
import fs from 'fs';
import path from 'path';
import os from 'os';
import type { AppConfig } from '@/types/card';

const CONFIG_FILENAME = 'config.json';

function getDefaultDataDir(): string {
  return path.join(os.homedir(), 'inspiration-kb-data');
}

function getDefaultConfig(): AppConfig {
  return {
    dataDir: getDefaultDataDir(),
    deepseekApiKey: '',
  };
}

export function getConfigPath(): string {
  return path.join(getDefaultDataDir(), CONFIG_FILENAME);
}

export function loadConfig(): AppConfig {
  const configPath = getConfigPath();
  if (!fs.existsSync(configPath)) {
    const defaultConfig = getDefaultConfig();
    ensureDataDir(defaultConfig.dataDir);
    saveConfig(defaultConfig);
    return defaultConfig;
  }
  const raw = fs.readFileSync(configPath, 'utf-8');
  return JSON.parse(raw) as AppConfig;
}

export function saveConfig(config: AppConfig): void {
  ensureDataDir(config.dataDir);
  fs.writeFileSync(getConfigPath(), JSON.stringify(config, null, 2), 'utf-8');
}

function ensureDataDir(dataDir: string): void {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}
```

**Step 4: Write actual tests**

Update `src/lib/__tests__/config.test.ts` with real tests using the module. Test that `loadConfig` returns defaults when no file exists, that `saveConfig` writes valid JSON, and that subsequent `loadConfig` reads it back.

**Step 5: Run tests**

```bash
pnpm vitest run src/lib/__tests__/config.test.ts
```

Expected: 3 tests pass.

**Step 6: Commit**

```bash
git add src/lib/config.ts src/lib/__tests__/config.test.ts
git commit -m "feat: add config management with JSON file persistence"
```

---

### Task 4: SQLite Database Setup

**Files:**
- Create: `src/services/db.service.ts`
- Test: `src/services/__tests__/db.service.test.ts`

**Step 1: Install better-sqlite3**

```bash
pnpm add better-sqlite3
pnpm add -D @types/better-sqlite3
```

**Step 2: Write failing test**

```typescript
// src/services/__tests__/db.service.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseService } from '../db.service';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('DatabaseService', () => {
  let tmpDir: string;
  let db: DatabaseService;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'insp-kb-db-'));
    db = new DatabaseService(tmpDir);
  });

  afterEach(() => {
    db.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('creates tables on init', () => {
    const tables = db.db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table'"
    ).all() as { name: string }[];
    const names = tables.map(t => t.name);
    expect(names).toContain('cards');
    expect(names).toContain('connections');
  });

  it('inserts and queries a card', () => {
    db.upsertCard({
      id: 'test-1',
      source_type: 'webpage',
      source_title: 'Test Title',
      source_url: 'https://example.com',
      user_note: 'cool idea',
      ai_summary: 'A test card',
      ai_tags: '["design","ui"]',
      ai_themes: '["visual"]',
      format: 'text',
      digestion_status: 'done',
      captured_at: '2026-07-01T00:00:00Z',
      updated_at: '2026-07-01T00:00:00Z',
    });

    const card = db.getCard('test-1');
    expect(card).not.toBeNull();
    expect(card!.source_title).toBe('Test Title');
  });

  it('searches cards via FTS', () => {
    db.upsertCard({
      id: 'test-2',
      source_type: 'book',
      source_title: 'Design Patterns',
      source_url: null,
      user_note: 'chapter on observer pattern',
      ai_summary: 'Observer pattern explained',
      ai_tags: '["programming"]',
      ai_themes: '["architecture"]',
      format: 'text',
      digestion_status: 'done',
      captured_at: '2026-07-01T00:00:00Z',
      updated_at: '2026-07-01T00:00:00Z',
    });

    const results = db.search('observer');
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].id).toBe('test-2');
  });
});
```

**Step 3: Implement DatabaseService**

```typescript
// src/services/db.service.ts
import Database from 'better-sqlite3';
import path from 'path';

interface CardRow {
  id: string;
  source_type: string | null;
  source_title: string | null;
  source_url: string | null;
  user_note: string | null;
  ai_summary: string | null;
  ai_tags: string | null;
  ai_themes: string | null;
  format: string;
  digestion_status: string;
  captured_at: string;
  updated_at: string;
}

interface ConnectionRow {
  card_id: string;
  target_id: string;
  reason: string;
  source: string;
}

export class DatabaseService {
  db: Database.Database;

  constructor(dataDir: string) {
    const dbPath = path.join(dataDir, 'cards.db');
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.initTables();
  }

  private initTables(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS cards (
        id TEXT PRIMARY KEY,
        source_type TEXT,
        source_title TEXT,
        source_url TEXT,
        user_note TEXT,
        ai_summary TEXT,
        ai_tags TEXT,
        ai_themes TEXT,
        format TEXT NOT NULL DEFAULT 'text',
        digestion_status TEXT NOT NULL DEFAULT 'pending',
        captured_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE VIRTUAL TABLE IF NOT EXISTS cards_fts USING fts5(
        id UNINDEXED,
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
        reason TEXT NOT NULL,
        source TEXT NOT NULL DEFAULT 'ai',
        PRIMARY KEY (card_id, target_id)
      );
    `);
  }

  upsertCard(row: CardRow): void {
    const stmt = this.db.prepare(`
      INSERT INTO cards (id, source_type, source_title, source_url, user_note,
        ai_summary, ai_tags, ai_themes, format, digestion_status, captured_at, updated_at)
      VALUES (@id, @source_type, @source_title, @source_url, @user_note,
        @ai_summary, @ai_tags, @ai_themes, @format, @digestion_status, @captured_at, @updated_at)
      ON CONFLICT(id) DO UPDATE SET
        source_type=excluded.source_type, source_title=excluded.source_title,
        source_url=excluded.source_url, user_note=excluded.user_note,
        ai_summary=excluded.ai_summary, ai_tags=excluded.ai_tags,
        ai_themes=excluded.ai_themes, format=excluded.format,
        digestion_status=excluded.digestion_status, updated_at=excluded.updated_at
    `);
    stmt.run(row);

    // Update FTS
    this.db.prepare('DELETE FROM cards_fts WHERE id = ?').run(row.id);
    this.db.prepare(`
      INSERT INTO cards_fts (id, source_title, source_url, user_note, ai_summary, ai_tags, ai_themes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(row.id, row.source_title, row.source_url, row.user_note, row.ai_summary, row.ai_tags, row.ai_themes);
  }

  getCard(id: string): CardRow | undefined {
    return this.db.prepare('SELECT * FROM cards WHERE id = ?').get(id) as CardRow | undefined;
  }

  getAllCards(): CardRow[] {
    return this.db.prepare('SELECT * FROM cards ORDER BY captured_at DESC').all() as CardRow[];
  }

  search(query: string): CardRow[] {
    return this.db.prepare(`
      SELECT c.* FROM cards c
      INNER JOIN cards_fts f ON c.id = f.id
      WHERE cards_fts MATCH ?
      ORDER BY rank
      LIMIT 50
    `).all(query) as CardRow[];
  }

  filterByTheme(theme: string): CardRow[] {
    return this.db.prepare(
      "SELECT * FROM cards WHERE ai_themes LIKE ? ORDER BY captured_at DESC"
    ).all(`%${theme}%`) as CardRow[];
  }

  filterByTag(tag: string): CardRow[] {
    return this.db.prepare(
      "SELECT * FROM cards WHERE ai_tags LIKE ? ORDER BY captured_at DESC"
    ).all(`%${tag}%`) as CardRow[];
  }

  filterByType(type: string): CardRow[] {
    return this.db.prepare(
      'SELECT * FROM cards WHERE source_type = ? ORDER BY captured_at DESC'
    ).all(type) as CardRow[];
  }

  upsertConnection(conn: ConnectionRow): void {
    this.db.prepare(`
      INSERT INTO connections (card_id, target_id, reason, source)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(card_id, target_id) DO UPDATE SET
        reason=excluded.reason, source=excluded.source
    `).run(conn.card_id, conn.target_id, conn.reason, conn.source);
  }

  getConnections(cardId: string): ConnectionRow[] {
    return this.db.prepare(
      'SELECT * FROM connections WHERE card_id = ?'
    ).all(cardId) as ConnectionRow[];
  }

  getAllConnections(): ConnectionRow[] {
    return this.db.prepare('SELECT * FROM connections').all() as ConnectionRow[];
  }

  close(): void {
    this.db.close();
  }
}
```

**Step 4: Run tests**

```bash
pnpm vitest run src/services/__tests__/db.service.test.ts
```

Expected: all tests pass.

**Step 5: Commit**

```bash
git add src/services/db.service.ts src/services/__tests__/db.service.test.ts
git commit -m "feat: add SQLite database service with FTS and connections"
```

---

### Task 5: File Service

**Files:**
- Create: `src/services/file.service.ts`
- Test: `src/services/__tests__/file.service.test.ts`

**Step 1: Write failing test**

```typescript
// src/services/__tests__/file.service.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FileService } from '../file.service';
import fs from 'fs';
import path from 'path';
import os from 'os';
import type { Card } from '@/types/card';

describe('FileService', () => {
  let tmpDir: string;
  let fileService: FileService;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'insp-kb-fs-'));
    fileService = new FileService(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  const makeCard = (id: string): Card => ({
    id,
    source: { url: null, type: null, title: null, meta: null },
    captured_at: new Date().toISOString(),
    user_note: 'test note',
    ai_tags: [],
    ai_themes: [],
    ai_summary: null,
    ai_review: null,
    user_review: null,
    connections: [],
    attachments: [],
    format: 'text',
    digestion_status: 'pending',
    updated_at: new Date().toISOString(),
  });

  it('writes and reads a card', () => {
    const card = makeCard('test-card-1');
    fileService.writeCard(card);
    fileService.writeBody('test-card-1', '# Hello');

    const read = fileService.readCard('test-card-1');
    expect(read).not.toBeNull();
    expect(read!.user_note).toBe('test note');

    const body = fileService.readBody('test-card-1');
    expect(body).toBe('# Hello');
  });

  it('lists all card IDs', () => {
    fileService.writeCard(makeCard('a'));
    fileService.writeCard(makeCard('b'));
    const ids = fileService.listCardIds();
    expect(ids).toContain('a');
    expect(ids).toContain('b');
  });

  it('creates attachments directory', () => {
    const dir = fileService.getAttachmentsDir('card-1');
    fileService.writeCard(makeCard('card-1'));
    expect(fs.existsSync(dir)).toBe(true);
  });
});
```

**Step 2: Implement FileService**

```typescript
// src/services/file.service.ts
import fs from 'fs';
import path from 'path';
import type { Card } from '@/types/card';

const CARDS_DIR = 'cards';
const CARD_JSON = 'card.json';
const BODY_MD = 'body.md';
const ATTACHMENTS_DIR = 'attachments';

export class FileService {
  private cardsPath: string;

  constructor(dataDir: string) {
    this.cardsPath = path.join(dataDir, CARDS_DIR);
    if (!fs.existsSync(this.cardsPath)) {
      fs.mkdirSync(this.cardsPath, { recursive: true });
    }
  }

  private cardDir(cardId: string): string {
    return path.join(this.cardsPath, cardId);
  }

  private ensureCardDir(cardId: string): string {
    const dir = this.cardDir(cardId);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  }

  getAttachmentsDir(cardId: string): string {
    const dir = path.join(this.ensureCardDir(cardId), ATTACHMENTS_DIR);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  }

  writeCard(card: Card): void {
    const dir = this.ensureCardDir(card.id);
    const filePath = path.join(dir, CARD_JSON);
    fs.writeFileSync(filePath, JSON.stringify(card, null, 2), 'utf-8');
  }

  readCard(cardId: string): Card | null {
    const filePath = path.join(this.cardDir(cardId), CARD_JSON);
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as Card;
  }

  writeBody(cardId: string, content: string): void {
    this.ensureCardDir(cardId);
    const filePath = path.join(this.cardDir(cardId), BODY_MD);
    fs.writeFileSync(filePath, content, 'utf-8');
  }

  readBody(cardId: string): string {
    const filePath = path.join(this.cardDir(cardId), BODY_MD);
    if (!fs.existsSync(filePath)) return '';
    return fs.readFileSync(filePath, 'utf-8');
  }

  listCardIds(): string[] {
    if (!fs.existsSync(this.cardsPath)) return [];
    return fs.readdirSync(this.cardsPath, { withFileTypes: true })
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
```

**Step 3: Run tests**

```bash
pnpm vitest run src/services/__tests__/file.service.test.ts
```

Expected: all tests pass.

**Step 4: Commit**

```bash
git add src/services/file.service.ts src/services/__tests__/file.service.test.ts
git commit -m "feat: add file service for card persistence"
```

---

### Task 6: Card Service

**Files:**
- Create: `src/services/card.service.ts`
- Test: `src/services/__tests__/card.service.test.ts`

**Step 1: Write test**

The card service orchestrates FileService + DatabaseService. Test creating a card (writes file + inserts DB), reading, updating, and deleting.

```typescript
// src/services/__tests__/card.service.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CardService } from '../card.service';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('CardService', () => {
  let tmpDir: string;
  let cardService: CardService;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'insp-kb-cs-'));
    cardService = new CardService(tmpDir);
  });

  afterEach(() => {
    cardService.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('creates a card with file and db entry', () => {
    const card = cardService.create({
      body: 'Some inspiration text',
      userNote: 'Great idea about combat systems',
      sourceUrl: 'https://example.com/post',
      attachments: [],
    });

    expect(card.id).toBeDefined();
    expect(card.digestion_status).toBe('pending');
    expect(card.user_note).toBe('Great idea about combat systems');

    // Verify file exists
    const filePath = path.join(tmpDir, 'cards', card.id, 'card.json');
    expect(fs.existsSync(filePath)).toBe(true);

    // Verify DB entry
    const fromDb = cardService.getById(card.id);
    expect(fromDb).not.toBeNull();
  });

  it('updates a card', () => {
    const card = cardService.create({
      body: 'Original',
      userNote: null,
      sourceUrl: null,
      attachments: [],
    });

    cardService.update(card.id, {
      ai_tags: ['combat', 'design'],
      ai_summary: 'A combat design idea',
      digestion_status: 'done',
    });

    const updated = cardService.getById(card.id);
    expect(updated!.ai_tags).toEqual(['combat', 'design']);
    expect(updated!.digestion_status).toBe('done');
  });

  it('lists all cards', () => {
    cardService.create({ body: 'A', userNote: null, sourceUrl: null, attachments: [] });
    cardService.create({ body: 'B', userNote: null, sourceUrl: null, attachments: [] });
    const all = cardService.listAll();
    expect(all.length).toBe(2);
  });
});
```

**Step 2: Implement CardService**

```typescript
// src/services/card.service.ts
import { randomUUID } from 'crypto';
import type { Card, Connection } from '@/types/card';
import { FileService } from './file.service';
import { DatabaseService } from './db.service';

interface CreateCardInput {
  body: string;
  userNote: string | null;
  sourceUrl: string | null;
  attachments: { sourcePath: string; filename: string }[];
}

interface UpdateCardInput {
  source_type?: string | null;
  source_title?: string | null;
  source_meta?: Record<string, string> | null;
  user_note?: string | null;
  user_review?: string | null;
  ai_tags?: string[];
  ai_themes?: string[];
  ai_summary?: string | null;
  connections?: Connection[];
  format?: string;
  digestion_status?: string;
}

export class CardService {
  private fileService: FileService;
  private db: DatabaseService;

  constructor(dataDir: string) {
    this.fileService = new FileService(dataDir);
    this.db = new DatabaseService(dataDir);
  }

  create(input: CreateCardInput): Card {
    const id = randomUUID();
    const now = new Date().toISOString();

    const card: Card = {
      id,
      source: {
        url: input.sourceUrl,
        type: null,
        title: null,
        meta: null,
      },
      captured_at: now,
      user_note: input.userNote,
      ai_tags: [],
      ai_themes: [],
      ai_summary: null,
      ai_review: null,
      user_review: null,
      connections: [],
      attachments: [],
      format: 'text',
      digestion_status: 'pending',
      updated_at: now,
    };

    // Write files
    this.fileService.writeCard(card);
    this.fileService.writeBody(id, input.body);

    // Copy attachments
    for (const att of input.attachments) {
      this.fileService.copyAttachment(id, att.sourcePath, att.filename);
    }

    // Write to SQLite
    this.db.upsertCard({
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
    });

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
    return ids
      .map(id => this.fileService.readCard(id))
      .filter((c): c is Card => c !== null)
      .sort((a, b) => b.captured_at.localeCompare(a.captured_at));
  }

  update(id: string, input: UpdateCardInput): Card | null {
    const card = this.fileService.readCard(id);
    if (!card) return null;

    const now = new Date().toISOString();

    if (input.source_type !== undefined) card.source.type = input.source_type;
    if (input.source_title !== undefined) card.source.title = input.source_title;
    if (input.source_meta !== undefined) card.source.meta = input.source_meta;
    if (input.user_note !== undefined) card.user_note = input.user_note;
    if (input.user_review !== undefined) card.user_review = input.user_review;
    if (input.ai_tags !== undefined) card.ai_tags = input.ai_tags;
    if (input.ai_themes !== undefined) card.ai_themes = input.ai_themes;
    if (input.ai_summary !== undefined) card.ai_summary = input.ai_summary;
    if (input.connections !== undefined) card.connections = input.connections;
    if (input.format !== undefined) card.format = input.format as Card['format'];
    if (input.digestion_status !== undefined) card.digestion_status = input.digestion_status as Card['digestion_status'];
    card.updated_at = now;

    this.fileService.writeCard(card);

    // Sync connections to DB
    if (input.connections !== undefined) {
      for (const conn of input.connections) {
        this.db.upsertConnection({
          card_id: id,
          target_id: conn.cardId,
          reason: conn.reason,
          source: conn.source,
        });
      }
    }

    this.db.upsertCard({
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
    });

    return card;
  }

  search(query: string): Card[] {
    const rows = this.db.search(query);
    return rows.map(r => this.fileService.readCard(r.id)).filter((c): c is Card => c !== null);
  }

  filterByTheme(theme: string): Card[] {
    const rows = this.db.filterByTheme(theme);
    return rows.map(r => this.fileService.readCard(r.id)).filter((c): c is Card => c !== null);
  }

  filterByTag(tag: string): Card[] {
    const rows = this.db.filterByTag(tag);
    return rows.map(r => this.fileService.readCard(r.id)).filter((c): c is Card => c !== null);
  }

  close(): void {
    this.db.close();
  }
}
```

**Step 3: Run tests**

```bash
pnpm vitest run src/services/__tests__/card.service.test.ts
```

Expected: all tests pass.

**Step 4: Commit**

```bash
git add src/services/card.service.ts src/services/__tests__/card.service.test.ts
git commit -m "feat: add card service orchestrating file and DB layers"
```

---

### Task 7: DeepSeek Client

**Files:**
- Create: `src/services/deepseek.client.ts`
- Test: `src/services/__tests__/deepseek.client.test.ts`

**Step 1: Install openai SDK**

```bash
pnpm add openai
```

**Step 2: Write test**

Test that the client configures the correct baseURL and that `chat()` returns the expected shape. Use a mock or test with a dummy key that verifies the request shape without making real API calls.

**Step 3: Implement**

```typescript
// src/services/deepseek.client.ts
import OpenAI from 'openai';

export class DeepSeekClient {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey,
      baseURL: 'https://api.deepseek.com',
    });
  }

  async chat(systemPrompt: string, userMessage: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.3,
      max_tokens: 1024,
    });

    return response.choices[0]?.message?.content ?? '';
  }

  async chatMultiModal(
    systemPrompt: string,
    textContent: string,
    imageBase64: string
  ): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: textContent },
            { type: 'image_url', image_url: { url: `data:image/png;base64,${imageBase64}` } },
          ],
        },
      ],
      temperature: 0.3,
      max_tokens: 1024,
    });

    return response.choices[0]?.message?.content ?? '';
  }
}
```

**Step 4: Run tests, commit**

```bash
pnpm vitest run src/services/__tests__/deepseek.client.test.ts
git add src/services/deepseek.client.ts src/services/__tests__/deepseek.client.test.ts
git commit -m "feat: add DeepSeek API client with text and multi-modal support"
```

---

### Task 8-13: Digestion Pipeline Steps

Each step follows the same TDD pattern. Here's the consolidated approach:

**Files to create:**
- `src/services/digestion/prompts/classify.txt`
- `src/services/digestion/prompts/extract-meta.txt`
- `src/services/digestion/prompts/tag.txt`
- `src/services/digestion/prompts/theme.txt`
- `src/services/digestion/prompts/summarize.txt`
- `src/services/digestion/prompts/connect.txt`
- `src/services/digestion/steps/classify.ts`
- `src/services/digestion/steps/extract-meta.ts`
- `src/services/digestion/steps/tag.ts`
- `src/services/digestion/steps/theme.ts`
- `src/services/digestion/steps/summarize.ts`
- `src/services/digestion/steps/connect.ts`
- `src/services/digestion/pipeline.ts`
- Test files for each step

### Task 8: Classify Step

**Step 1: Create prompt** — `src/services/digestion/prompts/classify.txt`

```
Analyze the following content and determine its source type.
Return ONLY a JSON object with a single field "type".

Valid types:
- "webpage": general web article or blog post
- "video": video content reference
- "book": novel, book, or literary work
- "social_post": social media post (Weibo, Tieba, Xiaohongshu, etc.)
- "game": game-related content
- "screenshot": this appears to be a screenshot from an app
- "thought": pure personal thought or idea with no external source

Content:
{body}

User's note (if any):
{userNote}

Respond with JSON only: {"type": "..."}
```

**Step 2: Implement step** — `src/services/digestion/steps/classify.ts`

```typescript
import fs from 'fs';
import path from 'path';
import type { DeepSeekClient } from '@/services/deepseek.client';
import type { SourceType } from '@/types/card';

const PROMPT = fs.readFileSync(
  path.join(__dirname, '..', 'prompts', 'classify.txt'),
  'utf-8'
);

export interface ClassifyInput {
  body: string;
  userNote: string | null;
}

export async function classify(
  client: DeepSeekClient,
  input: ClassifyInput
): Promise<SourceType | null> {
  const userMessage = PROMPT
    .replace('{body}', input.body.slice(0, 4000))
    .replace('{userNote}', input.userNote ?? '');

  const result = await client.chat(
    'You are a content classifier. Return only valid JSON.',
    userMessage
  );

  try {
    const parsed = JSON.parse(result);
    return parsed.type ?? null;
  } catch {
    return null;
  }
}
```

**Step 3: Write test, run, commit** — Use vitest with a mock DeepSeekClient.

### Task 9-13: Remaining Steps

Each follows the identical pattern:
- Create prompt file with `{variable}` placeholders
- Implement step function with typed input/output
- Write test with mock client
- Run, commit

**extract-meta** input: `{ body, type }` → output: `{ title: string | null, meta: Record<string, string> | null }`

**tag** input: `{ body, type }` → output: `string[]` (3-8 tags)

**theme** input: `{ body, existingThemes: string[] }` → output: `string[]` (1-3 themes)

**summarize** input: `{ body }` → output: `string | null` (≤50 chars Chinese)

**connect** input: `{ summary, tags, existingCards: { id, summary, tags }[] }` → output: `{ cardId: string, reason: string }[]`

### Task 14: Pipeline Orchestration

**Files:**
- Create: `src/services/digestion/pipeline.ts`
- Test: `src/services/digestion/__tests__/pipeline.test.ts`

**Step 1: Implement pipeline**

```typescript
// src/services/digestion/pipeline.ts
import type { CardService } from '@/services/card.service';
import type { DeepSeekClient } from '@/services/deepseek.client';
import { classify } from './steps/classify';
import { extractMeta } from './steps/extract-meta';
import { tag } from './steps/tag';
import { theme } from './steps/theme';
import { summarize } from './steps/summarize';
import { connect } from './steps/connect';
import type { Card } from '@/types/card';

export async function runDigestionPipeline(
  cardService: CardService,
  client: DeepSeekClient,
  cardId: string
): Promise<void> {
  const card = cardService.getById(cardId);
  if (!card) return;

  // Mark as processing
  cardService.update(cardId, { digestion_status: 'processing' });

  const body = cardService.getBody(cardId);
  let partial = false;

  // Step 1: Classify
  try {
    const type = await classify(client, { body, userNote: card.user_note });
    if (type) {
      cardService.update(cardId, { source_type: type });
    } else {
      partial = true;
    }
  } catch {
    partial = true;
  }

  // Get updated card for subsequent steps
  const updatedCard = cardService.getById(cardId)!;
  const sourceType = updatedCard.source.type ?? 'webpage';

  // Step 2: Extract meta
  try {
    const meta = await extractMeta(client, { body, type: sourceType });
    if (meta) {
      cardService.update(cardId, {
        source_title: meta.title,
        source_meta: meta.meta ?? undefined,
      });
    } else {
      partial = true;
    }
  } catch {
    partial = true;
  }

  // Step 3: Tag
  try {
    const tags = await tag(client, { body, type: sourceType });
    if (tags.length > 0) {
      cardService.update(cardId, { ai_tags: tags });
    } else {
      partial = true;
    }
  } catch {
    partial = true;
  }

  // Step 4: Theme
  try {
    const allCards = cardService.listAll();
    const existingThemes = [...new Set(allCards.flatMap(c => c.ai_themes))];
    const themes = await theme(client, { body, existingThemes });
    if (themes.length > 0) {
      cardService.update(cardId, { ai_themes: themes });
    } else {
      partial = true;
    }
  } catch {
    partial = true;
  }

  // Step 5: Summarize
  try {
    const summary = await summarize(client, { body });
    if (summary) {
      cardService.update(cardId, { ai_summary: summary });
    } else {
      partial = true;
    }
  } catch {
    partial = true;
  }

  // Step 6: Connect
  try {
    const refreshed = cardService.getById(cardId)!;
    const allCards = cardService.listAll().filter(c => c.id !== cardId);
    const existingSummaries = allCards
      .filter(c => c.ai_summary)
      .map(c => ({ id: c.id, summary: c.ai_summary!, tags: c.ai_tags }));

    if (refreshed.ai_summary && existingSummaries.length > 0) {
      const connections = await connect(client, {
        summary: refreshed.ai_summary,
        tags: refreshed.ai_tags,
        existingCards: existingSummaries,
      });

      if (connections.length > 0) {
        const currentConns = refreshed.connections;
        const newConns = connections.map(c => ({
          cardId: c.cardId,
          reason: c.reason,
          source: 'ai' as const,
        }));
        cardService.update(cardId, {
          connections: [...currentConns, ...newConns],
        });
      }
    }
  } catch {
    partial = true;
  }

  // Final status
  cardService.update(cardId, {
    digestion_status: partial ? 'partial' : 'done',
  });
}
```

**Step 2: Write test** — Mock the step functions and verify pipeline calls each in order, handles partial failures, and sets final status correctly.

**Step 3: Run tests, commit**

```bash
pnpm vitest run src/services/digestion/__tests__/
git add src/services/digestion/
git commit -m "feat: add AI digestion pipeline with 6 steps and orchestration"
```

---

### Task 15-18: API Routes

### Task 15: POST /api/cards

**Files:**
- Create: `src/app/api/cards/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { CardService } from '@/services/card.service';
import { loadConfig } from '@/lib/config';
import { DeepSeekClient } from '@/services/deepseek.client';
import { runDigestionPipeline } from '@/services/digestion/pipeline';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const body = formData.get('body') as string || '';
  const userNote = formData.get('userNote') as string || null;
  const sourceUrl = formData.get('sourceUrl') as string || null;
  const files = formData.getAll('attachments') as File[];

  const config = loadConfig();
  const cardService = new CardService(config.dataDir);

  // Save uploaded files to temp
  const attachments: { sourcePath: string; filename: string }[] = [];
  for (const file of files) {
    // Save to temp, will be copied by card service
    const tmpPath = `/tmp/${file.name}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    require('fs').writeFileSync(tmpPath, buffer);
    attachments.push({ sourcePath: tmpPath, filename: file.name });
  }

  const card = cardService.create({ body, userNote, sourceUrl, attachments });

  // Trigger digestion asynchronously
  if (config.deepseekApiKey) {
    const client = new DeepSeekClient(config.deepseekApiKey);
    // Fire and forget
    runDigestionPipeline(cardService, client, card.id).catch(console.error);
  }

  return NextResponse.json({ id: card.id, status: 'created' }, { status: 201 });
}
```

### Task 16: GET/PATCH /api/cards/[id]

**Files:**
- Create: `src/app/api/cards/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { CardService } from '@/services/card.service';
import { loadConfig } from '@/lib/config';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const config = loadConfig();
  const cardService = new CardService(config.dataDir);
  const card = cardService.getById(params.id);
  if (!card) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const body = cardService.getBody(params.id);
  return NextResponse.json({ card, body });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const config = loadConfig();
  const cardService = new CardService(config.dataDir);
  const input = await req.json();
  const updated = cardService.update(params.id, input);
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(updated);
}
```

### Task 17: POST /api/digest/[id]

**Files:**
- Create: `src/app/api/digest/[id]/route.ts`

Triggers the pipeline for an existing card (for re-digestion). Fire-and-forget response.

### Task 18: GET /api/search

**Files:**
- Create: `src/app/api/search/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { CardService } from '@/services/card.service';
import { loadConfig } from '@/lib/config';

export async function GET(req: NextRequest) {
  const config = loadConfig();
  const cardService = new CardService(config.dataDir);
  const query = req.nextUrl.searchParams.get('q') || '';
  const theme = req.nextUrl.searchParams.get('theme');
  const tag = req.nextUrl.searchParams.get('tag');
  const type = req.nextUrl.searchParams.get('type');

  let cards;
  if (query) {
    cards = cardService.search(query);
  } else if (theme) {
    cards = cardService.filterByTheme(theme);
  } else if (tag) {
    cards = cardService.filterByTag(tag);
  } else {
    cards = cardService.listAll();
  }

  return NextResponse.json(cards);
}
```

**Commit:** `git commit -m "feat: add API routes for cards CRUD, digestion, and search"`

---

### Task 19-24: Frontend

### Task 19: Capture Page

**Files:**
- Create: `src/app/capture/page.tsx`
- Create: `src/components/capture/CaptureForm.tsx`
- Create: `src/components/capture/FileDropZone.tsx`

**Step 1: Install lucide-react for icons**

```bash
pnpm add lucide-react
```

**Step 2: Build CaptureForm**

A mobile-first single-column form with textarea for body, optional URL input, optional note textarea, file drop zone, and submit button. Uses `fetch('/api/cards', { method: 'POST', body: formData })`. On success, clears form, shows toast.

```typescript
// src/components/capture/CaptureForm.tsx
'use client';
import { useState, useRef, FormEvent } from 'react';
import { Send, Paperclip } from 'lucide-react';
import { FileDropZone } from './FileDropZone';

export function CaptureForm() {
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!body.trim() && files.length === 0) return;

    setSubmitting(true);
    const formData = new FormData();
    formData.append('body', body);
    if (url) formData.append('sourceUrl', url);
    if (note) formData.append('userNote', note);
    for (const f of files) formData.append('attachments', f);

    try {
      const res = await fetch('/api/cards', { method: 'POST', body: formData });
      if (res.ok) {
        setBody(''); setUrl(''); setNote(''); setFiles([]);
        setToast('已保存');
        setTimeout(() => setToast(null), 2000);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4 max-w-lg mx-auto">
      <textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        placeholder="贴入 URL、文字、截图，或上传任意文件"
        className="w-full min-h-[120px] p-3 rounded-lg border resize-y text-sm"
      />
      <input
        type="url"
        value={url}
        onChange={e => setUrl(e.target.value)}
        placeholder="源 URL（可选）"
        className="w-full p-2 rounded-lg border text-sm"
      />
      <FileDropZone files={files} onFilesChange={setFiles} />
      <textarea
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="简评（可选）"
        className="w-full p-2 rounded-lg border resize-none text-sm h-16"
      />
      <button
        type="submit"
        disabled={submitting}
        className="flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        <Send size={16} />
        {submitting ? '保存中...' : '保存灵感'}
      </button>
      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm">
          {toast}
        </div>
      )}
    </form>
  );
}
```

**Step 3: Build FileDropZone**

```typescript
// src/components/capture/FileDropZone.tsx
'use client';
import { useCallback, DragEvent } from 'react';
import { Upload, X } from 'lucide-react';

interface Props {
  files: File[];
  onFilesChange: (files: File[]) => void;
}

export function FileDropZone({ files, onFilesChange }: Props) {
  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files);
    onFilesChange([...files, ...dropped]);
  }, [files, onFilesChange]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onFilesChange([...files, ...Array.from(e.target.files)]);
    }
  };

  const removeFile = (idx: number) => {
    onFilesChange(files.filter((_, i) => i !== idx));
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={e => e.preventDefault()}
      className="border-2 border-dashed rounded-lg p-3 text-center text-sm text-gray-500 hover:border-blue-400 cursor-pointer"
    >
      <input
        type="file"
        multiple
        onChange={handleFileInput}
        className="hidden"
        id="file-upload"
      />
      <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-1">
        <Upload size={18} />
        <span>拖拽文件或点击上传</span>
      </label>
      {files.length > 0 && (
        <ul className="mt-2 text-left text-xs">
          {files.map((f, i) => (
            <li key={i} className="flex items-center justify-between py-1">
              <span className="truncate">{f.name}</span>
              <button type="button" onClick={() => removeFile(i)}>
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

**Step 4: Write CapturePage**

```typescript
// src/app/capture/page.tsx
import { CaptureForm } from '@/components/capture/CaptureForm';

export default function CapturePage() {
  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <h1 className="text-xl font-semibold text-center mb-6">捕获灵感</h1>
      <CaptureForm />
    </main>
  );
}
```

**Commit:** `git commit -m "feat: add capture page with form, file drop zone, and API integration"`

### Task 20: Canvas Page

**Files:**
- Create: `src/app/canvas/page.tsx`
- Create: `src/components/canvas/Canvas.tsx`
- Create: `src/stores/canvas.store.ts`

**Step 1: Install React Flow and Zustand**

```bash
pnpm add reactflow zustand
```

**Step 2: Create canvas store**

```typescript
// src/stores/canvas.store.ts
import { create } from 'zustand';
import type { Card } from '@/types/card';
import type { Node, Edge, OnNodesChange, OnEdgesChange } from 'reactflow';

interface CanvasState {
  cards: Card[];
  nodes: Node[];
  edges: Edge[];
  selectedCardId: string | null;
  searchQuery: string;
  filterTheme: string | null;
  filterTag: string | null;
  filterType: string | null;

  setCards: (cards: Card[]) => void;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  selectCard: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setFilterTheme: (theme: string | null) => void;
  setFilterTag: (tag: string | null) => void;
  setFilterType: (type: string | null) => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  cards: [],
  nodes: [],
  edges: [],
  selectedCardId: null,
  searchQuery: '',
  filterTheme: null,
  filterTag: null,
  filterType: null,

  setCards: (cards) => set({ cards }),
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  selectCard: (id) => set({ selectedCardId: id }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setFilterTheme: (theme) => set({ filterTheme: theme }),
  setFilterTag: (tag) => set({ filterTag: tag }),
  setFilterType: (type) => set({ filterType: type }),
}));
```

**Step 3: Create Canvas component**

A React Flow wrapper that fetches cards on mount, converts them to nodes/edges, and renders.

```typescript
// src/components/canvas/Canvas.tsx
'use client';
import { useEffect, useMemo, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  type Connection,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { CardNode } from './CardNode';
import { useCanvasStore } from '@/stores/canvas.store';
import type { Card } from '@/types/card';

const nodeTypes = { cardNode: CardNode };

function cardToNode(card: Card, index: number) {
  return {
    id: card.id,
    type: 'cardNode',
    position: { x: (index % 4) * 280 + 50, y: Math.floor(index / 4) * 180 + 50 },
    data: { card },
  };
}

function connectionsToEdges(card: Card) {
  return card.connections.map((conn, i) => ({
    id: `${card.id}-${conn.cardId}-${i}`,
    source: card.id,
    target: conn.cardId,
    style: { stroke: conn.source === 'ai' ? '#94a3b8' : '#3b82f6', strokeDasharray: conn.source === 'ai' ? '5,5' : 'none' },
    label: conn.reason,
  }));
}

export function Canvas() {
  const { cards, setCards, selectedCardId, selectCard } = useCanvasStore();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Fetch cards on mount
  useEffect(() => {
    fetch('/api/search')
      .then(r => r.json())
      .then(setCards);
  }, [setCards]);

  // Sync cards → nodes/edges
  useEffect(() => {
    setNodes(cards.map(cardToNode));
    setEdges(cards.flatMap(connectionsToEdges));
  }, [cards, setNodes, setEdges]);

  const onNodeClick = useCallback((_event: React.MouseEvent, node: any) => {
    selectCard(node.id);
  }, [selectCard]);

  return (
    <div className="w-full h-screen">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
```

**Commit:** `git commit -m "feat: add canvas page with React Flow integration"`

### Task 21: Card Node Component

**Files:**
- Create: `src/components/canvas/CardNode.tsx`
- Create: `src/components/shared/TypeIcon.tsx`

```typescript
// src/components/canvas/CardNode.tsx
import { Handle, Position } from 'reactflow';
import type { Card } from '@/types/card';
import { TypeIcon } from '@/components/shared/TypeIcon';

export function CardNode({ data }: { data: { card: Card } }) {
  const { card } = data;
  const themeColors: Record<string, string> = {
    '叙事设计': '#f97316',
    '战斗系统': '#ef4444',
    '世界构建': '#8b5cf6',
    '美术风格': '#ec4899',
    '关卡设计': '#22c55e',
    '技术方案': '#3b82f6',
    '音效音乐': '#a855f7',
    'UX设计': '#14b8a6',
  };

  const primaryTheme = card.ai_themes[0] ?? '';
  const color = themeColors[primaryTheme] ?? '#6b7280';

  return (
    <div
      className="bg-white rounded-lg shadow-md border p-3 min-w-[200px] max-w-[260px] cursor-pointer hover:shadow-lg transition-shadow"
      style={{ borderLeftColor: color, borderLeftWidth: 3 }}
    >
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center gap-2 mb-1">
        <TypeIcon type={card.source.type} />
        <span className="text-xs text-gray-500">
          {card.digestion_status === 'pending' ? '消化中...' : card.digestion_status === 'partial' ? '部分消化' : ''}
        </span>
      </div>
      <p className="text-sm font-medium line-clamp-2">
        {card.ai_summary || card.user_note || card.source.title || '未命名灵感'}
      </p>
      <div className="flex flex-wrap gap-1 mt-2">
        {card.ai_tags.slice(0, 3).map(tag => (
          <span key={tag} className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
            {tag}
          </span>
        ))}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
```

```typescript
// src/components/shared/TypeIcon.tsx
import { Globe, Video, BookOpen, MessageCircle, Gamepad2, Camera, Lightbulb } from 'lucide-react';
import type { SourceType } from '@/types/card';

const iconMap: Record<string, React.ComponentType<{ size?: number }>> = {
  webpage: Globe,
  video: Video,
  book: BookOpen,
  social_post: MessageCircle,
  game: Gamepad2,
  screenshot: Camera,
  thought: Lightbulb,
};

export function TypeIcon({ type }: { type: SourceType | null }) {
  const Icon = type ? iconMap[type] ?? Lightbulb : Lightbulb;
  return <Icon size={14} />;
}
```

**Commit:** `git commit -m "feat: add card node and type icon components"`

### Task 22: Card Detail Sheet

**Files:**
- Create: `src/components/canvas/CardDetailSheet.tsx`

A side panel (desktop) or bottom sheet (mobile) showing full card details. All fields editable. Fetches card + body on open, PATCHes on save.

### Task 23: Search & Filter

**Files:**
- Create: `src/components/canvas/SearchBar.tsx`
- Create: `src/components/canvas/FilterPanel.tsx`

SearchBar: text input that calls `/api/search?q=...` and filters the canvas.
FilterPanel: dropdowns for theme, tag, type (populated from available values in current cards).

### Task 24: Connections & Manual Linking

Extend the canvas to support:
- Drag from a node's source handle to another node's target handle → call PATCH to add a user connection
- Save connections to both card's `connections[]` arrays (bidirectional)

---

### Task 25-26: Electron Shell

### Task 25: Electron Main Process

**Files:**
- Create: `electron/main.ts`
- Create: `electron/preload.ts`

```typescript
// electron/main.ts
import { app, BrowserWindow, globalShortcut, Tray, Menu, nativeImage } from 'electron';
import path from 'path';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });

  // In dev, load Next.js dev server; in prod, load static export
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000/canvas');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../out/canvas.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  // Global shortcut for quick capture
  globalShortcut.register('CommandOrControl+Shift+I', () => {
    if (mainWindow) {
      mainWindow.loadURL('http://localhost:3000/capture'); // or file path in prod
      mainWindow.show();
      mainWindow.focus();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
```

**Install electron and add scripts to package.json:**

```bash
pnpm add -D electron electron-builder concurrently
```

**scripts:**
```json
{
  "dev": "concurrently \"next dev\" \"electron .\"",
  "build": "next build && electron-builder"
}
```

### Task 26: Electron Preload

```typescript
// electron/preload.ts
import { contextBridge, ipcRenderer, clipboard } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  readClipboard: () => clipboard.readText(),
  writeClipboard: (text: string) => clipboard.writeText(text),
  onGlobalShortcut: (callback: () => void) => {
    ipcRenderer.on('quick-capture', callback);
  },
});
```

**Commit:** `git commit -m "feat: add Electron shell with global shortcut and preload"`

---

### Task 27: PWA Configuration

**Files:**
- Create: `public/manifest.json`
- Modify: `next.config.js` (enable PWA support via next-pwa or manual)

```json
{
  "name": "灵感知识库",
  "short_name": "灵感",
  "start_url": "/capture",
  "display": "standalone",
  "background_color": "#f9fafb",
  "theme_color": "#2563eb",
  "share_target": {
    "action": "/capture",
    "method": "POST",
    "enctype": "multipart/form-data",
    "params": {
      "title": "title",
      "text": "text",
      "url": "url",
      "files": [{ "name": "attachments", "accept": ["*/*"] }]
    }
  },
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

**Commit:** `git commit -m "feat: add PWA manifest with share target"`

---

### Task 28: Integration Smoke Test

**Files:**
- Create: `e2e/smoke.test.ts`

Install Playwright, write a test that:
1. Opens /capture, fills form, submits
2. Waits for card creation
3. Navigates to /canvas
4. Verifies node appears

```bash
pnpm add -D @playwright/test
pnpm exec playwright install chromium
```

### Task 29: Polish & Final Commit

- Add loading skeletons for canvas load
- Add empty state for canvas with 0 cards
- Add error boundaries
- Run full test suite
- Final commit

```bash
pnpm vitest run
pnpm tsc --noEmit
git add -A
git commit -m "chore: polish, tests pass, ready for V1"
```
