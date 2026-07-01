import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeepSeekClient } from "../deepseek.client";

vi.mock("openai", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn(),
        },
      },
    })),
  };
});

import OpenAI from "openai";

describe("DeepSeekClient", () => {
  let client: DeepSeekClient;
  let mockCreate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new DeepSeekClient("test-api-key");
    const mockInstance = (OpenAI as unknown as ReturnType<typeof vi.fn>).mock.results[0]?.value;
    mockCreate = mockInstance?.chat.completions.create;
  });

  it("constructs with the correct baseURL and apiKey", () => {
    expect(OpenAI).toHaveBeenCalledWith({
      apiKey: "test-api-key",
      baseURL: "https://api.deepseek.com",
    });
  });

  it("chat returns message content on success", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: "Hello from DeepSeek" } }],
    });

    const result = await client.chat("system prompt", "user message");

    expect(mockCreate).toHaveBeenCalledWith({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: "system prompt" },
        { role: "user", content: "user message" },
      ],
      temperature: 0.3,
      max_tokens: 1024,
    });
    expect(result).toBe("Hello from DeepSeek");
  });

  it("chat returns empty string when content is missing", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: null } }],
    });

    const result = await client.chat("prompt", "msg");
    expect(result).toBe("");
  });

  it("chat returns empty string when choices is empty", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [],
    });

    const result = await client.chat("prompt", "msg");
    expect(result).toBe("");
  });
});
