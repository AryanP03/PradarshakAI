import { readonlyPool } from '../db/pool';
import type { UserEntities } from './ConversationSession';

export interface Scheme {
  id: number;
  name: string;
  short_name?: string | null;
  category: string;
  description: string;
  min_income_lakh?: number | null;
  max_income_lakh: number;
  min_loan_lakh?: number | null;
  max_loan_lakh: number;
  interest_rate_min: number;
  interest_rate_max: number;
  moratorium_months_min: number;
  moratorium_months_max: number;
  max_tenure_months: number;
  min_tenure_months?: number | null;
  coverage_percent?: number | null;
  eligible_project_types: string[];
  education_required: boolean;
  gender_eligibility?: string;
  age_min?: number | null;
  age_max?: number | null;
  documents_required?: string[] | null;
  channel_partner_types?: string[] | null;
  notes?: string | null;
  active?: boolean;
  scheme_type?: string;
  official_source?: string | null;
  official_source_url?: string | null;
  aliases?: string[] | null;
  current_official_name?: string | null;
  channel_partner_applicable?: boolean;
}

export type SchemeTier = 'ELIGIBLE_OPTIMAL' | 'ELIGIBLE_SUBOPTIMAL' | 'HARD_DISQUALIFIED';

export interface ScoredScheme extends Scheme {
  score: number;
  tier: SchemeTier;
  matchReasons: string[];
  warnings: string[];
  disqualificationReason?: string;
}

