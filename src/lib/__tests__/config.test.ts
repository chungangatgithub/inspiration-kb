import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { getConfigPath, loadConfig, saveConfig } from "../config";
import type { AppConfig } from "@/types/card";

const TEST_HOME = path.join(os.tmpdir(), "inspiration-kb-test-config");

describe("config", () => {
  beforeEach(() => {
    process.env.INSPIRATION_KB_DATA_DIR = TEST_HOME;
    // Clean and recreate test directory
    if (fs.existsSync(TEST_HOME)) {
      fs.rmSync(TEST_HOME, { recursive: true });
    }
  });

  afterEach(() => {
    delete process.env.INSPIRATION_KB_DATA_DIR;
    if (fs.existsSync(TEST_HOME)) {
      fs.rmSync(TEST_HOME, { recursive: true });
    }
  });

  it("loadConfig returns defaults when no config file exists", () => {
    const config = loadConfig();
    expect(config).toBeDefined();
    expect(config.deepseekApiKey).toBe("");
    expect(config.dataDir).toBeDefined();
    expect(config.dataDir).toContain("inspiration-kb-test-config");
  });

  it("saveConfig writes valid JSON and loadConfig reads it back", () => {
    const testConfig: AppConfig = {
      dataDir: "/tmp/test-kb",
      deepseekApiKey: "sk-test-123",
    };
    saveConfig(testConfig);
    const loaded = loadConfig();
    expect(loaded.dataDir).toBe("/tmp/test-kb");
    expect(loaded.deepseekApiKey).toBe("sk-test-123");
  });

  it("config path is inside data dir", () => {
    const configPath = getConfigPath();
    expect(configPath).toContain("inspiration-kb-test-config");
    expect(configPath).toContain("config.json");
  });
});
