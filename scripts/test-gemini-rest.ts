import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function check() {
  console.log("Testing raw Gemini REST API bypassing SDK...");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`;
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: "Hello! If you can read this, reply 'WORKING_GEMINI'" }] }] })
    });
    const data = await res.json();
    console.log("RESPONSE:", JSON.stringify(data, null, 2));
  } catch (err: any) {
    console.error("FAIL:", err.message);
  }
}
check();
