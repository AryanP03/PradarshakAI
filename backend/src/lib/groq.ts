const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export class GroqError extends Error {
  public readonly status: number;
  public readonly isCreditError: boolean;
  public readonly isRateLimit: boolean;
  public readonly isServerError: boolean;

  constructor(status: number, rawMessage: string) {
    const apiKeyPattern = /gsk-[a-zA-Z0-9_-]{10,}/g;
    const sanitizedMsg = rawMessage.replace(apiKeyPattern, '[REDACTED]');
    super(`Groq error ${status}: ${sanitizedMsg}`);
    this.name = 'GroqError';
    this.status = status;
    this.isCreditError = status === 402 || /credit|afford|insufficient|balance/i.test(sanitizedMsg);
    this.isRateLimit = status === 429;
    this.isServerError = status >= 500;
  }
}

class GroqKeyManager {
  private keys: Array<{ key: string; status: 'available' | 'rate-limited' | 'failed'; availableAt: number }> = [];
  private currentIndex = 0;

  constructor() {
    const keysEnv = process.env.GROQ_API_KEYS;
    if (!keysEnv || keysEnv.trim() === '') {
      console.error("[GroqKeyManager] FATAL: GROQ_API_KEYS environment variable is missing or empty.");
      process.exit(1);
    }
    
    const parsedKeys = keysEnv.split(',').map(k => k.trim()).filter(k => k.length > 0);
    if (parsedKeys.length === 0) {
      console.error("[GroqKeyManager] FATAL: GROQ_API_KEYS contains no valid keys.");
      process.exit(1);
    }
    
    this.keys = parsedKeys.map(key => ({ key, status: 'available', availableAt: 0 }));
    console.log(`[GroqKeyManager] Initialized pool with ${this.keys.length} keys.`);
  }

  public static maskKey(key: string): string {
    if (key.length <= 8) return '****';
    return `...${key.slice(-4)}`;
  }

  public async getNextKey(): Promise<{ key: string; index: number }> {
    const now = Date.now();
    let minWait = Infinity;
    
    for (let i = 0; i < this.keys.length; i++) {
      const idx = (this.currentIndex + i) % this.keys.length;
      const k = this.keys[idx];
      
      if (k.status === 'failed') continue;
      
      if (k.status === 'rate-limited') {
        if (now >= k.availableAt) {
          k.status = 'available';
          console.log(`[GroqKeyManager] Key ${GroqKeyManager.maskKey(k.key)} recovered from rate limit.`);
        } else {
          const waitTime = k.availableAt - now;
          if (waitTime < minWait) minWait = waitTime;
          continue;
        }
      }
      
      this.currentIndex = (idx + 1) % this.keys.length;
      return { key: k.key, index: idx };
    }
    
    if (minWait === Infinity) {
      console.error("[GroqKeyManager] CRITICAL: All keys have permanently failed.");
      throw new Error("All Groq API keys permanently failed.");
    }
    
    console.warn(`[GroqKeyManager] ALL keys rate-limited. Waiting ${minWait}ms for the next available key...`);
    await new Promise(r => setTimeout(r, minWait));
    
    return this.getNextKey();
  }

  public markRateLimited(index: number, retryAfterSeconds: number) {
    const k = this.keys[index];
    if (k.status !== 'failed') {
      k.status = 'rate-limited';
      k.availableAt = Date.now() + retryAfterSeconds * 1000;
      console.warn(`[GroqKeyManager] Key ${GroqKeyManager.maskKey(k.key)} rate-limited. Expiry in ${retryAfterSeconds}s.`);
    }
  }

  public markFailed(index: number, reason: string) {
    const k = this.keys[index];
    k.status = 'failed';
    console.error(`[GroqKeyManager] Key ${GroqKeyManager.maskKey(k.key)} permanently failed: ${reason}. Removed from rotation.`);
  }
}

export const keyManager = new GroqKeyManager();

