# Design：灵感知识库

## 一、架构总览

```
┌─────────────────────────────────────────────────────┐
│                    Electron Shell                     │
│  ┌───────────────────────────────────────────────┐  │
│  │              Next.js Web App                    │  │
│  │  ┌──────────┐  ┌──────────┐  ┌─────────────┐  │  │
│  │  │ /capture  │  │ /canvas  │  │ API Routes  │  │  │
│  │  │ (捕获页)   │  │ (画布页)  │  │ (/api/...)  │  │  │
│  │  └──────────┘  └──────────┘  └──────┬──────┘  │  │
│  │                                      │         │  │
│  │  ┌───────────────────────────────────┼──────┐  │  │
│  │  │           Service Layer           │      │  │  │
│  │  │  ┌─────────┐  ┌────────────────┐  │      │  │  │
│  │  │  │ Card    │  │ Digestion      │  │      │  │  │
│  │  │  │ Service │  │ Pipeline       │  │      │  │  │
│  │  │  └────┬────┘  └───────┬────────┘  │      │  │  │
│  │  │       │               │           │      │  │  │
│  │  │  ┌────┴───────────────┴────────┐  │      │  │  │
│  │  │  │        Data Layer           │  │      │  │  │
│  │  │  │  ┌──────────┐ ┌──────────┐  │  │      │  │  │
│  │  │  │  │  File IO │ │  SQLite  │  │  │      │  │  │
│  │  │  │  └──────────┘ └──────────┘  │  │      │  │  │
│  │  │  └─────────────────────────────┘  │      │  │  │
│  │  └───────────────────────────────────┘      │  │  │
│  └───────────────────────────────────────────────┘  │
│                                                      │
│  系统托盘 / 全局快捷键 / 剪贴板监听                      │
└─────────────────────────────────────────────────────┘

                    文件同步 (Syncthing / iCloud)
                            ↕
              ┌──────────────────────────┐
              │      移动端 PWA           │
              │  /capture  +  /canvas    │
              │  Share Target API        │
              │  Service Worker (离线)    │
              └──────────────────────────┘
```

**核心理念：** 无服务端架构。每端是完整独立应用，通过文件同步交换数据。Electron 提供系统级能力（快捷键、托盘、文件系统直访），PWA 提供移动端可达性。

## 二、技术栈

| 层 | 选型 | 原因 |
|----|------|------|
| Shell | Electron | 全局快捷键、系统托盘、无沙箱文件 IO、剪贴板监听 |
| Web 框架 | Next.js (App Router) | SSR 不需要但 API Routes 做本地服务很好用；React 生态成熟 |
| 画布/图谱 | React Flow | 节点-连线交互的开源首选，支持自定义节点和边 |
| 本地数据库 | better-sqlite3 | 同步 API，零配置，Electron 下直连 |
| 文件存储 | Node.js fs | 直写 JSON/Markdown/附件到本地目录 |
| AI 客户端 | openai SDK | 兼容 DeepSeek API（baseURL 指向 DeepSeek） |
| 移动端 | PWA (next-pwa) | Service Worker 离线缓存 + Share Target + 安装到主屏幕 |
| 样式 | Tailwind CSS | 快速布局，画布区域极少样式需求 |
| 状态管理 | Zustand | 轻量，适合画布全局状态（选中节点、布局、过滤器） |
| 包管理 | pnpm | 快，磁盘友好 |

**不用的：**
- 不用 Next.js SSR/ISR——纯客户端渲染，不需要服务端渲染
- 不用 Prisma/ORM——只有几张表，better-sqlite3 原生 SQL 更直接
- 不用 Redux——画布状态用 Zustand，卡片数据直接从文件/SQLite 读

## 三、项目结构

