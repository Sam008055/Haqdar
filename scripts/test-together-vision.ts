import * as dotenv from 'dotenv';
import path from 'path';
import OpenAI from 'openai';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function testTogetherVision() {
  const key = process.env.TOGETHER_API_KEY;
  if (!key) return console.error('No KEY');

  // Hardcoded 1x1 black pixel GIF for a quick token test
  const base64Data = "R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=";

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
          content: [
            { type: "text", text: "Describe the image in one word." },
            { type: "image_url", image_url: { url: `data:image/gif;base64,${base64Data}` } }
          ]
        }
      ]
    });
    
    console.log('✅ Together Vision test succeeded:', response.choices[0]?.message?.content);
  } catch (e: any) {
    console.error('❌ Together Vision failed. Message:', e?.message || e);
    console.error(e);
  }
}

testTogetherVision();
