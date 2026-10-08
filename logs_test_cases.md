# Pradarshak AI Audio & Language Pipeline Logs

## 1. Page-Switched Hindi (UI Language set to Hindi, text interaction)
- **User Action**: Toggles UI to Hindi, clicks "Listen" on a translated message.
- **Root Text Language**: `hi` (Detected from translated DOM text `innerText`)
- **TTS Language Code**: `hi-IN`
- **Text Content Sent to TTS**: `क्या मैं आपकी किसी योजना को खोजने में मदद कर सकता हूँ?`
- **Result**: Speaks Hindi natively.

## 2. Marathi (Scheme Card)
- **User Action**: Clicks "Listen" button inside a rendered Scheme Details Card translated to Marathi.
- **Root Text Language**: `mr` (Extracted using DOM ID wrapper on the card's `<p>` tags, containing Marathi script)
- **TTS Language Code**: `mr-IN`
- **Text Content Sent to TTS**: `ही योजना महिला उद्योजकांसाठी आहे, ज्यांना 5 लाखांपर्यंतचे कर्ज हवे आहे...`
- **Result**: Card content is spoken clearly in Marathi without reverting to English.

## 3. Voice-only Hindi (Talk to Pradarshak AI)
- **User Action**: Speaks "मुझे लोन चाहिए" via Voice Agent while UI is English.
- **STT Detection**: `hi-IN`
- **Orchestrator Resolved Lang**: `hi` (bypasses English UI toggle in voice mode)
- **TTS Language Code**: `hi-IN`
- **Text Content Sent to TTS**: `नमस्ते! मैं आपकी किस प्रकार की लोन योजना खोजने में मदद कर सकता हूँ?`
- **Result**: Replies in Hindi successfully.

## 4. Voice-only Marathi
- **User Action**: Speaks "मला कर्ज हवे आहे" via Voice Agent.
- **STT Detection**: `mr-IN`
- **Orchestrator Resolved Lang**: `mr`
- **TTS Language Code**: `mr-IN`
- **Text Content Sent to TTS**: `नमस्कार! मी तुम्हाला व्यवसाय किंवा शिक्षणासाठी कर्ज शोधण्यात कशी मदत करू?`
- **Result**: Replies in Marathi successfully.

## 5. Voice mixed (Hindi + English / Hinglish)
- **User Action**: Speaks "mujhe education loan chahiye college ke liye"
- **STT Detection**: `en-IN` (Fallback by Sarvam due to Latin script)
- **Orchestrator Resolved Lang**: `hi` (Priority 3 override: Text detection detects majority Romanized Hindi keywords: "mujhe", "chahiye", "ke", "liye")
- **TTS Language Code**: `hi-IN`
- **Text Content Sent to TTS**: `जरूर, मैं शिक्षा ऋण के बारे में जानकारी दे सकता हूँ।`
- **Result**: Respects majority spoken language and replies in Hindi.

## 6. Voice mixed (English + Hindi)
- **User Action**: Speaks "I need a loan mujhe paise chahiye"
- **STT Detection**: `en-IN`
- **Orchestrator Resolved Lang**: `hi` (Romanized Hindi score hits threshold > 1 due to "mujhe", "chahiye")
- **TTS Language Code**: `hi-IN`
- **Text Content Sent to TTS**: `क्या आप व्यवसाय या शिक्षा के लिए ऋण खोज रहे हैं?`
- **Result**: Dynamically adapts to the user's mixed query natively.

## 7. English-only voice (Regression Check)
- **User Action**: Speaks "I need an education loan for my son"
- **STT Detection**: `en-IN`
- **Orchestrator Resolved Lang**: `en` (Zero Romanized Indian language markers detected)
- **TTS Language Code**: `en-IN`
- **Text Content Sent to TTS**: `I can certainly help you find an education loan for your son.`
- **Result**: Remains perfectly stable in English.

## 8. Short Utterance Fallback
- **User Action**: Speaks "loan" mid-way through a Hindi conversation.
- **STT Detection**: `en-IN`
- **Orchestrator Resolved Lang**: `hi` (Priority 3 detects 1-word ambiguous length, falls back to `sessionLanguage: 'hi'`)
- **TTS Language Code**: `hi-IN`
- **Text Content Sent to TTS**: `आप किस प्रकार का लोन चाहते हैं?`
- **Result**: Prevents jarring mid-conversation flip to English.

## 9. Mid-session Language Switch
- **User Action**: In a Hindi session, user explicitly speaks Kannada: "ನನಗೆ ಸಾಲ ಬೇಕು" (nanage sala beku).
- **STT Detection**: `kn-IN`
- **Orchestrator Resolved Lang**: `kn`
- **TTS Language Code**: `kn-IN`
- **Text Content Sent to TTS**: `ನಿಮಗೆ ಯಾವ ರೀತಿಯ ಸಾಲ ಬೇಕು?`
- **Result**: Cleanly switches entire backend chain to Kannada for this turn onwards.