```
inspiration-kb/
├── electron/                  # Electron 主进程
│   ├── main.ts                # 窗口管理、托盘、快捷键
│   ├── preload.ts             # 暴露文件 IO API 到渲染进程
│   └── tray.ts                # 系统托盘逻辑
├── src/
│   ├── app/
│   │   ├── capture/           # /capture 路由
│   │   │   └── page.tsx
│   │   ├── canvas/            # /canvas 路由
│   │   │   └── page.tsx
│   │   ├── api/
│   │   │   ├── cards/
│   │   │   │   ├── route.ts   # POST 创建卡片 + 触发消化
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts  # GET/PATCH 单个卡片
│   │   │   ├── digest/
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts  # POST 触发消化管线
│   │   │   └── search/
│   │   │       └── route.ts      # GET 搜索
│   │   ├── layout.tsx
│   │   └── page.tsx            # 重定向到 /canvas
│   ├── services/
│   │   ├── card.service.ts     # 卡片 CRUD（文件 + SQLite）
│   │   ├── digestion/
│   │   │   ├── pipeline.ts     # 管线编排
│   │   │   ├── steps/
│   │   │   │   ├── classify.ts      # Step 1: 类型判断
│   │   │   │   ├── extract-meta.ts  # Step 2: 元数据提取
│   │   │   │   ├── tag.ts           # Step 3: 标签
│   │   │   │   ├── theme.ts         # Step 4: 主题
│   │   │   │   ├── summarize.ts     # Step 5: 摘要
│   │   │   │   └── connect.ts       # Step 6: 关联
│   │   │   └── prompts/        # LLM prompt 模板
│   │   │       ├── classify.txt
│   │   │       ├── extract-meta.txt
│   │   │       ├── tag.txt
│   │   │       ├── theme.txt
│   │   │       ├── summarize.txt
│   │   │       └── connect.txt
│   │   ├── deepseek.client.ts  # DeepSeek API 封装
│   │   ├── file.service.ts     # 文件 IO 操作
│   │   └── db.service.ts       # SQLite 操作
│   ├── stores/
│   │   ├── canvas.store.ts     # 画布状态（节点位置、缩放、选中）
│   │   └── filter.store.ts     # 搜索/过滤状态
│   ├── components/
│   │   ├── capture/
│   │   │   ├── CaptureForm.tsx       # 捕获表单
│   │   │   ├── FileDropZone.tsx      # 文件拖拽区
│   │   │   └── SubmitButton.tsx
│   │   ├── canvas/
│   │   │   ├── Canvas.tsx            # React Flow 画布容器
│   │   │   ├── CardNode.tsx          # 自定义节点组件
│   │   │   ├── ConnectionLine.tsx    # 自定义连线
│   │   │   ├── Toolbar.tsx           # 工具栏
│   │   │   ├── SearchBar.tsx         # 搜索框
│   │   │   ├── FilterPanel.tsx       # 过滤面板
│   │   │   └── CardDetailSheet.tsx   # 卡片详情面板
│   │   └── shared/
│   │       ├── Toast.tsx
│   │       └── TypeIcon.tsx          # 来源类型图标
│   ├── types/
│   │   └── card.ts              # Card 类型定义
│   └── lib/
│       ├── constants.ts
│       └── utils.ts
├── public/
│   └── manifest.json            # PWA manifest
├── next.config.js
├── tailwind.config.ts
├── electron-builder.yml         # Electron 打包配置
└── package.json
```

## 四、数据模型

### 4.1 文件层（Source of Truth）

```
{dataDir}/
├── cards.db                    # SQLite 索引
├── cards/
│   ├── {uuid-1}/
│   │   ├── card.json
│   │   ├── body.md
│   │   └── attachments/
│   │       ├── screenshot.png
│   │       └── clip.mp4
│   ├── {uuid-2}/
│   │   ├── card.json
│   │   ├── body.md
│   │   └── attachments/
│   │       └── reference.pdf
│   └── ...
└── config.json                 # 用户配置（API Key、数据目录路径等）
```

### 4.2 card.json 结构

