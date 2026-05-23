import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is missing in .env");
    process.exit(1);
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

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

  try {
    const res = await model.generateContent(prompt);
    const text = res.response.text();
    console.log("RAW TEXT:");
    console.log(text);
    console.log("--------------------");
    const jsonMatch = text.match(/{[\s\S]*}/);
    if (jsonMatch) {
      console.log("PARSED OBJECT:", JSON.parse(jsonMatch[0]));
    } else {
      console.log("No JSON found");
    }
  } catch (error) {
    console.error("Error calling Gemini 3.5:", error);
  }
}

main();
