import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function extractPDF() {
  const key = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
  if (!key) {
    console.error("No Claude API key found");
    return;
  }

  const pdfPath = path.join(__dirname, '../income.pdf');
  const base64Data = fs.readFileSync(pdfPath).toString("base64");

  const anthropic = new Anthropic({ apiKey: key.trim() });

  console.log("Sending income.pdf to Claude 3.5 Sonnet for analysis...");

  try {
    const msg = await anthropic.messages.create({
      model: "claude-3-5-sonnet-latest",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: base64Data
              }
            },
            {
              type: "text",
              text: "Extract ALL TEXT from this document completely verbatim. Do not summarize."
            }
          ]
        }
      ]
    });
    
    // @ts-ignore
    const extractedText = msg.content[0].text;
    fs.writeFileSync(path.join(__dirname, '../extracted.txt'), extractedText);
    console.log("Successfully wrote text to extracted.txt");
  } catch (err: any) {
    console.error("Claude Extraction Error:", err.message);
  }
}

extractPDF();