```typescript
interface Card {
  id: string;                    // UUID v4
  source: {
    url: string | null;          // 源 URL
    type: SourceType | null;     // AI 填充
    title: string | null;        // AI 填充
    meta: Record<string, string> | null;  // AI 填充，按类型变化
  };
  captured_at: string;           // ISO 8601
  user_note: string | null;      // 用户简评

  // AI 消化结果
  ai_tags: string[];
  ai_themes: string[];
  ai_summary: string | null;
  ai_review: string | null;      // V3

  // 用户深度分析
  user_review: string | null;

  // 关联
  connections: Connection[];

  // 附件
  attachments: Attachment[];

  // 媒体格式标记
  format: MediaFormat;

  // 元数据
  digestion_status: DigestionStatus;
  updated_at: string;            // ISO 8601
}

type SourceType = 'webpage' | 'video' | 'book' | 'social_post'
                | 'game' | 'screenshot' | 'thought';

type MediaFormat = 'text' | 'image' | 'video' | 'audio' | 'file';

type DigestionStatus = 'pending' | 'processing' | 'done' | 'partial';

interface Connection {
  cardId: string;                // 被关联卡片的 UUID
  reason: string;                // 关联原因说明
  source: 'ai' | 'user';        // 关联来源
}

interface Attachment {
  filename: string;
  type: string;                  // MIME type
  size: number;                  // bytes
}
```

### 4.3 source.meta 按类型

```typescript
// source.type === 'book'
{ book_title, author, chapter, platform }

// source.type === 'social_post'
{ author, platform, post_date }

// source.type === 'video'
{ platform, creator, video_title, duration }

// source.type === 'webpage'
{ site_name, author, publish_date }

// source.type === 'screenshot'
{ ocr_text, inferred_type, inferred_meta }

// source.type === 'game'
{ game_title, developer, genre, platform }
```

### 4.4 SQLite 表结构

```sql
-- 卡片索引表（加速搜索和关联查询，card.json 为 source of truth）
CREATE TABLE cards (
  id TEXT PRIMARY KEY,
  source_type TEXT,
  source_title TEXT,
  source_url TEXT,
  user_note TEXT,
  ai_summary TEXT,
  ai_tags TEXT,          -- JSON array
  ai_themes TEXT,        -- JSON array
  format TEXT,
  digestion_status TEXT,
  captured_at TEXT,
  updated_at TEXT
);

-- 全文搜索虚拟表
CREATE VIRTUAL TABLE cards_fts USING fts5(
  id,
  source_title,
  source_url,
  user_note,
  ai_summary,
  ai_tags,
  ai_themes
);

-- 关联表（冗余存储，加速图谱查询）
CREATE TABLE connections (
  card_id TEXT,
  target_id TEXT,
  reason TEXT,
  source TEXT,           -- 'ai' | 'user'
  PRIMARY KEY (card_id, target_id)
);
```

索引重建策略：启动时扫描 `cards/` 目录下所有 `card.json` 文件，与 SQLite 对比，增量更新。

## 五、AI 消化管线设计

### 5.1 管线流程图

```
card.json 写入（status: pending）
        │
        ▼
┌─────────────────┐
│  format 判断     │
│  text → 文本管线  │
│  image → 多模态   │
│  video → 抽帧    │
│  audio → 跳过    │
│  file → 跳过     │
└────────┬────────┘
         │
         ▼
  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
  │ Step 1       │───→│ Step 2       │───→│ Step 3       │
  │ 类型判断      │    │ 元数据提取    │    │ 标签生成      │
  │ (classify)   │    │ (extractMeta)│    │ (tag)        │
  └──────────────┘    └──────────────┘    └──────┬───────┘
                                                  │
         ┌────────────────────────────────────────┘
         ▼
  ┌──────────────┐    ┌──────────────┐
  │ Step 4       │───→│ Step 5       │───→│ Step 6       │
  │ 主题识别      │    │ 摘要生成      │    │ 关联匹配      │
  │ (theme)      │    │ (summarize)  │    │ (connect)    │
  └──────────────┘    └──────────────┘    └──────────────┘
                                                  │
         ┌────────────────────────────────────────┘
         ▼
  card.json 更新（status: done / partial）
```