export function normalizeSchemeText(str: string): string {
  return (str || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function fetchActiveSchemes(categoryHint?: string): Promise<Scheme[]> {
  // The categoryHint values from the orchestrator ('business_loan', 'education_loan')
  // don't always match real DB category column values.
  // Real DB categories: micro_finance, entrepreneurship, term_loan, education_loan, skill_development, other_programme
  let query = 'SELECT * FROM schemes WHERE active = TRUE';
  const params: string[] = [];

  if (categoryHint === 'education_loan') {
    // education_loan exists in DB — filter directly
    query += ' AND category = $1';
    params.push('education_loan');
  } else if (categoryHint === 'business_loan') {
    // 'business_loan' does NOT exist in DB — exclude non-business categories instead
    query += " AND category NOT IN ('education_loan', 'skill_development', 'other_programme')";
  } else if (categoryHint) {
    // Direct category match for other hints
    query += ' AND category = $1';
    params.push(categoryHint);
  }

  query += ' ORDER BY interest_rate_min ASC';
  const { rows } = await readonlyPool.query<Scheme>(query, params);
  return rows;
}

export async function fetchSchemeById(id: number): Promise<Scheme | null> {
  const { rows } = await readonlyPool.query<Scheme>('SELECT * FROM schemes WHERE id = $1', [id]);
  return rows[0] || null;
}

export function normalizeMultilingualText(str: string): string {
  return (str || '')
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'।॥]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const MULTILINGUAL_SCHEME_ALIASES: Record<number, string[]> = {
  1: [ // MCF
    'माइक्रो क्रेडिट फाइनेंस', 'मायक्रो क्रेडिट फायनान्स', 'માઇક્રો ક્રેડિટ ફાઇનાન્સ',
    'ক্ষুদ্র ঋণ অর্থায়ন', 'ಮೈಕ್ರೋ ಕ್ರೆಡಿಟ್ ಫೈನಾನ್ಸ್', 'മൈക്രോ ക്രെഡിറ്റ് ഫിനാൻസ്',
    'ମାଇକ୍ରୋ କ୍ରେଡିଟ୍ ଫାଇନାନ୍ସ', 'ਮਾਈਕਰੋ ਕ੍ਰੈਡਿਟ ਫਾਈਨਾਂਸ', 'மைக்ரோ கிரெடிட் ஃபைனான்ஸ்',
    'మైక్రో క్రెడిట్ ఫైనాన్స్',
  ],
  2: [ // MSY
    'महिला समृद्धि योजना', 'महिला समृद्धि', 'महिला समृद्धी योजना', 'महिला समृद्धी',
    'મહિલા સમૃદ્ધિ યોજના', 'મહિલા સમૃદ્ધિ', 'মহিলা সমৃদ্ধি যোজনা', 'মহিলা সমৃদ্ধি',
    'ಮಹಿಳಾ ಸಮೃದ್ಧಿ ಯೋಜನೆ', 'ಮಹಿಳಾ ಸಮೃದ್ಧಿ', 'മഹിളാ സമൃദ്ധി യോജന', 'മഹിളാ സമൃദ്ധി',
    'ମହିଳା ସମୃଦ୍ଧି ଯୋଜନା', 'ମହିଳା ସମୃଦ୍ଧି', 'ਮਹਿਲਾ ਸਮ੍ਰਿਧੀ ਯੋਜਨਾ', 'ਮਹਿਲਾ ਸਮ੍ਰਿਧੀ',
    'மகிளா சம்ரித்தி யோஜனா', 'மகிளா சம்ரித்தி', 'మహిళా సమృద్ధి యోజన', 'మహిళా సమృద్ధి',
  ],
  3: [ // MAY
    'महिला अधिकारिता योजना', 'महिला अधिकारिता', 'महिला किसान योजना', 'महिला किसान',
    'મહિલા અધિકારિતા યોજના', 'મહિલા કિસાન યોજના',
    'মহিলা অধিকারিতা যোজনা', 'মহিলা কিষাণ যোজনা',
  ],
  4: [ // SSY
    'शिल्पी समृद्धि योजना', 'शिल्पी समृद्धि', 'शिल्पी समृद्धी योजना', 'शिल्पी समृद्धी',
    'શિલ્પી સમૃદ્ધિ યોજના', 'શિલ્પી સમૃદ્ધિ',
  ],
  5: [ // TL
    'टर्म लोन', 'मुद्दत कर्ज', 'ટર્મ લોન', 'টার্ম লোন', 'ಟರ್ಮ್ ಲೋನ್', 'டேர்ம் லோன்', 'టర్మ్ లోన్',
  ],
  6: [ // GBS
    'हरित व्यापार योजना', 'हरित व्यवसाय योजना', 'ગ્રીન બિઝનેસ સ્કીમ',
  ],
  7: [ // SUY
    'स्वच्छता उद्यमी योजना', 'स्वच्छता उद्यमी',
  ],
  8: [ // UNY
    'उद्यम निधि योजना', 'उद्यम निधी योजना', 'લઘુ વ્યવસાય યોજના', 'लघु व्यवसाय योजना',
  ],
  9: [ // AMY
    'आजीविका माइक्रोफाइनेंस योजना', 'आजीविका मायक्रोफायनान्स योजना',
  ],
  10: [ // ELS
    'शिक्षा ऋण योजना', 'शैक्षणिक कर्ज योजना', 'શિક્ષણ લોન યોજના', 'শিক্ষা ঋণ প্রকল্প',
    'ಶೈಕ್ಷಣಿಕ ಸಾಲ ಯೋಜನೆ', 'கல்விக் கடன் திட்டம்', 'విద్యా రుణ పథకం',
  ],
  11: [ // VETLS
    'व्यावसायिक शिक्षा एवं प्रशिक्षण ऋण', 'व्यावसायिक शिक्षण व प्रशिक्षण कर्ज',
  ],
  12: [ // PM-DAKSH
    'पीएम-दक्ष', 'पीएम दक्ष', 'पीएम-दक्ष कौशल विकास', 'પીએમ-દક્ષ',
  ],
  13: [ // SMILE
    'स्माइल योजना', 'स्माईल योजना',
  ],
  14: [ // Stand-Up India
    'स्टैंड-अप इंडिया', 'स्टँड-अप इंडिया', 'સ્ટેન્ડ-અપ ઇન્ડિયા',
  ],
};

export interface SpecificSchemeResolution {
  scheme: Scheme | null;
  isSpecificSchemeQuery: boolean;
  isAlternativeOrCompare: boolean;
  queryFocus?: 'overview' | 'interest_rate' | 'eligibility' | 'documents' | 'tenure' | 'loan_amount' | 'partner';
}

export function identifySpecificScheme(
  message: string,
  activeSchemes: Scheme[],
  currentSelected?: { id?: number; name?: string }
): SpecificSchemeResolution {
  const normAscii = normalizeSchemeText(message);
  const normMulti = normalizeMultilingualText(message);

  // 1. Check if user is asking for alternatives, comparison, or broad options
  const isAlternativeOrCompare =
    /\b(alternative|alternatives|other schemes?|similar|options|compare|comparison|versus|vs|better|all schemes?|more schemes?|which scheme is better|diff|difference)\b/i.test(message) ||
    /विकल्प|अन्य योजना|इतर योजना|तुलना|फरक|સરખામણી|તુલના|વિકલ્પ|অন্যান্য/i.test(message);

  // Determine query focus
  let queryFocus: SpecificSchemeResolution['queryFocus'] = 'overview';
  if (/interest rate|interest|rate of interest|vyaaj|vyaj|ब्याज|व्याज|વ્યાજ|સુદ|வட்டி|వడ్డీ/i.test(message)) {
    queryFocus = 'interest_rate';
  } else if (/eligib|who can apply|criteria|qualified|qualification|पात्रता|पात्र|योग्य|લાયકાત|যোগ্যতা/i.test(message)) {
    queryFocus = 'eligibility';
  } else if (/document|checklist|papers|proof|certificate|दस्तावेज|कागदपत्र|દસ્તાવેજ|নথি|ஆவணங்கள்|పత్రాలు/i.test(message)) {
    queryFocus = 'documents';
  } else if (/tenure|repay|duration|period|months|years|अवधि|मुदत|સમયગાળો|মেয়াদ/i.test(message)) {
    queryFocus = 'tenure';
  } else if (/how much|loan amount|maximum loan|limit|ceiling|kitna|kiti|કેટલું|কত|எவ்வளவு|ఎంత|राशि|रक्कम/i.test(message)) {
    queryFocus = 'loan_amount';
  } else if (/partner|branch|bank|where to apply|kahan|kothe|ક્યાં|কোথায়|எங்கே|ఎక్కడ|निकटतम|शाखा|कहाँ/i.test(message)) {
    queryFocus = 'partner';
  }

  // 2. Try to identify a specific named scheme directly in the message
  let matchedScheme: Scheme | null = null;
  const words = normAscii.split(' ').filter(Boolean);

  for (const s of activeSchemes) {
    const parensMatch = s.name.match(/\(([^)]+)\)/);
    const acronym = parensMatch ? normalizeSchemeText(parensMatch[1]) : '';
    const baseName = normalizeSchemeText(s.name.replace(/\([^)]+\)/, ''));
    const fullName = normalizeSchemeText(s.name);
    const shortName = s.short_name ? normalizeSchemeText(s.short_name) : '';
    const normAliases = (s.aliases || []).map((a) => normalizeSchemeText(a));
    const multiAliases = (MULTILINGUAL_SCHEME_ALIASES[s.id] || []).map((a) => normalizeMultilingualText(a));

    // Acronym match: require standalone word match (e.g. "msy", "mcf", "els")
    const isAcronymMatch = acronym.length >= 2 && words.includes(acronym);
    const isShortMatch = shortName.length >= 2 && words.includes(shortName);

    // Full name or base name match: require substring match with at least 5 characters to avoid false positives
    const isFullNameMatch = fullName.length >= 5 && normAscii.includes(fullName);
    const isBaseNameMatch = baseName.length >= 5 && normAscii.includes(baseName);

    // Alias match:
    const isAliasMatch = normAliases.some((alias) => {
      if (alias.length <= 4) return words.includes(alias);
      return normAscii.includes(alias);
    });

    // Multilingual native script match:
    const isMultiMatch = multiAliases.some((alias) => {
      return normMulti.includes(alias);
    });

    if (isAcronymMatch || isShortMatch || isFullNameMatch || isBaseNameMatch || isAliasMatch || isMultiMatch) {
      matchedScheme = s;
      break;
    }
  }

  // 3. If no direct name match in message, check if this is a follow-up about the previously selected scheme
  if (!matchedScheme && currentSelected?.id) {
    const prevScheme = activeSchemes.find((s) => s.id === currentSelected.id);
    if (prevScheme) {
      const isPronounOrFollowup =
        /\b(this|that|it|its|the scheme|this scheme|this loan|that loan|the loan)\b/i.test(message) ||
        /इस योजना|यह योजना|या योजने|या योजनेची|આ યોજના|এই প্রকল্প|அந்த திட்டம்|ఈ పథకం/i.test(message) ||
        // Or specific attribute queries without specifying any other scheme
        (queryFocus !== 'overview' && !/\b(which scheme|what schemes|any scheme|suggest|recommend)\b/i.test(message));

      if (isPronounOrFollowup && !isAlternativeOrCompare) {
        matchedScheme = prevScheme;
      }
    }
  }

  const isSpecificSchemeQuery = Boolean(matchedScheme) && !isAlternativeOrCompare;

  return {
    scheme: matchedScheme,
    isSpecificSchemeQuery,
    isAlternativeOrCompare,
    queryFocus,
  };
}

