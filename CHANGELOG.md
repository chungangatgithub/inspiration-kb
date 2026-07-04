# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-07-03

### Added
- **Capture** (`/capture`): Multi-format inspiration capture with URL, text, file upload, and drag-and-drop support
- **Canvas** (`/canvas`): Infinite canvas for browsing and organizing inspiration cards with React Flow
- **AI Digestion Pipeline**: 6-step pipeline (classify → extract-meta → tag → theme → summarize → connect) powered by DeepSeek API
- **Local-first Storage**: Open file formats (JSON + Markdown + attachments) stored locally; SQLite for indexing and full-text search
- **Type Definitions**: Card, Source, Connection, Attachment, and AppConfig types
- **Config Management**: Persistent configuration with defaults (data directory, API key)
- **Card Service**: Dual-write card CRUD with file system as source of truth and SQLite as search index
- **Database Service**: SQLite with FTS5 full-text search, theme/tag/type filtering, and connection management
- **File Service**: Local file system operations for card persistence
- **DeepSeek Client**: OpenAI-compatible chat API client for DeepSeek
- **Electron Shell**: Desktop app wrapper with global shortcut (`Cmd/Ctrl+Shift+I`) for quick capture
- **Zustand Store**: Lightweight canvas state management
- **Unit Tests**: Vitest tests for services, config, digestion pipeline, and DeepSeek client