async function executeGroqRequest(
  body: Record<string, unknown>,
  timeoutMs: number = 45000,
  maxRetries: number = 5
): Promise<{ ok: boolean; status: number; text: string; data?: any }> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const { key, index } = await keyManager.getNextKey();
    
    try {
      const payload = { ...body };
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      // Log which key is being used for this request
      console.log(`[Groq] Using key ${GroqKeyManager.maskKey(key)} for request...`);

      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const text = await response.text();
      
      if (response.status === 401 || response.status === 403) {
        keyManager.markFailed(index, `Auth error ${response.status}`);
        continue;
      }
      
      if (response.status === 429) {
        let waitSecs = 60;
        const retryAfterHeader = response.headers.get('retry-after');
        if (retryAfterHeader) {
          waitSecs = parseFloat(retryAfterHeader) || 60;
        } else {
          const match = text.match(/Please try again in ([0-9.]+)s/);
          if (match) {
            waitSecs = parseFloat(match[1]);
          }
        }
        
        if (waitSecs < 1) waitSecs = 1;
        keyManager.markRateLimited(index, waitSecs);
        continue;
      }
      
      let data: any;
      try {
        data = JSON.parse(text);
      } catch { }

      return { ok: response.ok, status: response.status, text, data };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.warn(`[Groq] Request timed out with key ${GroqKeyManager.maskKey(key)}`);
      } else {
        console.warn(`[Groq] Network error with key ${GroqKeyManager.maskKey(key)}:`, err.message);
      }
      
      if (attempt === maxRetries) {
        return { ok: false, status: 500, text: (err as Error)?.message || 'Network error' };
      }
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
    }
  }
  return { ok: false, status: 500, text: 'Max retries exceeded' };
}

export async function llmCall(params: {
  model?: string;
  systemPrompt: string;
  userMessage: string;
  jsonMode?: boolean;
  maxTokens?: number;
}): Promise<string> {
  const initialModel = params.model || process.env.GROQ_DEFAULT_MODEL || 'openai/gpt-oss-120b';
  const initialTokens = Math.min(params.maxTokens ?? 180, 180);

  const baseBody = {
    model: initialModel,
    max_tokens: initialTokens,
    messages: [
      { role: 'system', content: params.systemPrompt },
      { role: 'user', content: params.userMessage },
    ],
    ...(params.jsonMode && { response_format: { type: 'json_object' } }),
  };

  const res = await executeGroqRequest(baseBody);

  if (!res.ok) {
    throw new GroqError(res.status, res.text);
  }

  return res.data.choices[0].message.content;
}

// ── Multi-turn / tool-calling support ─────────────────────────────────────────

export interface ToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
}

export interface ToolDef {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface AssistantMessage {
  role: string;
  content: string | null;
  tool_calls?: ToolCall[];
}

export async function llmChat(params: {
  model?: string;
  messages: ChatMessage[];
  tools?: ToolDef[];
  maxTokens?: number;
}): Promise<AssistantMessage> {
  const initialModel = params.model || process.env.GROQ_STRONG_MODEL || process.env.GROQ_DEFAULT_MODEL || 'openai/gpt-oss-120b';
  const initialTokens = Math.min(params.maxTokens ?? 700, 1024);

  const baseBody = {
    model: initialModel,
    max_tokens: initialTokens,
    messages: params.messages,
    ...(params.tools && params.tools.length > 0 ? { tools: params.tools, tool_choice: 'auto' } : {}),
  };

  const res = await executeGroqRequest(baseBody);
  if (!res.ok) {
    console.warn(`[Groq] initial model ${initialModel} returned ${res.status}:`, res.text);
    throw new GroqError(res.status, res.text);
  }

  const rawMessage = res.data?.choices?.[0]?.message;
  if (!rawMessage) {
    return { role: 'assistant', content: null };
  }

  // Sanitize content from reasoning models that leak thinking tags
  let content = rawMessage.content;
  if (content) {
    content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    if (/here['’]s a thinking process/i.test(content) || /thinking process:/i.test(content)) {
      const paragraphs = content.split(/\n\s*\n/);
      const filtered = paragraphs.filter(
        (p: string) =>
          !/thinking process/i.test(p) &&
          !/analyze user/i.test(p) &&
          !/identify key/i.test(p) &&
          !/parameters for/i.test(p) &&
          !/actually, the tool/i.test(p) &&
          !/let's check/i.test(p)
      );
      content = filtered.join('\n\n').trim();
    }
  }

  return {
    role: rawMessage.role || 'assistant',
    content: content || null,
    tool_calls: rawMessage.tool_calls,
  };
}
