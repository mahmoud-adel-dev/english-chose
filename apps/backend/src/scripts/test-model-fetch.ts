import path from "node:path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function main() {
  const key = process.env.GEMINI_API_KEY;
  for (const m of ["gemini-flash-latest", "gemini-3.8-flash", "gemini-3.5-flash", "gemini-3.7-flash"]) {
    console.log(`Testing ${m}...`);
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: "Hello, reply with 1 word" }] }],
      }),
    });
    const data = await res.json();
    if (res.ok) {
      console.log(`SUCCESS for ${m}:`, data.candidates?.[0]?.content?.parts?.[0]?.text);
      return;
    } else {
      console.log(`FAILED for ${m}:`, data.error?.message);
    }
  }
}

main();