export async function fetchSchemeByName(name: string): Promise<Scheme | null> {
  const all = await fetchActiveSchemes();
  const normInput = normalizeSchemeText(name);
  const normMultiInput = normalizeMultilingualText(name);

  for (const s of all) {
    const parensMatch = s.name.match(/\(([^)]+)\)/);
    const acronym = parensMatch ? normalizeSchemeText(parensMatch[1]) : '';
    const baseName = normalizeSchemeText(s.name.replace(/\([^)]+\)/, ''));
    const fullName = normalizeSchemeText(s.name);
    const shortName = s.short_name ? normalizeSchemeText(s.short_name) : '';
    const normAliases = (s.aliases || []).map((a) => normalizeSchemeText(a));
    const multiAliases = (MULTILINGUAL_SCHEME_ALIASES[s.id] || []).map((a) => normalizeMultilingualText(a));

    if (
      (acronym && (normInput === acronym || normInput.split(' ').includes(acronym))) ||
      (shortName && (normInput === shortName || normInput.split(' ').includes(shortName))) ||
      (baseName && (normInput === baseName || normInput.includes(baseName) || baseName.includes(normInput))) ||
      (fullName && (normInput === fullName || normInput.includes(fullName) || fullName.includes(normInput))) ||
      normAliases.some((alias) => alias.length >= 2 && (normInput === alias || normInput.includes(alias) || alias.includes(normInput))) ||
      multiAliases.some((alias) => alias.length >= 2 && (normMultiInput === alias || normMultiInput.includes(alias) || alias.includes(normMultiInput)))
    ) {
      return s;
    }
  }

  const { rows } = await readonlyPool.query<Scheme>(
    "SELECT * FROM schemes WHERE name ILIKE $1 OR short_name ILIKE $1 OR array_to_string(aliases, ',') ILIKE $1 LIMIT 1",
    [`%${name}%`]
  );
  return rows[0] || null;
}

