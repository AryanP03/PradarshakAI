import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
import { buildSystemPrompt } from '../services/ChatOrchestrator';

async function test() {
  const prompt = buildSystemPrompt('en', undefined, {
    name: 'Aryan Phanse',
    salary: 189525,
    location: 'Pune',
    district: 'Pune',
    city: 'Pune',
    gender: 'Male',
    trade_category: 'Education'
  });
  console.log('System prompt character length:', prompt.length);
  console.log('Approximate token length:', Math.round(prompt.length / 4));

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
      max_tokens: 200,
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: 'suggest me some good educational scheme' }
      ]
    })
  });
  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Response:', text);
}
test().catch(console.error);
