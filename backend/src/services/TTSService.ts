import { getLanguageConfig } from '../config/languages';

const SARVAM_TTS_URL = 'https://api.sarvam.ai/text-to-speech';

function sanitizeTextForSpeech(text: string, langCode: string = 'en'): string {
  let cleaned = text
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Bold
    .replace(/\*([^*]+)\*/g, '$1') // Italics
    .replace(/`([^`]+)`/g, '$1') // Code
    .replace(/#{1,6}\s+/g, '') // Headings
    .replace(/^\s*[-*]\s+/gm, '') // Bullet lists
    .replace(/^\s*\d+\.\s+/gm, '') // Numbered lists
    .replace(/\s+/g, ' ') // Collapse whitespace
    .trim();

  if (langCode === 'hi') {
    cleaned = cleaned.replace(/₹\s*(\d+(?:\.\d+)?)/g, '$1 रुपये').replace(/₹/g, 'रुपये ').replace(/%/g, ' प्रतिशत');
  } else if (langCode === 'mr') {
    cleaned = cleaned.replace(/₹\s*(\d+(?:\.\d+)?)/g, '$1 रुपये').replace(/₹/g, 'रुपये ').replace(/%/g, ' टक्के');
  } else if (langCode === 'bn') {
    cleaned = cleaned.replace(/₹\s*(\d+(?:\.\d+)?)/g, '$1 টাকা').replace(/₹/g, 'টাকা ').replace(/%/g, ' শতাংশ');
  } else {
    cleaned = cleaned.replace(/₹\s*(\d+(?:\.\d+)?)/g, 'Rupees $1').replace(/₹/g, 'Rupees ').replace(/%/g, ' percent');
  }

  return cleaned;
}

export async function generateSpeech(text: string, language: string): Promise<Buffer> {
  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) {
    throw new Error('SARVAM_API_KEY is not configured on the backend');
  }

  const langConfig = getLanguageConfig(language);
  if (!langConfig) {
    throw new Error(`Unsupported language code: "${language}"`);
  }

  const cleanText = sanitizeTextForSpeech(text, langConfig.id);
  if (!cleanText) {
    throw new Error('Text parameter cannot be empty after sanitization');
  }

  const targetLanguageCode = langConfig.sarvamTtsCode;

  const payload = {
    text: cleanText,
    target_language_code: targetLanguageCode,
    speaker: process.env.SARVAM_TTS_SPEAKER || 'shubh',
    model: 'bulbul:v3',
  };

  const response = await fetch(SARVAM_TTS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-subscription-key': apiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Sarvam TTS API request failed (${response.status}): ${errorText || response.statusText}`);
  }

  const data = (await response.json()) as { audios?: string[] };
  if (!data.audios || !data.audios[0]) {
    throw new Error('Sarvam TTS API returned invalid or empty audio output');
  }

  return Buffer.from(data.audios[0], 'base64');
}
