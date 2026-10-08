import { getLanguageConfig, LanguageConfig } from '../config/languages';
import { detectLanguage } from './IntentClassifier';

export interface LanguageResolutionInput {
  selectedLanguage?: string | null;
  detectedSpeechLanguage?: string | null;
  speechProbability?: number | null;
  message?: string | null;
  sessionLanguage?: string | null;
}

export interface LanguageResolutionResult {
  effectiveLanguage: string;
  resolutionSource: 'user_selection' | 'speech_detection' | 'text_detection' | 'session_persistence' | 'fallback' | 'unsupported_selection';
  isSupported: boolean;
  languageConfig: LanguageConfig | null;
  speechProbability: number | null;
}

/**
 * Detects if the user explicitly requested a language in their message text.
 * e.g., "in Hindi", "answer in Hindi", "explain those in Hindi", "in English", "हिंदी में", etc.
 */
export function detectExplicitLanguageRequest(message?: string | null): string | null {
  if (!message || typeof message !== 'string') return null;
  const lower = message.toLowerCase().trim();

  // English switch request
  if (
    /\b(in\s*english|answer\s*in\s*english|speak\s*in\s*english|reply\s*in\s*english|tell\s*me\s*in\s*english|switch\s*to\s*english|talk\s*in\s*english|use\s*english|अंग्रेजी\s*में|इंग्लिश\s*में)\b/i.test(lower)
  ) {
    return 'en';
  }

  // Hindi switch request
  if (
    /\b(in\s*hindi|answer\s*in\s*hindi|speak\s*in\s*hindi|reply\s*in\s*hindi|tell\s*me\s*in\s*hindi|switch\s*to\s*hindi|talk\s*in\s*hindi|use\s*hindi|hindi\s*me|hindi\s*mein|हिंदी\s*में|हिन्दी\s*में|हिंदी\s*में\s*बताएं|हिंदी\s*में\s*समझाएं)\b/i.test(lower)
  ) {
    return 'hi';
  }

  // Marathi switch request
  if (/\b(in\s*marathi|marathi\s*madhe|marathit|मराठीत|मराठी\s*मध्ये|मराठी\s*भाषा)\b/i.test(lower)) {
    return 'mr';
  }

  // Bengali switch request
  if (/\b(in\s*bengali|in\s*bangla|বাংলায়|বাংলা\s*ভাষায়)\b/i.test(lower)) {
    return 'bn';
  }

  // Gujarati switch request
  if (/\b(in\s*gujarati|ગુજરાતીમાં|ગુજરાતી\s*ભાષા)\b/i.test(lower)) {
    return 'gu';
  }

  // Kannada switch request
  if (/\b(in\s*kannada|ಕನ್ನಡದಲ್ಲಿ|ಕನ್ನಡ\s*ಭಾಷೆ)\b/i.test(lower)) {
    return 'kn';
  }

  // Malayalam switch request
  if (/\b(in\s*malayalam|മലയാളത്തിൽ)\b/i.test(lower)) {
    return 'ml';
  }

  // Odia switch request
  if (/\b(in\s*odia|in\s*oriya|ଓଡ଼ିଆରେ)\b/i.test(lower)) {
    return 'od';
  }

  // Punjabi switch request
  if (/\b(in\s*punjabi|ਪੰਜਾਬੀ\s*ਵਿੱਚ)\b/i.test(lower)) {
    return 'pa';
  }

  // Tamil switch request
  if (/\b(in\s*tamil|தமிழில்)\b/i.test(lower)) {
    return 'ta';
  }

  // Telugu switch request
  if (/\b(in\s*telugu|తెలుగులో)\b/i.test(lower)) {
    return 'te';
  }

  return null;
}

/**
 * Determines the authoritative effective response language for the LLM.
 *
 * Priority Order:
 * 1. Explicit language directive inside the message ("in Hindi", "in English", "हिंदी में")
 * 2. Explicit user selection via UI toggle (if not 'auto')
 * 3. High-confidence speech detection (via Sarvam STT)
 * 4. Distinctive native-script text detection (Devanagari, Bengali, Tamil, etc.)
 * 5. Established session language persistence (prevents short follow-ups like "yes", "ok", "1" from flipping to English)
 * 6. General Romanized/text detection fallback
 * 7. English fallback ('en')
 */
