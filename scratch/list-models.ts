import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is missing in .env");
    process.exit(1);
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  try {
    // List models is not directly on genAI, but we can do a fetch request or use standard API
    // Let's call standard fetch to list models.
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    console.log("Available models:");
    if (data.models) {
      for (const m of data.models) {
        console.log(`- ${m.name} (DisplayName: ${m.displayName})`);
      }
    } else {
      console.log(data);
    }
  } catch (error) {
    console.error("Error listing models:", error);
  }
}

main();
