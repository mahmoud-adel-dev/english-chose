import path from "node:path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function main() {
  const key = process.env.GEMINI_API_KEY;
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
  const data = await res.json();
  if (data.models) {
    console.log("Available models:", data.models.map((m: any) => m.name.replace("models/", "")));
  } else {
    console.log("Error response:", JSON.stringify(data));
  }
}

main().finally(() => process.exit(0));