export function resolveEffectiveLanguage(input: LanguageResolutionInput): LanguageResolutionResult {
  const { selectedLanguage, detectedSpeechLanguage, speechProbability, message, sessionLanguage } = input;
  const validProb = typeof speechProbability === 'number' && !isNaN(speechProbability) ? speechProbability : null;

  // PRIORITY 1 — EXPLICIT LANGUAGE DIRECTIVE IN MESSAGE
  const explicitDirective = detectExplicitLanguageRequest(message);
  if (explicitDirective) {
    const cfg = getLanguageConfig(explicitDirective);
    if (cfg) {
      return {
        effectiveLanguage: cfg.id,
        resolutionSource: 'user_selection',
        isSupported: true,
        languageConfig: cfg,
        speechProbability: validProb,
      };
    }
  }

  // PRIORITY 2 — EXPLICIT USER SELECTION (via UI toggle)
  if (selectedLanguage && typeof selectedLanguage === 'string' && selectedLanguage.trim() !== '' && selectedLanguage.trim() !== 'auto') {
    const trimmed = selectedLanguage.trim();
    const cfg = getLanguageConfig(trimmed);
    if (cfg) {
      return {
        effectiveLanguage: cfg.id,
        resolutionSource: 'user_selection',
        isSupported: true,
        languageConfig: cfg,
        speechProbability: validProb,
      };
    } else {
      // Explicitly provided language is NOT supported
      return {
        effectiveLanguage: 'en',
        resolutionSource: 'unsupported_selection',
        isSupported: false,
        languageConfig: getLanguageConfig('en'),
        speechProbability: validProb,
      };
    }
  }

  // Helper to count words for short-utterance detection
  const wordCount = message ? message.trim().split(/\s+/).length : 0;

  // PRIORITY 3 — SARVAM SPEECH DETECTION
  if (detectedSpeechLanguage && typeof detectedSpeechLanguage === 'string' && detectedSpeechLanguage.trim() !== '') {
    const speechCode = detectedSpeechLanguage.trim();
    let finalCode = speechCode;

    // If STT thinks it's English, but it's actually Hinglish/Minglish (Romanized Indian language), override it.
    if (speechCode.startsWith('en') && message && typeof message === 'string' && message.trim() !== '') {
      const textCode = detectLanguage(message);
      if (textCode && textCode !== 'unknown' && textCode !== 'en') {
        finalCode = textCode;
      }
    }

    const cfg = getLanguageConfig(finalCode);
    if (cfg) {
      // Short utterance fallback: if it resolves to English but is just 1-2 words (ambiguous like "loan", "ok"),
      // and we have an established session language, DO NOT flip to English, fall back to session language.
      if (cfg.id === 'en' && wordCount <= 2 && sessionLanguage && sessionLanguage !== 'unknown') {
        const sessionCfg = getLanguageConfig(sessionLanguage);
        if (sessionCfg) {
          return {
            effectiveLanguage: sessionCfg.id,
            resolutionSource: 'session_persistence',
            isSupported: true,
            languageConfig: sessionCfg,
            speechProbability: validProb,
          };
        }
      }

      return {
        effectiveLanguage: cfg.id,
        resolutionSource: finalCode !== speechCode ? 'text_detection' : 'speech_detection',
        isSupported: true,
        languageConfig: cfg,
        speechProbability: validProb,
      };
    }
  }

  // PRIORITY 4 — DISTINCTIVE NATIVE-SCRIPT TEXT DETECTION
  // Check if message contains Indic script characters (Devanagari, Bengali, Gurmukhi, Gujarati, Odia, Tamil, Telugu, Kannada, Malayalam)
  const hasIndicScript = message && typeof message === 'string' && /[\u0900-\u0D7F]/.test(message);
  if (message && typeof message === 'string' && message.trim() !== '') {
    const detectedTextCode = detectLanguage(message);
    if (detectedTextCode && detectedTextCode !== 'unknown') {
      if (hasIndicScript) {
        const cfg = getLanguageConfig(detectedTextCode);
        if (cfg) {
          return {
            effectiveLanguage: cfg.id,
            resolutionSource: 'text_detection',
            isSupported: true,
            languageConfig: cfg,
            speechProbability: validProb,
          };
        }
      }
    }
  }

  // PRIORITY 5 — ESTABLISHED SESSION LANGUAGE PERSISTENCE
  // Once a session's language is established (e.g. 'hi', 'en', 'mr'), it persists for the rest of the session
  // for every subsequent response, unless explicitly overridden by an in-message directive (Priority 1),
  // explicit UI toggle (Priority 2), speech detection (Priority 3), or native script detection (Priority 4).
  if (sessionLanguage && typeof sessionLanguage === 'string' && sessionLanguage !== 'unknown') {
    const cfg = getLanguageConfig(sessionLanguage);
    if (cfg) {
      return {
        effectiveLanguage: cfg.id,
        resolutionSource: 'session_persistence',
        isSupported: true,
        languageConfig: cfg,
        speechProbability: validProb,
      };
    }
  }

  // PRIORITY 6 — GENERAL ROMANIZED / LATIN TEXT DETECTION
  if (message && typeof message === 'string' && message.trim() !== '') {
    const detectedTextCode = detectLanguage(message);
    if (detectedTextCode && detectedTextCode !== 'unknown') {
      const hasScriptChars = /[\u0900-\u0D7Fa-zA-Z]/.test(message);
      if (hasScriptChars) {
        const cfg = getLanguageConfig(detectedTextCode);
        if (cfg) {
          return {
            effectiveLanguage: cfg.id,
            resolutionSource: 'text_detection',
            isSupported: true,
            languageConfig: cfg,
            speechProbability: validProb,
          };
        }
      }
    }
  }

  // PRIORITY 7 — ENGLISH FALLBACK
  const defaultCfg = getLanguageConfig('en');
  return {
    effectiveLanguage: 'en',
    resolutionSource: 'fallback',
    isSupported: true,
    languageConfig: defaultCfg,
    speechProbability: validProb,
  };
}
