import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import type { AppConfig } from "@/types/card";

function getDefaultDataDir(): string {
  return (
    process.env.INSPIRATION_KB_DATA_DIR ||
    path.join(os.homedir(), "inspiration-kb-data")
  );
}

const DEFAULT_CONFIG: AppConfig = {
  dataDir: "",
  deepseekApiKey: "",
};

export function getConfigPath(): string {
  return path.join(getDefaultDataDir(), "config.json");
}

export function loadConfig(): AppConfig {
  const dataDir = getDefaultDataDir();
  const configPath = path.join(dataDir, "config.json");
  if (!fs.existsSync(configPath)) {
    // Ensure the data directory exists
    fs.mkdirSync(dataDir, { recursive: true });
    const cfg = { ...DEFAULT_CONFIG, dataDir };
    saveConfig(cfg);
    return cfg;
  }
  const raw = fs.readFileSync(configPath, "utf-8");
  return JSON.parse(raw) as AppConfig;
}

export function saveConfig(config: AppConfig): void {
  const configPath = getConfigPath();
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
}
