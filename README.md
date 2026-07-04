# 灵感知识库 (inspiration-kb)

一个跨平台的灵感捕获与知识沉淀工具。从任何来源快速存入灵感，AI 自动消化整理，在统一画布上浏览和发现关联。

## 为什么需要它？

创作者在日常中不断接触大量灵感来源，但现有工具的收藏/书签功能存在三个根本缺陷：

1. **平台绑定** — 内容锁在各个 App 的收藏夹里，链接失效即丢失，数据不归用户所有
2. **无消化** — 存了就存了，没有自动梳理和关联，积累越多越混乱
3. **不可持续** — 素材散落在各处（便签、txt、文件夹、收藏夹），彼此孤立，无法形成可生长的知识体系

灵感知识库解决以上问题：**数据归你、AI 消化、画布串联**。

## 核心功能

```
碎片灵感                   结构化知识                   创意产出
──────────────────────────────────────────────────────────→

捕获 → 消化 → 浏览 ──→ 深度反刍（外部 agent）
```

- **📥 多入口捕获** — URL、文字、图片、视频、音频、任意文件，PC 快捷键唤醒（`Cmd/Ctrl+Shift+I`），移动端 PWA 分享菜单
- **🤖 AI 自动消化** — 6 步管线：分类 → 提取元数据 → 打标签 → 识别主题 → 摘要 → 发现关联
- **🗺️ 无限画布浏览** — 所有卡片以节点形式存在，关联以连线呈现，可拖拽排列、手动连线、分组
- **📂 开放文件格式** — 数据以 JSON + Markdown + 附件的格式存储在本地目录，天然可被外部 agent 框架直接读写
- **🔍 全文搜索** — 按关键词、主题、标签、类型、时间范围快速找到目标灵感
- **🔌 离线可用** — 无网络时浏览、编辑、搜索均正常工作

## 技术栈

| 层 | 选型 |
|----|------|
| Shell | Electron（全局快捷键、系统托盘） |
| Web 框架 | Next.js (App Router) |
| 画布/图谱 | React Flow |
| 本地存储 | 文件系统 (JSON + Markdown) + SQLite (better-sqlite3, FTS5) |
| AI 引擎 | DeepSeek API (OpenAI 兼容) |
| 移动端 | PWA (Share Target + Service Worker) |
| 状态管理 | Zustand |
| 样式 | Tailwind CSS |
| 包管理 | pnpm |

## 快速开始

### 前置要求

- Node.js >= 18
- pnpm >= 8
- DeepSeek API Key（可选，不配置则跳过 AI 消化）

### 安装

```bash
git clone https://github.com/chungangatgithub/inspiration-kb.git
cd inspiration-kb
pnpm install
```

### 配置

首次运行会自动在 `~/inspiration-kb-data/` 创建数据目录和配置文件。

编辑 `~/inspiration-kb-data/config.json` 填入 API Key：

```json
{
  "dataDir": "/Users/xxx/inspiration-kb-data",
  "deepseekApiKey": "sk-your-key-here"
}
```

也可以设置环境变量 `INSPIRATION_KB_DATA_DIR` 自定义数据目录。

### 运行

```bash
# Web 开发模式
pnpm dev

# 运行测试
pnpm test

# 构建
pnpm build
```

### Electron 桌面端

```bash
NODE_ENV=development pnpm dev
```

## 数据存储

所有数据以开放文件格式存储在本地：

```
{dataDir}/
├── cards.db              # SQLite 索引（FTS5 全文搜索）
├── cards/
│   ├── {uuid-1}/
│   │   ├── card.json     # 卡片元数据
│   │   ├── body.md       # 卡片正文
│   │   └── attachments/  # 附件文件
│   │       ├── screenshot.png
│   │       └── reference.pdf
│   └── {uuid-2}/
│       └── ...
└── config.json           # 用户配置
```

`card.json` 为单一事实来源（source of truth），SQLite 仅用于加速搜索和筛选。

## AI 消化管线

提交灵感后，系统异步执行 6 步 AI 消化管线：

| 步骤 | 功能 | 输入 | 输出 |
|------|------|------|------|
| 1. 分类 | 判断来源类型 | body.md | `webpage` / `video` / `book` / ... |
| 2. 提取元数据 | 提取标题、作者等 | body + type | title + meta |
| 3. 打标签 | 生成 3-8 个标签 | body + type | tags[] |
| 4. 识别主题 | 归类到已有或新主题 | body + 已有主题池 | themes[] |
| 5. 摘要 | 一句话总结 | body | summary (≤50字) |
| 6. 发现关联 | 与已有卡片建立连接 | summary + tags vs 已有卡片 | connections[] |

任一步骤失败不影响后续步骤，最终状态标记为 `done`（全部成功）或 `partial`（部分成功）。

## 项目结构

```
src/
├── app/                      # Next.js App Router
│   ├── canvas/page.tsx       # /canvas — 无限画布浏览
│   ├── capture/page.tsx      # /capture — 灵感捕获
│   └── api/                  # API Routes
├── components/
│   ├── canvas/               # Canvas, CardNode, CardDetailSheet, SearchBar
│   ├── capture/              # CaptureForm, FileDropZone
│   └── shared/               # TypeIcon
├── services/
│   ├── card.service.ts       # 卡片 CRUD（文件 + SQLite 双写）
│   ├── file.service.ts       # 文件 IO 操作
│   ├── db.service.ts         # SQLite 操作（FTS + 连接管理）
│   ├── deepseek.client.ts    # DeepSeek API 封装
│   └── digestion/            # AI 消化管线
│       ├── pipeline.ts       # 管线编排
│       ├── steps/            # 6 个消化步骤
│       └── prompts/          # LLM prompt 模板
├── stores/                   # Zustand 状态管理
├── types/                    # TypeScript 类型定义
└── lib/                      # 工具函数和配置
```

## 边界说明

**明确属于本产品：**
- 多渠道灵感捕获与存储
- AI 自动分类、标签、摘要、关联
- 画布可视化浏览与手动整理
- 开放文件格式的数据沉淀
- 全格式附件存储

**明确不属于本产品：**
- 深度反刍与 agent 对话 — 由外部 agent 框架完成
- 内容抓取与反爬 — URL 内容获取 best-effort
- 设备间同步 — 依赖外部工具（Syncthing / iCloud）
- 社交分享与协作 — 纯个人工具

## 贡献

欢迎贡献！请查看 [CONTRIBUTING.md](./CONTRIBUTING.md) 了解开发环境设置和提交流程。

## 许可证

MIT License — 详见 [LICENSE](./LICENSE) 文件。