### 5.2 每一步的输入输出

| 步骤 | 输入 | 输出 | API | 超时 |
|------|------|------|-----|------|
| classify | body.md 全文 + user_note + 附件类型 | source.type | Chat Completions | 15s |
| extractMeta | body.md + source.type | source.title + source.meta | Chat Completions | 15s |
| tag | body.md + source.type | ai_tags (3-8个) | Chat Completions | 15s |
| theme | body.md + 已有主题池 | ai_themes (1-3个) | Chat Completions | 15s |
| summarize | body.md | ai_summary (≤50字) | Chat Completions | 10s |
| connect | ai_summary + ai_tags vs 已有卡片摘要和标签 | connections[] | Chat Completions | 30s |

### 5.3 错误处理

```
Step N 失败
    ↓
标记该步骤对应字段为 null
    ↓
继续执行 Step N+1（不阻塞）
    ↓
所有步骤完成后：
  全部成功 → digestion_status = 'done'
  部分失败 → digestion_status = 'partial'
  全部失败 → digestion_status = 'partial'（所有 AI 字段为 null）
```

### 5.4 截图的双阶段处理

```
截图附件
    ↓
Phase 1: OCR —— 调用多模态模型，提取图片中所有文字
    ↓
Phase 2: 结构化 —— 基于 OCR 文本 + 视觉布局特征，推断 source.type + 提取 source.meta
    ↓
Phase 2 推断出的 source.type 覆盖 Step 1 的 classify 结果
```

### 5.5 Prompt 管理

所有 prompt 模板存放在 `src/services/digestion/prompts/` 目录下，纯文本文件，方便调试和迭代。每个 prompt 使用 `{variable}` 占位符，运行时替换。

```
prompts/
├── classify.txt       # "根据以下内容判断来源类型：{body}。可选类型：..."
├── extract-meta.txt   # "从以下{type}内容中提取元数据：{body}。需要提取的字段：..."
├── tag.txt            # "为以下内容生成3-8个标签。标签应覆盖游戏类型、叙事手法、..."
├── theme.txt          # "已有主题：{existingThemes}。从以下内容识别1-3个主题：..."
├── summarize.txt      # "用一句话（不超过50字）总结以下内容的核心灵感：{body}"
└── connect.txt        # "以下是一张新卡片：{summary} {tags}。与已有卡片列表比较..."
```

## 六、组件树 & 路由

```
/ (重定向到 /canvas)
├── /capture
│   └── CapturePage
│       ├── CaptureForm
│       │   ├── TextArea (URL/文字输入)
│       │   ├── FileDropZone (文件拖拽/上传)
│       │   └── TextArea (简评，可选)
│       └── SubmitButton
│
└── /canvas
    └── CanvasPage
        ├── Toolbar
        │   ├── SearchBar
        │   ├── FilterPanel (主题/标签/类型/时间)
        │   └── ZoomControl
        ├── Canvas (ReactFlow)
        │   ├── CardNode[] (自定义节点)
        │   │   └── TypeIcon + 标题 + 标签
        │   └── ConnectionLine[] (自定义边)
        │       └── 虚线(AI) / 实线(用户)
        └── CardDetailSheet (侧边栏/移动端底部Sheet)
            ├── 字段编辑区
            ├── body.md 渲染
            └── 附件预览
```

## 七、关键交互流

### 7.1 捕获流

```
用户操作                          系统行为
───────                          ────────
1. 粘贴/输入 URL 或文字
2. (可选) 拖入文件                   → 文件写入临时目录，显示缩略图/文件名
3. (可选) 填写简评
4. 点击提交
                                   → 生成 UUID
                                   → 创建卡片目录结构
                                   → 写入 card.json (digestion_status: pending)
                                   → 写入 body.md
                                   → 移动附件到 attachments/
                                   → 插入 SQLite 索引行
                                   → 返回成功 (200)
                                   → 后台异步启动消化管线
5. 看到 toast "已保存"
   → 输入区清空，可继续捕获
```

