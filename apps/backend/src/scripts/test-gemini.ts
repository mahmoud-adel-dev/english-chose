import path from "node:path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
import { GeminiAiProviderAdapter } from "../lib/ai/adapters/gemini-adapter";

async function main() {
  const key = process.env.GEMINI_API_KEY;
  console.log("Testing with key:", key ? `${key.slice(0, 6)}...${key.slice(-4)}` : "MISSING");

  const adapter = new GeminiAiProviderAdapter(key || "");
  const models = ["gemini-3.8-flash", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

  for (const model of models) {
    try {
      console.log(`Testing model: ${model}...`);
      const res = await adapter.generateCompletion(model, {
        prompt: "Say hello",
        userPrompt: "Hello",
        maxTokens: 50,
      });
      console.log(`SUCCESS for ${model}:`, res.content);
      return;
    } catch (e: any) {
      console.error(`FAILED for ${model}:`, e.message || e);
    }
  }
}

main().finally(() => process.exit(0));
