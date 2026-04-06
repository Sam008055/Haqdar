import Anthropic from '@anthropic-ai/sdk';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function testClaude() {
  const key = process.env.CLAUDE_API_KEY;
  console.log('Claude key present:', !!key);
  console.log('Key prefix:', key?.slice(0, 15) + '...');

  if (!key) {
    console.error('No CLAUDE_API_KEY found');
    return;
  }

  try {
    const anthropic = new Anthropic({ apiKey: key });
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-latest",
      max_tokens: 100,
      messages: [{
        role: "user",
        content: "Reply with just: CLAUDE_OK"
      }],
    });
    console.log('✅ Claude works! Response:', (response.content[0] as any).text);
  } catch (e: any) {
    console.error('❌ Claude failed:', e?.message || e);
  }
}

async function testGemini() {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const key = process.env.GEMINI_API_KEY;
  console.log('\nGemini key present:', !!key);

  if (!key) {
    console.error('No GEMINI_API_KEY found');
    return;
  }

  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
    const result = await model.generateContent("Reply with just: GEMINI_OK");
    console.log('✅ Gemini works! Response:', result.response.text());
  } catch (e: any) {
    console.error('❌ Gemini failed:', e?.message?.slice(0, 200) || e);
  }
}

testGemini();
testClaude();
