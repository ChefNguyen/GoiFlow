import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

async function testModel(modelName: string, config: any) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is missing in .env");
    process.exit(1);
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  console.log(`\n--- Testing ${modelName} with config:`, JSON.stringify(config), "---");
  try {
    const model = genAI.getGenerativeModel({
      model: modelName,
      ...config
    });

    const prompt = `
Word: 相変わらず
Reading: あいかわらず
Part of speech: adverb
English meanings: as ever, as usual, the same

Rules:
- Return only a JSON object with one field: "meaningsVi" (array of strings).
- Each meaning should be a natural Vietnamese phrase, not a literal character-by-character translation.
- Maximum 5 meanings. If you are unsure, return fewer.
- Do NOT include any explanation, markdown, or extra text — pure JSON only.

JSON response:`;

    const res = await model.generateContent(prompt);
    const text = res.response.text();
    console.log("SUCCESS! Raw output:");
    console.log(text);
  } catch (error: any) {
    console.error("FAILED! Error details:");
    console.error(error?.message || error);
  }
}

async function main() {
  await testModel("gemma-4-26b-a4b-it", {
    systemInstruction: {
      role: "system",
      parts: [{ text: "You are a Japanese-Vietnamese linguistic expert. Translate the Japanese word into natural Vietnamese meanings." }]
    }
  });

  await testModel("gemma-4-26b-a4b-it", {});

  await testModel("gemma-2-27b-it", {});
}

main();
