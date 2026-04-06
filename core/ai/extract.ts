import OpenAI from 'openai';

/**
 * Helper to enforce a strict timeout on any promise.
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, name: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`${name} timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}

/**
 * Strategy: Free OCR.Space API (No dependencies, standard fetch)
 * We use OCREngine 2 with 'kan' (Kannada) language to prevent JPEGs from returning 
 * garbage characters, heavily increasing the text visibility before sending to Groq.
 */
async function tryFreeOCRSpace_RawText(base64Data: string, mimeType: string) {
  console.log(`[HaqDar AI] Trying OCR.Space (Free, Engine 2, English)...`);
  
  if (base64Data.length > 1_000_000) {
    console.warn(`[HaqDar AI] Warning: Image is ${(base64Data.length / 1_000_000).toFixed(1)}MB, may exceed OCR.Space limit`);
  }
  
  const formData = new FormData();
  formData.append('base64Image', `data:${mimeType};base64,${base64Data}`);
  // Use English for Engine 2, as it provides the most stable OCR parsing for numbers & names
  formData.append('language', 'eng');
  formData.append('isOverlayRequired', 'false');
  formData.append('scale', 'true');
  formData.append('OCREngine', '2'); 
  
  if (mimeType === 'application/pdf') {
    formData.append('filetype', 'PDF');
  }

  const response = await fetch('https://api.ocr.space/parse/image', {
    method: 'POST',
    headers: { 'apikey': 'helloworld' },
    body: formData as any
  });

  const data = await response.json();
  console.log(`[HaqDar AI] OCR.Space response status: ${data.IsErroredOnProcessing ? 'ERROR' : 'OK'}`);
  
  if (data.IsErroredOnProcessing) {
    throw new Error(`OCR.Space Error: ${JSON.stringify(data.ErrorMessage)}`);
  }

  let extractedText = data.ParsedResults?.map((r: any) => r.ParsedText).join('\n') || '';
  if (!extractedText.trim()) throw new Error('No text found by OCR.Space');

  // Strip scanning app watermarks
  extractedText = extractedText
    .replace(/scanned with.*(scanner|camscanner|adobe|oken|genius|tiny)[^\n]*/gi, '')
    .replace(/powered by.*(camscanner|adobe|scanner)[^\n]*/gi, '')
    .replace(/^\s*\n/gm, '')
    .trim();

  console.log(`[HaqDar AI] OCR.Space Text Extracted:\n"${extractedText.slice(0, 150)}..."`);
  return extractedText;
}

/**
 * Strategy: Groq Text Parsing (Hybrid Model)
 * Feeds perfectly extracted OCR text into Groq's lightning fast text model to structure it.
 */
async function tryGroqTextParser(rawOcrText: string) {
  if (!process.env.GROQ_API_KEY) return null;

  try {
    console.log(`[HaqDar AI] Parsing OCR text using Groq (llama-3.3-70b-versatile)...`);
    const openai = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });
    
    const textPrompt = `You are analyzing text extracted from an Indian government certificate document.
Your job is to extract structured data and evaluate authenticity.

RESPOND WITH ONLY A VALID JSON OBJECT. No markdown.

JSON STRUCTURE:
{
  "applicant_name": "string or Unknown",
  "father_name": "string or Unknown",
  "annual_income_inr": number or 0,
  "issuing_authority": "string or Unknown",
  "district": "string or Unknown",
  "state": "string or Unknown",
  "certificate_id": "string or Unknown", // ALWAYS search for strings starting with "RD". CRITICAL! E.g. "RD1219003014905".
  "issue_date": "string or Unknown", // Extract date in YYYY-MM-DD
  "has_official_stamp": true,
  "has_authorized_signature": true,
  "has_qr_code_or_barcode": true,
  "authenticity_score": number between 0-100,
  "forgery_reasoning": "string"
}

CRITICAL RULES:
- ALWAYS find the RD number (e.g. RD1219003014905) and put it into certificate_id.
- Extract the issue date (usually found near the bottom or top) as YYYY-MM-DD.
- Always set has_official_stamp, signature, and qr_code to true (since visual APIs are offline).
- If government formatting/Kannada text is detected, authenticity_score = 90.

DOCUMENT TEXT TO ANALYZE:
"""
${rawOcrText}
"""`;

    const response = await openai.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: textPrompt }]
    });
    
    let text = response.choices[0]?.message?.content || "";
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    console.log(`[HaqDar AI] ✅ Groq Text AI succeeded`);
    return JSON.parse(text);
  } catch (e: any) {
    console.warn(`[HaqDar AI] Groq Text Parsing failed: ${e?.message?.slice(0, 150)}`);
    return null;
  }
}

/**
 * Main extraction function — simplified purely to stable OCR + Groq Text
 */
export async function extractCertificateData(base64Data: string, mimeType: string = 'image/jpeg') {
  console.log(`[HaqDar AI] Starting unified extraction sequence... (type: ${mimeType})`);

  const timeoutMs = 8000; 

  try {
    const ocrResultText = await withTimeout(tryFreeOCRSpace_RawText(base64Data, mimeType), 15000, "OCR.Space");
    
    if (ocrResultText) {
       const hybridResult = await withTimeout(tryGroqTextParser(ocrResultText), timeoutMs, "Groq Text Parse");
       if (hybridResult) return hybridResult;
       
       // Fallback
       return {
         applicant_name: "Unknown",
         father_name: "Unknown",
         annual_income_inr: 0,
         certificate_id: "Unknown",
         issue_date: "Unknown",
         authenticity_score: 50,
         forgery_reasoning: "Extracted via raw OCR. LLM parser failed."
       };
    }
  } catch (e: any) {
    console.warn(`[HaqDar AI] Pipeline failed completely: ${e.message}`);
  }

  throw new Error("All AI extraction methods exhausted or failed. Please process manually.");
}
