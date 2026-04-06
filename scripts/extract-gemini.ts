import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function extractPDF() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.error("No Gemini API key found");
    return;
  }

  const pdfPath = path.join(__dirname, '../income.pdf');
  const base64Data = fs.readFileSync(pdfPath).toString("base64");

  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  console.log("Sending income.pdf to Gemini for analysis...");

  try {
    const result = await model.generateContent([
      "Extract ALL TEXT from this document completely verbatim. Do not summarize.",
      {
        inlineData: {
          data: base64Data,
          mimeType: "application/pdf"
        }
      }
    ]);
    const extractedText = result.response.text();
    fs.writeFileSync(path.join(__dirname, '../extracted.txt'), extractedText);
    console.log("Successfully wrote text to extracted.txt");
  } catch (err: any) {
    console.error("Gemini Extraction Error:", err.message);
  }
}

extractPDF();