function purposeMatchScore(scheme: Scheme, purpose: string | undefined): number {
  const p = (purpose || '').trim();
  if (!p) return 15;

  const normP = normalizeSchemeText(p);
  const pTokens = normP.split(/\s+/).filter(Boolean);

  const parensMatch = scheme.name.match(/\(([^)]+)\)/);
  const acronym = parensMatch ? parensMatch[1].trim() : '';
  const baseName = scheme.name.replace(/\([^)]+\)/, '').trim();

  const normAcronym = normalizeSchemeText(acronym);
  const normBaseName = normalizeSchemeText(baseName);
  const normFullName = normalizeSchemeText(scheme.name);
  const normShortName = scheme.short_name ? normalizeSchemeText(scheme.short_name) : '';
  const normAliases = (scheme.aliases || []).map((a) => normalizeSchemeText(a));

  // Check direct scheme match against acronym, short_name, base_name, full_name, or aliases
  const isAcronymMatch = normAcronym.length > 0 && (normP === normAcronym || pTokens.includes(normAcronym));
  const isShortMatch = normShortName.length > 0 && (normP === normShortName || pTokens.includes(normShortName));
  const isFullNameMatch = normFullName.length >= 3 && (normP === normFullName || normP.includes(normFullName) || normFullName.includes(normP));
  const isBaseNameMatch = normBaseName.length >= 3 && (normP === normBaseName || normP.includes(normBaseName) || normBaseName.includes(normP));
  const isAliasMatch = normAliases.some((alias) => alias.length >= 2 && (normP === alias || normP.includes(alias) || alias.includes(normP)));

  if (isAcronymMatch || isShortMatch || isFullNameMatch || isBaseNameMatch || isAliasMatch) {
    const rawTypes = scheme.eligible_project_types || [];
    const normalizedTypes = rawTypes.map((t) => t.toLowerCase().replace(/[-_]/g, ' '));
    const tokenBonus = normalizedTypes.some((t) => normP.includes(t)) ? 20 : 0;
    return 100 + tokenBonus;
  }

  const rawTypes = scheme.eligible_project_types || [];
  const normalizedTypes = rawTypes.map((t) => t.toLowerCase().replace(/[-_]/g, ' '));

  const sanitationWords = ['waste', 'recycling', 'sanitation', 'garbage', 'sewage', 'toilet', 'scavenger', 'cleaning', 'safai', 'सफाई', 'कचरा', 'शौचालय', 'स्वच्छता'];
  const greenWords = ['green', 'electric', 'rickshaw', 'solar', 'biogas', 'polyhouse', 'organic', 'eco', 'renewable', 'ev', 'ई-रिक्शा', 'सौर', 'पर्यावरण'];
  const artisanWords = ['artisan', 'handicraft', 'weaving', 'craft', 'pottery', 'woodwork', 'sculpture', 'textile', 'carpet', 'embroidery', 'शिल्पकार', 'बुनकर', 'हस्तकला', 'हस्तशिल्प'];
  const businessWords = ['tailoring', 'shop', 'grocery', 'kirana', 'trade', 'enterprise', 'business', 'store', 'restaurant', 'hotel', 'manufacturing', 'repair', 'सिलाई', 'दुकान', 'व्यापार', 'व्यवसाय', 'शिलाई', 'उद्योग'];
  const agriWords = ['agriculture', 'farming', 'poultry', 'animal', 'cattle', 'horticulture', 'dairy', 'crop', 'fisheries', 'खेती', 'कृषि', 'डेयरी', 'पशुपालन', 'शेतकरी'];
  const techWords = ['saas', 'software', 'tech', 'it', 'b2b', 'supplier', 'suppliers', 'supply', 'logistics', 'services', 'agency', 'wholesale', 'सॉफ्टवेयर', 'तकनीक', 'सप्लायर'];
  const educationWords = [
    'education', 'study', 'college', 'school', 'engineering', 'medical', 'degree', 'student',
    'scholarship', 'university', 'course', 'vocational', 'tuition', 'btech', 'mtech', 'mba', 'mbbs',
    'शिक्षा', 'पढ़ाई', 'सिक्षा', 'शिक्षण', 'इंजीनियरिंग', 'कोर्स',
    'ಶಿಕ್ಷಣ', 'ಸಾಹಿತ್ಯ', 'ಅಧ್ಯಯನ', 'ಕಾಲೇಜು', 'ವಿದ್ಯಾಭ್ಯಾಸ', 'ಎಂಜಿನಿಯರಿಂಗ್',
    'શિક્ષણ', 'கல்வி', 'విద్య', 'വിദ്യാഭ്യാസം', 'ଶିକ୍ଷା', 'ਸਿੱਖਿਆ'
  ];

  const isSanitationScheme = scheme.name.includes('Swachhta') || scheme.name.includes('SUY');
  const isGreenScheme = scheme.name.includes('Green') || scheme.name.includes('GBS');
  const isArtisanScheme = scheme.name.includes('Shilpi') || scheme.name.includes('SSY');
  const isAgriScheme = scheme.name.includes('Kisan') || scheme.name.includes('MKY');
  const isEducationScheme = scheme.category === 'education_loan' || scheme.education_required;

  if (normP) {
    if (educationWords.some((w) => normP.includes(w))) {
      if (isEducationScheme) return 50;
      return -15;
    }
    if (sanitationWords.some((w) => normP.includes(w))) {
      if (isSanitationScheme) return 50;
      return 5;
    }
    if (greenWords.some((w) => normP.includes(w))) {
      if (isGreenScheme) return 50;
      return 10;
    }
    if (artisanWords.some((w) => normP.includes(w))) {
      if (isArtisanScheme) return 50;
      return 10;
    }
    if (agriWords.some((w) => normP.includes(w))) {
      if (isAgriScheme) return 50;
      if (scheme.name.includes('Term Loan')) return 30;
      return 5;
    }
    if (techWords.some((w) => normP.includes(w))) {
      if (scheme.name.includes('Term Loan') || scheme.name.includes('Utkarsh') || normalizedTypes.includes('services') || normalizedTypes.includes('it services')) {
        return 40;
      }
      return 5;
    }
    if (businessWords.some((w) => normP.includes(w))) {
      if (isAgriScheme) return -30;
      if (isSanitationScheme || isArtisanScheme) return -15;
      if (isEducationScheme || scheme.category === 'skill_development' || scheme.category === 'welfare_programme') return -50;
      if (normP.includes('सिलाई') || normP.includes('tailoring') || normP.includes('शिलाई')) {
        if (scheme.name.includes('Mahila Samriddhi')) return 50;
        if (normalizedTypes.some((t) => t.includes('tailoring'))) return 45;
      }
      if (normalizedTypes.some((t) => businessWords.some((w) => normP.includes(w) && t.includes(w)))) return 45;
      if (scheme.name.includes('Term Loan') || scheme.name.includes('Micro Credit Finance') || scheme.name.includes('Laghu Vyavasaya') || scheme.name.includes('Mahila Samriddhi')) {
        return 40;
      }
      return 15;
    }

    const pWords = normP.split(/\s+/).filter((w) => w.length > 2);
    const typeWords = normalizedTypes.flatMap((t) => t.split(/\s+/));
    if (pWords.some((w) => typeWords.includes(w))) return 35;
  }

  if (isSanitationScheme || isArtisanScheme || isAgriScheme) return -30;
  if (isGreenScheme) return -15;

  return 15;
}

