import { getLanguageConfig } from '../config/languages';
import { pool } from '../db/pool';

const SARVAM_TRANSLATE_URL = 'https://api.sarvam.ai/translate';

interface TranslationCache {
  id: number;
  original_text: string;
  target_language: string;
  translated_text: string;
}

export async function translateText(text: string, targetLangCode: string): Promise<string> {
  if (!text || text.trim() === '' || targetLangCode === 'en') return text;
  
  const langConfig = getLanguageConfig(targetLangCode);
  if (!langConfig || !langConfig.sarvamSttCode) return text;
  
  const targetCode = langConfig.sarvamSttCode; // e.g. hi-IN
  
  try {
    // 1. Check DB Cache
    const { rows } = await pool.query<TranslationCache>(
      'SELECT translated_text FROM translation_cache WHERE original_text = $1 AND target_language = $2',
      [text, targetCode]
    );
    if (rows.length > 0) return rows[0].translated_text;

    // 2. Call Sarvam API
    const apiKey = process.env.SARVAM_API_KEY;
    if (!apiKey) return text;

    const payload = {
      input: text,
      source_language_code: "en-IN",
      target_language_code: targetCode,
      speaker_gender: "Male",
      mode: "formal",
      algo: "sarvam",
      enable_preprocessing: true
    };

    const response = await fetch(SARVAM_TRANSLATE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`[TranslationService] Sarvam API failed (${response.status}): ${errorText}`);
      return text;
    }

    const data = await response.json() as { translated_text: string };
    const translated = data.translated_text;
    
    if (translated) {
      // 3. Save to Cache
      try {
        await pool.query(
          'INSERT INTO translation_cache (original_text, target_language, translated_text) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
          [text, targetCode, translated]
        );
      } catch (dbErr) {
        // Table might not exist, silently ignore
      }
      return translated;
    }
  } catch (err) {
    console.warn('[TranslationService] Error translating:', err);
  }
  return text;
}
