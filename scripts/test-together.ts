import * as dotenv from 'dotenv';
import path from 'path';
import OpenAI from 'openai';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function testTogether() {
  const key = process.env.TOGETHER_API_KEY;
  console.log('Together key present:', !!key);

  if (!key) {
    console.error('No TOGETHER_API_KEY found');
    return;
  }

  try {
    const openai = new OpenAI({
      apiKey: key,
      baseURL: "https://api.together.xyz/v1",
    });

    const response = await openai.chat.completions.create({
      model: "meta-llama/Llama-Vision-Free",
      messages: [
        {
          role: "user",
          content: "Respond with exactly: TOGETHER_WORKING"
        }
      ]
    });
    
    console.log('✅ Together text test succeeded:', response.choices[0]?.message?.content);
  } catch (e: any) {
    console.error('❌ Together text failed. Message:', e?.message || e);
    if (e.status) console.error('Status:', e.status);
  }
}

testTogether();