function incomeScore(scheme: Scheme, incomeRs: number | undefined): { score: number; warning?: string } {
  if (!incomeRs) return { score: 10 };
  const incomeLakh = incomeRs / 100000;

  if (incomeLakh > 5.0) {
    return {
      score: -20,
      warning: `Family income (₹${incomeLakh.toFixed(1)}L) exceeds the standard NSFDC concessional limit of ₹5.0L`,
    };
  }
  if (scheme.max_income_lakh && incomeLakh > scheme.max_income_lakh) {
    return {
      score: -20,
      warning: `Your family income exceeds the limit for this scheme (₹${scheme.max_income_lakh}L)`,
    };
  }
  if (scheme.min_income_lakh && incomeLakh < scheme.min_income_lakh) {
    return {
      score: -5,
      warning: `Your income may be below the minimum requirement for this scheme`,
    };
  }
  return { score: 20 };
}

function loanAmountScore(scheme: Scheme, amountRs: number | undefined): { score: number; warning?: string } {
  if (!amountRs) return { score: 10 };
  const amountLakh = amountRs / 100000;
  const schemeMax = Number(scheme.max_loan_lakh || 0);

  if (schemeMax === 0) {
    return {
      score: -100,
      warning: `${scheme.name} is a non-loan assistance programme (₹0 loan ceiling)`,
    };
  }

  if (amountLakh > schemeMax) {
    return {
      score: -20,
      warning: `Required amount (₹${amountLakh.toFixed(1)}L) exceeds this scheme's maximum limit (₹${scheme.max_loan_lakh}L)`,
    };
  }
  if (scheme.min_loan_lakh && amountLakh < scheme.min_loan_lakh) {
    return { score: -10, warning: `Your requirement is below the minimum loan for this scheme` };
  }
  return { score: 25 };
}

