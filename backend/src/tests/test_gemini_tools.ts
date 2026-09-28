import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
import { TOOL_DEFS } from '../services/Tools';

async function test() {
  const apiKey = process.env.GROQ_API_KEY;
  const model = 'openai/gpt-oss-120b';
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
      max_tokens: 300,
      messages: [
        {
          role: 'system',
          content: `You are PradarshakAI, an expert AI advisor for National Scheduled Castes Finance and Development Corporation (NSFDC).
The user is Aryan Phanse, SC category, income 189525, location Pune.
Always call tools when asked about schemes, loans, documents, emi, partners. Never guess.`
        },
        { role: 'user', content: 'suggest me some good educational scheme' }
      ],
      tools: TOOL_DEFS,
      tool_choice: 'auto'
    })
  });
  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Body:', text);
}
test().catch(console.error);
