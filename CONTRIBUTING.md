# Contributing to inspiration-kb

感谢你对灵感知识库的关注！欢迎任何形式的贡献。

## 开发环境设置

### 前置要求

- **Node.js** >= 18
- **pnpm** >= 8
- **Git**

### 克隆与安装

```bash
git clone https://github.com/chungangatgithub/inspiration-kb.git
cd inspiration-kb
pnpm install
```

### 配置

1. 项目首次运行会在 `~/inspiration-kb-data/` 下自动创建数据目录和 `config.json`
2. 编辑 `~/inspiration-kb-data/config.json`，填入你的 DeepSeek API Key：

```json
{
  "dataDir": "/Users/xxx/inspiration-kb-data",
  "deepseekApiKey": "sk-your-key-here"
}
```

你也可以通过环境变量 `INSPIRATION_KB_DATA_DIR` 自定义数据目录。

### 启动开发环境

```bash
# Web 端（不带 Electron）
pnpm dev
# 打开 http://localhost:3000

# Electron 桌面端（需要设置 NODE_ENV=development）
NODE_ENV=development pnpm dev
```

---

## 项目结构

```
src/
├── app/          # Next.js App Router 页面和 API 路由
├── components/   # React 组件（capture、canvas、shared）
├── services/     # 核心服务层（Card、File、Database、DeepSeek、Digestion）
├── stores/       # Zustand 状态管理
├── types/        # TypeScript 类型定义
└── lib/          # 工具函数和配置
```

## 代码规范

- 使用 TypeScript 严格模式
- 组件使用函数组件 + Hooks
- 样式使用 Tailwind CSS
- 服务层采用 TDD（测试驱动开发），新功能请编写对应测试

## 运行测试

```bash
# 运行所有测试
pnpm test

# 类型检查
pnpm exec tsc --noEmit
```

## 提交流程

1. Fork 本仓库
2. 创建功能分支：`git checkout -b feat/your-feature`
3. 编写代码和测试
4. 确保测试通过：`pnpm test`
5. 确保类型检查通过：`pnpm exec tsc --noEmit`
6. 提交代码：`git commit -m "feat: add your feature"`
7. 推送分支：`git push origin feat/your-feature`
8. 创建 Pull Request

### Commit Message 规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

- `feat:` 新功能
- `fix:` 修复 bug
- `chore:` 构建/工具/依赖变更
- `docs:` 文档更新
- `test:` 测试相关
- `refactor:` 重构

## 问题反馈

- Bug 报告和功能请求请在 [GitHub Issues](https://github.com/chungangatgithub/inspiration-kb/issues) 提交
- 提交前请搜索是否已有相关 issue