function educationScore(scheme: Scheme, isEducation: boolean): number {
  if (isEducation && scheme.education_required) return 50;
  if (isEducation && !scheme.education_required) return 0;
  if (!isEducation && scheme.education_required) return -150;
  return 5;
}

function genderScore(scheme: Scheme, gender: string | undefined): { score: number; warning?: string } {
  const isWomenOnly = scheme.gender_eligibility === 'women_only' || scheme.name.toLowerCase().includes('mahila');
  if (isWomenOnly) {
    if (gender === 'female') {
      return { score: 25 };
    }
    return { score: -300, warning: 'This scheme is exclusively for women applicants' };
  }
  return { score: 0 };
}

const MULTILINGUAL_EDUCATION_WORDS = [
  'education', 'study', 'college', 'school', 'engineering', 'medical', 'degree', 'student',
  'scholarship', 'university', 'course', 'vocational', 'tuition', 'btech', 'mtech', 'mba', 'mbbs',
  'शिक्षा', 'पढ़ाई', 'सिक्षा', 'शिक्षण', 'इंजीनियरिंग', 'कोर्स',
  'ಶಿಕ್ಷಣ', 'ಸಾಹಿತ್ಯ', 'ಅಧ್ಯಯನ', 'ಕಾಲೇಜು', 'ವಿದ್ಯಾಭ್ಯಾಸ', 'ಎಂಜಿನಿಯರಿಂಗ್',
  'શિક્ષણ', 'கல்வி', 'విద్య', 'വിദ്യാഭ്യാസം', 'ଶିକ୍ଷା', 'ਸਿੱਖਿਆ'
];

