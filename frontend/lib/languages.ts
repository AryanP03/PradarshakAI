export interface LanguageConfig {
  id: LanguageCode;
  name: string;
  nativeName: string;
  sarvamSttCode: string;
  sarvamTtsCode: string;
}

export type LanguageCode =
  | 'en'
  | 'hi'
  | 'mr'
  | 'bn'
  | 'gu'
  | 'kn'
  | 'ml'
  | 'od'
  | 'pa'
  | 'ta'
  | 'te';

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  { id: 'en', name: 'English', nativeName: 'English', sarvamSttCode: 'en-IN', sarvamTtsCode: 'en-IN' },
  { id: 'hi', name: 'Hindi', nativeName: 'हिंदी', sarvamSttCode: 'hi-IN', sarvamTtsCode: 'hi-IN' },
  { id: 'mr', name: 'Marathi', nativeName: 'मराठी', sarvamSttCode: 'mr-IN', sarvamTtsCode: 'mr-IN' },
  { id: 'bn', name: 'Bengali', nativeName: 'বাংলা', sarvamSttCode: 'bn-IN', sarvamTtsCode: 'bn-IN' },
  { id: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', sarvamSttCode: 'gu-IN', sarvamTtsCode: 'gu-IN' },
  { id: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', sarvamSttCode: 'kn-IN', sarvamTtsCode: 'kn-IN' },
  { id: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', sarvamSttCode: 'ml-IN', sarvamTtsCode: 'ml-IN' },
  { id: 'od', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', sarvamSttCode: 'od-IN', sarvamTtsCode: 'od-IN' },
  { id: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', sarvamSttCode: 'pa-IN', sarvamTtsCode: 'pa-IN' },
  { id: 'ta', name: 'Tamil', nativeName: 'தமிழ்', sarvamSttCode: 'ta-IN', sarvamTtsCode: 'ta-IN' },
  { id: 'te', name: 'Telugu', nativeName: 'తెలుగు', sarvamSttCode: 'te-IN', sarvamTtsCode: 'te-IN' },
];

export const LANGUAGE_MAP: Record<string, LanguageConfig> = SUPPORTED_LANGUAGES.reduce(
  (acc, lang) => {
    acc[lang.id] = lang;
    return acc;
  },
  {} as Record<string, LanguageConfig>
);

export function getLanguageConfig(code?: string): LanguageConfig {
  if (!code) return LANGUAGE_MAP.en;
  const normalized = code.toLowerCase();
  return (
    LANGUAGE_MAP[normalized] ||
    SUPPORTED_LANGUAGES.find(
      (l) => l.sarvamSttCode.toLowerCase() === normalized || l.sarvamTtsCode.toLowerCase() === normalized
    ) ||
    LANGUAGE_MAP.en
  );
}

export function isValidLanguageCode(code?: string): code is LanguageCode {
  if (!code) return false;
  const normalized = code.toLowerCase();
  return SUPPORTED_LANGUAGES.some(
    (l) => l.id === normalized || l.sarvamSttCode.toLowerCase() === normalized || l.sarvamTtsCode.toLowerCase() === normalized
  );
}

export function detectLanguageFromText(text: string, defaultLang: string = 'en'): string {
  if (!text) return defaultLang;
  
  let hindiCount = 0;
  let bengaliCount = 0;
  let gujaratiCount = 0;
  let kannadaCount = 0;
  let malayalamCount = 0;
  let odiaCount = 0;
  let punjabiCount = 0;
  let tamilCount = 0;
  let teluguCount = 0;
  
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code >= 0x0900 && code <= 0x097F) hindiCount++;
    else if (code >= 0x0980 && code <= 0x09FF) bengaliCount++;
    else if (code >= 0x0A80 && code <= 0x0AFF) gujaratiCount++;
    else if (code >= 0x0C80 && code <= 0x0CFF) kannadaCount++;
    else if (code >= 0x0D00 && code <= 0x0D7F) malayalamCount++;
    else if (code >= 0x0B00 && code <= 0x0B7F) odiaCount++;
    else if (code >= 0x0A00 && code <= 0x0A7F) punjabiCount++;
    else if (code >= 0x0B80 && code <= 0x0BFF) tamilCount++;
    else if (code >= 0x0C00 && code <= 0x0C7F) teluguCount++;
  }

  const maxCount = Math.max(hindiCount, bengaliCount, gujaratiCount, kannadaCount, malayalamCount, odiaCount, punjabiCount, tamilCount, teluguCount);
  
  if (maxCount > text.length * 0.05) { 
    if (maxCount === bengaliCount) return 'bn';
    if (maxCount === gujaratiCount) return 'gu';
    if (maxCount === kannadaCount) return 'kn';
    if (maxCount === malayalamCount) return 'ml';
    if (maxCount === odiaCount) return 'od';
    if (maxCount === punjabiCount) return 'pa';
    if (maxCount === tamilCount) return 'ta';
    if (maxCount === teluguCount) return 'te';
    if (maxCount === hindiCount) {
      if (defaultLang === 'mr') return 'mr'; 
      return 'hi';
    }
  }
  
  return 'en';
}
