import { Router, Request, Response } from 'express';
import { generateSpeech } from '../services/TTSService';
import { getLanguageConfig } from '../config/languages';

const router = Router();

// POST /api/tts
router.post('/', async (req: Request, res: Response) => {
  const { text, language } = req.body as { text?: string; language?: string };

  if (!text || typeof text !== 'string' || !text.trim()) {
    res.status(400).json({ error: 'text parameter is required and must be a non-empty string' });
    return;
  }

  let lang = (language && typeof language === 'string' ? language : 'en').toLowerCase().trim();

  // Script-based language guard: if text contains native Indian script characters, ensure TTS uses the matching language model
  if (/[\u0900-\u097F]/.test(text)) {
    // Devanagari script: Default to Marathi if explicitly requested as 'mr', otherwise Hindi 'hi'
    if (lang !== 'mr') lang = 'hi';
  } else if (/[\u0980-\u09FF]/.test(text)) {
    lang = 'bn';
  } else if (/[\u0A80-\u0AFF]/.test(text)) {
    lang = 'gu';
  } else if (/[\u0A00-\u0A7F]/.test(text)) {
    lang = 'pa';
  } else if (/[\u0B80-\u0BFF]/.test(text)) {
    lang = 'ta';
  } else if (/[\u0C00-\u0C7F]/.test(text)) {
    lang = 'te';
  } else if (/[\u0C80-\u0CFF]/.test(text)) {
    lang = 'kn';
  } else if (/[\u0D00-\u0D7F]/.test(text)) {
    lang = 'ml';
  } else if (/[\u0B00-\u0B7F]/.test(text)) {
    lang = 'od';
  }

  const langConfig = getLanguageConfig(lang);
  if (!langConfig) {
    res.status(400).json({ error: `Unsupported language: "${language}"` });
    return;
  }

  try {
    const audioBuffer = await generateSpeech(text, langConfig.id);
    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Content-Length', audioBuffer.length);
    res.send(audioBuffer);
  } catch (err) {
    const msg = (err as Error)?.message || String(err);
    console.error('[tts-route-error]', msg);
    res.status(500).json({ error: 'Failed to generate speech audio', detail: msg });
  }
});

export default router;
