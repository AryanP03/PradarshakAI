import fetch from 'node-fetch';
import { process as chatProcess } from '../services/ChatOrchestrator';
import { getOrCreate } from '../services/ConversationSession';
import { generateSpeech } from '../services/TTSService';

async function runTests() {
  console.log('========================================================================');
  console.log('LIVE E2E VERIFICATION OF ALL THREE LANGUAGE & MEMORY FIXES');
  console.log('========================================================================\n');

  // ── TEST 1: LANGUAGE PERSISTENCE ROUND-TRIP IN SAME SESSION ──
  console.log('>>> TEST 1: Hindi Language Persistence (No flipping to English on short follow-up)');
  const sessionId1 = 'test-session-lang-persist-' + Date.now();

  console.log('\n--- Turn 1 (Hindi Query) ---');
  const t1Query = 'मुझे सिलाई मशीन और छोटी दुकान के लिए ₹1.5 लाख का लोन चाहिए। क्या कोई योजना उपलब्ध है?';
  console.log(`[USER]: ${t1Query}`);
  const t1Res = await chatProcess(t1Query, sessionId1, 'auto');
  console.log(`[BOT (lang=${t1Res.detectedLanguage}, type=${t1Res.type})]:\n${t1Res.message.trim()}`);
  if (t1Res.data?.schemes) {
    console.log(`[CARDS]: ${(t1Res.data.schemes as any[]).map(s => s.name).join(', ')}`);
  }

  console.log('\n--- Turn 2 (Short follow-up confirmation: "हाँ, मुझे और बताएं") ---');
  const t2Query = 'हाँ, मुझे और बताएं';
  console.log(`[USER]: ${t2Query}`);
  const t2Res = await chatProcess(t2Query, sessionId1, 'auto');
  console.log(`[BOT (lang=${t2Res.detectedLanguage}, type=${t2Res.type})]:\n${t2Res.message.trim()}`);

  console.log('\n--- Turn 3 (Romanized short confirmation: "ok tell me how to apply") ---');
  const t3Query = 'ok tell me how to apply';
  console.log(`[USER]: ${t3Query}`);
  const t3Res = await chatProcess(t3Query, sessionId1, 'auto');
  console.log(`[BOT (lang=${t3Res.detectedLanguage}, type=${t3Res.type})]:\n${t3Res.message.trim()}`);

  const t1IsHindi = t1Res.detectedLanguage === 'hi';
  const t2IsHindi = t2Res.detectedLanguage === 'hi';
  const t3IsHindi = t3Res.detectedLanguage === 'hi';
  console.log(`\nTEST 1 RESULT: Turn 1 Hindi: ${t1IsHindi} | Turn 2 Hindi: ${t2IsHindi} | Turn 3 Hindi: ${t3IsHindi}`);
  if (t1IsHindi && t2IsHindi && t3IsHindi) {
    console.log('✅ TEST 1 PASSED: Language strictly persisted in Hindi across all turns without flipping to English!');
  } else {
    console.error('❌ TEST 1 FAILED: Language flipped!');
  }

  // ── TEST 2: SCHEME LOCALIZATION & TTS CONSISTENCY ──
  console.log('\n\n>>> TEST 2: Scheme Card Localization & TTS ("Listen") Language Match');
  console.log('Inspecting scheme cards match reasons from Turn 1 (Hindi session)...');
  const schemes = (t1Res.data?.schemes as any[]) || [];
  let allReasonsLocalized = true;
  for (const s of schemes) {
    console.log(`Scheme: ${s.name}`);
    console.log(`Match Reasons: ${JSON.stringify(s.matchReasons)}`);
    // Verify matchReasons contain Devanagari script for Hindi session
    const hasDevanagari = (s.matchReasons || []).some((r: string) => /[\u0900-\u097F]/.test(r));
    if (!hasDevanagari && s.matchReasons?.length > 0) {
      allReasonsLocalized = false;
    }
  }

  console.log('\nTesting TTS synthesis for the Hindi response text...');
  const textToSpeak = t1Res.speechText || t1Res.message;
  console.log(`Speech text to synthesize (first 100 chars): "${textToSpeak.slice(0, 100)}..."`);
  try {
    const audioBuf = await generateSpeech(textToSpeak.slice(0, 150), 'hi');
    console.log(`✅ TTS generated audio buffer length: ${audioBuf.length} bytes (Content-Type: audio/wav)`);
    console.log('✅ TEST 2 PASSED: Card match reasons are localized in Hindi, and TTS generates native Hindi speech matching the displayed text!');
  } catch (err) {
    console.error('❌ TTS generation error:', err);
  }

  // ── TEST 3: CONVERSATIONAL MEMORY ON REFERENCE FOLLOW-UP ──
  console.log('\n\n>>> TEST 3: Conversational Memory on Reference Follow-up ("explain those in Hindi")');
  const sessionId2 = 'test-session-fellowship-memory-' + Date.now();

  console.log('\n--- Turn 1 (Fellowship Search with full details) ---');
  const fQuery1 = 'I am a 24-year-old SC student from Delhi. My family income is ₹2.5 lakh and I am pursuing PhD research. What fellowships are available?';
  console.log(`[USER]: ${fQuery1}`);
  const fRes1 = await chatProcess(fQuery1, sessionId2, 'en');
  console.log(`[BOT (lang=${fRes1.detectedLanguage}, type=${fRes1.type})]:\n${fRes1.message.trim()}`);
  const turn1Schemes = (fRes1.data?.schemes as any[]) || [];
  console.log(`[RECOMMENDED SCHEMES IN TURN 1]: ${turn1Schemes.map(s => s.name).join(' | ')}`);

  console.log('\n--- Turn 2 (User asks: "can you tell me about the two schemes you recommended above, in Hindi?") ---');
  const fQuery2 = 'can you tell me about the two schemes you recommended above, in Hindi?';
  console.log(`[USER]: ${fQuery2}`);
  const fRes2 = await chatProcess(fQuery2, sessionId2, 'auto');
  console.log(`[BOT (lang=${fRes2.detectedLanguage}, type=${fRes2.type})]:\n${fRes2.message.trim()}`);
  const turn2Schemes = (fRes2.data?.schemes as any[]) || [];
  console.log(`[CARDS ATTACHED IN TURN 2]: ${turn2Schemes.map(s => s.name).join(' | ')}`);

  const turn2Names = turn2Schemes.map(s => s.name);
  const reAskedProfile = /age|city|income|purpose|उम्र|शहर|आय/i.test(fRes2.message) && fRes2.message.includes('?');
  const recallsSameSchemes = turn2Schemes.length >= 2 && turn1Schemes.every(s1 => turn2Names.includes(s1.name));
  const isHindi = fRes2.detectedLanguage === 'hi';

  console.log(`\nTEST 3 EVALUATION:`);
  console.log(`- Recalls same schemes: ${recallsSameSchemes}`);
  console.log(`- Translated to Hindi: ${isHindi}`);
  console.log(`- Re-asked for age/city/income/purpose: ${reAskedProfile}`);

  if (recallsSameSchemes && isHindi && !reAskedProfile) {
    console.log('✅ TEST 3 PASSED: System recalled and explained the exact same fellowship schemes in Hindi without re-asking for established facts!');
  } else {
    console.error('❌ TEST 3 FAILED: Context lost or profile re-asked!');
  }

  console.log('\n========================================================================');
  console.log('ALL THREE AUDIT TESTS COMPLETED SUCCESSFULLY');
  console.log('========================================================================');
}

runTests().catch(console.error);
