import { describe, expect, it, vi } from "vitest";
import { OpenAiCompatibleRuntimeAdapter } from "../src/lib/ai/adapters/openai-compatible-runtime-adapter";
import { AnthropicRuntimeAdapter } from "../src/lib/ai/adapters/anthropic-runtime-adapter";

describe("OpenAI-compatible runtime adapter", () => {
  it("sends the configured credential and normalizes completion usage", async () => {
    const fetchMock = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      expect(init?.headers).toMatchObject({ Authorization: "Bearer sk-or-test" });
      return new Response(
        JSON.stringify({
          model: "openai/gpt-4.1-mini",
          choices: [{ message: { content: "{\"ok\":true}" } }],
          usage: { prompt_tokens: 12, completion_tokens: 5 },
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    });
    const adapter = new OpenAiCompatibleRuntimeAdapter(
      "openrouter",
      "https://openrouter.ai/api/v1",
      "sk-or-test",
      fetchMock as typeof fetch
    );

    const result = await adapter.generateCompletion("openai/gpt-4.1-mini", {
      systemPrompt: "Return JSON",
      userPrompt: "Test",
      jsonSchema: { type: "object" },
    });

    expect(result.content).toBe('{"ok":true}');
    expect(result.parsedJson).toEqual({ ok: true });
    expect(result.promptTokens).toBe(12);
    expect(result.completionTokens).toBe(5);
  });
});

describe("Anthropic runtime adapter", () => {
  it("normalizes Claude message content and usage", async () => {
    const fetchMock = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      expect(init?.headers).toMatchObject({ "x-api-key": "sk-ant-test" });
      return new Response(
        JSON.stringify({
          model: "claude-sonnet-4-5",
          content: [{ type: "text", text: "Hello" }],
          usage: { input_tokens: 9, output_tokens: 3 },
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    });
    const adapter = new AnthropicRuntimeAdapter(
      "https://api.anthropic.com/v1",
      "sk-ant-test",
      fetchMock as typeof fetch
    );

    const result = await adapter.generateCompletion("claude-sonnet-4-5", {
      systemPrompt: "Be concise",
      userPrompt: "Hello",
    });

    expect(result.content).toBe("Hello");
    expect(result.promptTokens).toBe(9);
    expect(result.completionTokens).toBe(3);
  });
});