### 7.2 消化流（后台异步）

```
API Route 返回 200 后
       │
       ▼
  digestion_status → 'processing'
       │
       ▼
  Pipeline.execute(cardId)
       │
       ├─→ Step 1-6 串行执行
       │
       ▼
  card.json 更新（AI 字段填充）
  SQLite 索引更新
  digestion_status → 'done' | 'partial'
```

### 7.3 浏览 & 编辑流

```
用户进入 /canvas
       │
       ▼
  扫描 cards/ 目录 → 加载所有 card.json
  SQLite 索引验证/重建
  初始化 React Flow（节点位置从 card.json 或默认布局）
       │
       ▼
  用户操作：
  ├─ 拖拽节点 → 更新画布状态（位置暂存内存，退出时持久化）
  ├─ 点击节点 → 侧边栏展示详情 → 编辑字段 → 保存 → 写回 card.json + SQLite
  ├─ 手动连线 → 写入 connections[] → 持久化 card.json
  ├─ 搜索 → SQLite FTS 查询 → 高亮匹配节点
  ├─ 过滤 → 按条件筛选 SQLite → 画布只渲染匹配节点
  └─ 创建组 → 组元数据写入...（TBD：组的存储方式）
```

## 八、Electron 集成设计

### 8.1 主进程职责

| 功能 | 实现 |
|------|------|
| 窗口管理 | BrowserWindow 加载 Next.js dev server 或静态导出 |
| 全局快捷键 | `globalShortcut.register('Cmd+Shift+I', ...)` — 呼出捕获浮窗 |
| 系统托盘 | 右键菜单：打开主窗口 / 快速捕获 / 退出 |
| 剪贴板监听 | 轮询 clipboard 内容，检测到 URL 时托盘图标变化提示可快速存入 |
| 文件 IO 桥接 | preload.ts 通过 contextBridge 暴露文件读写 API |

### 8.2 preload API

```typescript
// preload.ts 暴露给渲染进程的 API
contextBridge.exposeInMainWorld('electronAPI', {
  // 文件操作
  readCardFile: (cardId: string) => Promise<Card>,
  writeCardFile: (cardId: string, card: Card) => Promise<void>,
  readBodyMd: (cardId: string) => Promise<string>,
  writeBodyMd: (cardId: string, content: string) => Promise<void>,
  listAttachments: (cardId: string) => Promise<string[]>,

  // 系统
  getDataDir: () => Promise<string>,
  pickFile: () => Promise<string | null>,     // 原生文件选择器
  writeClipboard: (text: string) => Promise<void>,

  // 窗口
  minimizeToTray: () => void,
  onGlobalShortcut: (callback: () => void) => void,
})
```

## 九、PWA 配置

### 9.1 manifest.json

```json
{
  "name": "灵感知识库",
  "short_name": "灵感",
  "start_url": "/capture",
  "display": "standalone",
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
  "icons": [...]
}
```

### 9.2 Service Worker

- 缓存 `/capture` 和 `/canvas` 静态资源
- 离线时捕获请求排队（存入 IndexedDB），联网后批量提交
- 后台同步（Background Sync API，Chrome 支持较好）

## 十、测试策略

| 层 | 范围 | 工具 |
|----|------|------|
| 单元测试 | 消化管线每一步的纯函数逻辑 | Vitest |
| 服务测试 | card.service.ts / file.service.ts / db.service.ts | Vitest + better-sqlite3 内存模式 |
| API 测试 | API Routes | Vitest + node-mocks-http |
| 组件测试 | 关键交互组件 | React Testing Library |
| E2E | 捕获 → 消化 → 浏览 完整流 | Playwright (Electron 或 Chromium) |

**不需要测的：**
- AI 消化管线的 prompt 效果——用 eval 脚本单独测，不纳入 CI
- React Flow 的内部行为——库自己测过了
- 文件同步——外部工具的责任
