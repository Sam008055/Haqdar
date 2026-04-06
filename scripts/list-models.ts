import * as dotenv from 'dotenv';
import path from 'path';
import Groq from 'groq-sdk';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function listGroqModels() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return;
  const groq = new Groq({ apiKey });
  const models = await groq.models.list();
  console.log("Active Models:");
  models.data.forEach(m => console.log(m.id));
}

listGroqModels();
