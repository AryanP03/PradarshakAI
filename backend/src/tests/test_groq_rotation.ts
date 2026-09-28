import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { llmCall, keyManager } from '../lib/groq';

async function simulateRateLimit() {
  console.log('Testing Groq key rotation and fallback...');
  
  const { key: firstKey, index: firstIndex } = await keyManager.getNextKey();
  console.log(`Manually marking first key ${keyManager['maskKey']?.(firstKey) || firstKey.slice(-4)} as rate-limited for 10 seconds.`);
  keyManager.markRateLimited(firstIndex, 10);
  
  console.log('\n--- Making request ---');
  try {
    const response = await llmCall({
      userMessage: 'What is 2+2? Reply in one word.',
      systemPrompt: 'You are a helpful assistant.',
      model: 'openai/gpt-oss-120b',
      maxTokens: 10
    });
    console.log(`Request successful! Response: "${response.trim()}"`);
  } catch (error) {
    console.error('Request failed:', error);
  }
  
  console.log('\n--- Making another request (should use the next available key) ---');
  try {
    const response = await llmCall({
      userMessage: 'What is 3+3? Reply in one word.',
      systemPrompt: 'You are a helpful assistant.',
      model: 'openai/gpt-oss-120b',
      maxTokens: 10
    });
    console.log(`Request successful! Response: "${response.trim()}"`);
  } catch (error) {
    console.error('Request failed:', error);
  }
}

simulateRateLimit().catch(console.error);

