import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is missing in .env");
    process.exit(1);
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemma-2-27b-it",
    systemInstruction: {
      role: "system",
      parts: [{ text: "You are a Japanese-Vietnamese linguistic expert. Translate the Japanese word into natural Vietnamese meanings." }]
    }
  });

  const prompt = `
Word: 相変わらず
Reading: あいかわらず
Part of speech: adverb, nouns which may take the genitive case particle 'no'
English meanings: as ever, as usual, the same

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
    
    // Robust parsing logic
    let jsonStr = "";
    const mdMatch = text.match(/```json\s*({[\s\S]*?})\s*```/i) || text.match(/```\s*({[\s\S]*?})\s*```/i);
    if (mdMatch?.[1]) {
      jsonStr = mdMatch[1].trim();
      console.log("Matched via Markdown block");
    } else {
      const firstJsonMatch = text.match(/{[\s\S]*?}/);
      if (firstJsonMatch) {
        jsonStr = firstJsonMatch[0].trim();
        console.log("Matched via first non-greedy JSON pattern");
      } else {
        const greedyMatch = text.match(/{[\s\S]*}/);
        if (greedyMatch) {
          jsonStr = greedyMatch[0].trim();
          console.log("Matched via greedy JSON pattern");
        }
      }
    }

    if (!jsonStr) {
      throw new Error("No JSON found in text");
    }

    let parsed: any;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (parseError) {
      const greedyMatch = text.match(/{[\s\S]*}/);
      if (greedyMatch) {
        parsed = JSON.parse(greedyMatch[0]);
        console.log("Parsed via greedy fallback");
      } else {
        throw parseError;
      }
    }

    console.log("PARSED OBJECT:", parsed);
  } catch (error) {
    console.error("Error calling Gemma:", error);
  }
}

main();