export function scoreSchemes(schemes: Scheme[], entities: UserEntities, categoryHint?: string): ScoredScheme[] {
  const pNorm = (entities.purpose || '').toLowerCase();
  const isEduCategory = categoryHint === 'education_loan' || (schemes.length > 0 && schemes.every((s) => s.category === 'education_loan'));
  const isEduPurpose = MULTILINGUAL_EDUCATION_WORDS.some((w) => pNorm.includes(w.toLowerCase()));
  const isEducation = !!(
    isEduCategory ||
    isEduPurpose ||
    entities.education_level ||
    entities.course
  );

  const scored = schemes
    .map((scheme): ScoredScheme => {
      let score = 0;
      const matchReasons: string[] = [];
      const warnings: string[] = [];

      const pScore = purposeMatchScore(scheme, entities.purpose);
      score += pScore;
      if (pScore >= 30) matchReasons.push('Purpose matches this scheme\'s eligible activities');

      const isDirectMatch = pScore >= 100;

      const { score: iScore, warning: iWarn } = incomeScore(scheme, entities.family_income_rs);
      score += iScore;
      if (iWarn) warnings.push(iWarn);
      else if (entities.family_income_rs) matchReasons.push('Income falls within eligible threshold');

      const { score: lScore, warning: lWarn } = loanAmountScore(scheme, entities.loan_amount_rs);
      score += lScore;
      if (lWarn) warnings.push(lWarn);
      else if (entities.loan_amount_rs) matchReasons.push('Loan requirement fits within scheme limits');

      let eScore = educationScore(scheme, isEducation);
      if (isDirectMatch && eScore < 0 && scheme.education_required) {
        eScore = 50;
      }
      score += eScore;
      if ((isEducation || isDirectMatch) && scheme.education_required) matchReasons.push('Designed for education/vocational financing');

      let { score: gScore, warning: gWarn } = genderScore(scheme, entities.gender);
      if (isDirectMatch && gScore < 0) {
        gScore = 0;
      }
      score += gScore;
      if (gWarn) warnings.push(gWarn);
      else if (entities.gender === 'female' && gScore > 0) matchReasons.push('Exclusive concessional scheme for women entrepreneurs');

      score += Math.max(0, (10 - Number(scheme.interest_rate_min || 6)) * 2);

      // --- 3-TIER DETERMINISTIC CLASSIFICATION (SIH PS 26092) ---
      let tier: SchemeTier = 'ELIGIBLE_SUBOPTIMAL';
      let disqualificationReason: string | undefined = undefined;

      const loanLakh = entities.loan_amount_rs ? entities.loan_amount_rs / 100000 : null;
      const incomeLakh = entities.family_income_rs ? entities.family_income_rs / 100000 : null;
      const isWomenOnly = scheme.gender_eligibility === 'women_only' || scheme.name.toLowerCase().includes('mahila');

      const schemeMaxLoan = Number(scheme.max_loan_lakh || 0);
      const schemeMaxIncome = Number(scheme.max_income_lakh || 0);

      const isBusinessQuery = categoryHint === 'business_loan' ||
        ['tailor', 'tailoring', 'sewing', 'business', 'shop', 'kirana', 'dairy', 'machine', 'सिलाई', 'शिलाई', 'दुकान', 'व्यापार'].some(w => pNorm.includes(w));

      // Boundary check 1: Loan ceiling exceeded (e.g. ₹55L > ₹50L Term Loan cap) or non-loan scheme when loan requested
      if (loanLakh && (schemeMaxLoan === 0 || loanLakh > schemeMaxLoan)) {
        tier = 'HARD_DISQUALIFIED';
        disqualificationReason = schemeMaxLoan === 0
          ? `${scheme.name} is a non-loan skill training or social welfare programme with no loan facility (₹0 cap). It cannot provide the requested loan of ₹${loanLakh.toFixed(1)}L.`
          : `Requested loan amount (₹${loanLakh.toFixed(1)}L) exceeds the maximum statutory ceiling of ₹${schemeMaxLoan.toFixed(1)}L for ${scheme.name}.`;
      }
      // Boundary check 1b: Business query vs non-loan welfare / skill training
      else if (isBusinessQuery && (scheme.category === 'skill_development' || scheme.category === 'welfare_programme' || scheme.education_required)) {
        tier = 'HARD_DISQUALIFIED';
        disqualificationReason = `${scheme.name} is a skill training or welfare programme, not an enterprise business loan.`;
      }
      // Boundary check 2: Family income exceeded (e.g. > ₹5.00L universal cap)
      else if (incomeLakh && schemeMaxIncome > 0 && incomeLakh > schemeMaxIncome) {
        tier = 'HARD_DISQUALIFIED';
        disqualificationReason = `Annual family income (₹${incomeLakh.toFixed(1)}L) exceeds the statutory eligibility cap of ₹${schemeMaxIncome.toFixed(1)}L/yr for NSFDC concessional loans.`;
      }
      // Boundary check 3: Gender exclusivity
      else if (isWomenOnly && entities.gender && entities.gender !== 'female' && !isDirectMatch) {
        tier = 'HARD_DISQUALIFIED';
        disqualificationReason = `This scheme is exclusively reserved for women entrepreneurs.`;
      }
      // Boundary check 4: Education requirement when completely non-educational
      else if (scheme.education_required && !isEducation && !isDirectMatch) {
        tier = 'HARD_DISQUALIFIED';
        disqualificationReason = `This scheme requires enrollment in an eligible technical, vocational, or professional course.`;
      }
      // Qualified schemes: Segment into OPTIMAL (score >= 80) vs SUBOPTIMAL (score 50–79)
      else if (score >= 80) {
        tier = 'ELIGIBLE_OPTIMAL';
      } else {
        tier = 'ELIGIBLE_SUBOPTIMAL';
      }

      if (tier === 'HARD_DISQUALIFIED') {
        if (disqualificationReason && !warnings.includes(disqualificationReason)) {
          warnings.unshift(disqualificationReason);
        }
        if (!isDirectMatch && score > 40) {
          score = 40;
        }
      }

      return { ...scheme, score, tier, matchReasons, warnings, disqualificationReason };
    })
    .filter((s) => s.score > -30)
    .sort((a, b) => {
      // Prioritize by tier first: OPTIMAL (1) > SUBOPTIMAL (2) > HARD_DISQUALIFIED (3)
      const tierRank = (t: SchemeTier) => (t === 'ELIGIBLE_OPTIMAL' ? 1 : t === 'ELIGIBLE_SUBOPTIMAL' ? 2 : 3);
      const rankDiff = tierRank(a.tier) - tierRank(b.tier);
      if (rankDiff !== 0) return rankDiff;
      return b.score - a.score;
    });

  return scored;
}

