import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

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
      messages: [{ role: 'user', content: 'hello' }]
    })
  });
  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Body:', text);
}
test().catch(console.error);
