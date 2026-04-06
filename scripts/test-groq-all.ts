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
  const models = data.data.map((m: any) => m.id);
  console.log("ALL Active Groq Models: ", models);
}
check();
