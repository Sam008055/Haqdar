import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function check() {
  const url = 'https://api.groq.com/openai/v1/models';
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` }
  });
  const data = await res.json();
  const visionModels = data.data.filter((m: any) => m.id.includes('vision') || m.id.includes('llama-3.2')).map((m: any) => m.id);
  console.log("Active Groq Vision Models: ", visionModels);
}
check();
