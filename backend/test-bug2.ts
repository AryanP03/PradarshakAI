import { resolveEffectiveLanguage } from './src/services/LanguageResolver';

console.log('--- Testing Bug 2 Scenarios ---');

// 1. Voice-only Hindi (Sarvam returns hi-IN)
const case3 = resolveEffectiveLanguage({ selectedLanguage: 'auto', detectedSpeechLanguage: 'hi-IN', speechProbability: 0.9, message: 'मुझे लोन चाहिए' });
console.log('3. Voice-only Hindi:', case3.effectiveLanguage);

// 4. Voice-only Marathi (Sarvam returns mr-IN)
const case4 = resolveEffectiveLanguage({ selectedLanguage: 'auto', detectedSpeechLanguage: 'mr-IN', speechProbability: 0.9, message: 'मला कर्ज हवे आहे' });
console.log('4. Voice-only Marathi:', case4.effectiveLanguage);

// 5. Voice mixed (Hindi+English) (Sarvam might return en-IN because of English words, or hi-IN)
// We simulate Sarvam returning en-IN but the text is Hinglish
const case5 = resolveEffectiveLanguage({ selectedLanguage: 'auto', detectedSpeechLanguage: 'en-IN', speechProbability: 0.9, message: 'mujhe education loan chahiye college ke liye' });
console.log('5. Voice mixed (Hinglish):', case5.effectiveLanguage);

// 6. Voice mixed (English+Hindi)
const case6 = resolveEffectiveLanguage({ selectedLanguage: 'auto', detectedSpeechLanguage: 'en-IN', speechProbability: 0.9, message: 'I need a loan mujhe paise chahiye' });
console.log('6. Voice mixed (English+Hindi):', case6.effectiveLanguage);

// 7. English-only voice (regression check)
const case7 = resolveEffectiveLanguage({ selectedLanguage: 'auto', detectedSpeechLanguage: 'en-IN', speechProbability: 0.9, message: 'I need an education loan for my son' });
console.log('7. English-only voice:', case7.effectiveLanguage);

// 8. Short utterance fallback (Sarvam returns en-IN, text is "loan", session is 'hi')
const case8 = resolveEffectiveLanguage({ selectedLanguage: 'auto', detectedSpeechLanguage: 'en-IN', speechProbability: 0.9, message: 'loan', sessionLanguage: 'hi' });
console.log('8. Short utterance fallback:', case8.effectiveLanguage);

// 9. Mid-session language switch (User was in 'hi', now speaks Kannada natively)
const case9 = resolveEffectiveLanguage({ selectedLanguage: 'auto', detectedSpeechLanguage: 'kn-IN', speechProbability: 0.9, message: 'ನನಗೆ ಸಾಲ ಬೇಕು', sessionLanguage: 'hi' });
console.log('9. Mid-session language switch:', case9.effectiveLanguage);

// 10. Mid-session language switch (User was in 'hi', now speaks Romanized Kannada)
const case10 = resolveEffectiveLanguage({ selectedLanguage: 'auto', detectedSpeechLanguage: 'en-IN', speechProbability: 0.9, message: 'nanage shikshana sala beku', sessionLanguage: 'hi' });
console.log('10. Mid-session language switch (Romanized):', case10.effectiveLanguage);

console.log('--- Done ---');