export async function recommendSchemes(entities: UserEntities, categoryHint?: string, limit: number = 3): Promise<ScoredScheme[]> {
  console.log('[SCHEME_SERVICE] recommendSchemes called:', JSON.stringify({ categoryHint, purpose: entities.purpose, loan_amount_rs: entities.loan_amount_rs, gender: entities.gender, family_income_rs: entities.family_income_rs }));
  let all = await fetchActiveSchemes(categoryHint);
  console.log(`[DATABASE] fetchActiveSchemes(${categoryHint || 'all'}) returned ${all.length} schemes`);

  // If category filtering returned zero, fall back to ALL active schemes
  if (all.length === 0 && categoryHint) {
    console.log('[DATABASE] Category filter returned 0 results, falling back to ALL active schemes');
    all = await fetchActiveSchemes();
  }

  const scored = scoreSchemes(all, entities, categoryHint);
  console.log(`[SCHEME_SERVICE] scoreSchemes returned ${scored.length} scored schemes:`, scored.map(s => `${s.name}(score=${s.score},tier=${s.tier})`).join(', '));

  if (scored.length === 0) {
    // Ultimate fallback: return top schemes from ALL active schemes
    const fallbackAll = await fetchActiveSchemes();
    return fallbackAll.slice(0, limit).map((s) => ({
      ...s,
      score: 50,
      tier: 'ELIGIBLE_SUBOPTIMAL' as SchemeTier,
      matchReasons: ['Official NSFDC Concessional Scheme'],
      warnings: [],
    }));
  }

  const eligible = scored.filter((s) => s.tier !== 'HARD_DISQUALIFIED');
  if (eligible.length > 0) {
    return eligible.slice(0, limit);
  }

  return scored.slice(0, limit);
}
