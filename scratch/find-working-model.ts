import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

const modelsToTest = [
  "gemini-2.5-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.5-flash-lite",
  "gemini-1.5-pro",
  "gemini-2.5-pro",
  "gemini-1.5-flash",
  "gemma-4-31b-it",
];

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is missing in .env");
    process.exit(1);
  }
  const genAI = new GoogleGenerativeAI(apiKey);

  const prompt = `
You are a Japanese-Vietnamese linguistic expert.
Translate the Japanese word into natural Vietnamese meanings.

Word: 直角
Reading: ちょっかく
Part of speech: noun, no-adjective
English meanings: right angle

Rules:
- Return only a JSON object with one field: "meaningsVi" (array of strings).
- Each meaning should be a natural Vietnamese phrase, not a literal character-by-character translation.
- Maximum 5 meanings. If you are unsure, return fewer.
- Do NOT include any explanation, markdown, or extra text — pure JSON only.

JSON response:`;

  for (const modelName of modelsToTest) {
    console.log(`Testing model: ${modelName}...`);
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const res = await model.generateContent(prompt);
      const text = res.response.text();
      console.log(`✅ Success with ${modelName}!`);
      console.log("RAW TEXT:", text);
      const jsonMatch = text.match(/{[\s\S]*}/);
      if (jsonMatch) {
        console.log("PARSED:", JSON.parse(jsonMatch[0]));
      }
      console.log("-----------------------------------------");
    } catch (error: any) {
      console.log(`❌ Failed with ${modelName}: ${error?.message || error}`);
      console.log("-----------------------------------------");
    }
  }
}

main();
