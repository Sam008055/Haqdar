import * as fs from 'fs';
import * as path from 'path';
import { extractCertificateData } from '../core/ai/extract';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function main() {
  console.log("Analyzing 'income.pdf'...");
  
  const pdfPath = path.join(__dirname, '../income.pdf');
  if (!fs.existsSync(pdfPath)) {
    console.error("❌ Could not find income.pdf in the root directory!");
    return;
  }

  // Read file as base64
  const fileBuffer = fs.readFileSync(pdfPath);
  const base64Data = fileBuffer.toString('base64');
  
  try {
    const result = await extractCertificateData(base64Data, 'application/pdf');
    console.log("\n================ EXTRACTED DATA ================\n");
    console.log(JSON.stringify(result, null, 2));
    console.log("\n================================================\n");
  } catch (error) {
    console.error("Extraction failed:", error);
  }
}

main();
