import { readonlyPool } from '../db/pool';
import type { UserEntities } from './ConversationSession';

export interface Scheme {
  id: number;
  name: string;
  short_name?: string | null;
  category: string;
  description: string;
  min_income_lakh?: number | null;
  max_income_lakh?: number | null;
  min_loan_lakh?: number | null;
  max_loan_lakh?: number | null;
  interest_rate_min?: number | null;
  interest_rate_max?: number | null;
  moratorium_months_min?: number | null;
  moratorium_months_max?: number | null;
  max_tenure_months?: number | null;
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
  for_sc?: boolean;
  for_st?: boolean;
  target_beneficiary?: string | null;
  state_or_body?: string | null;
  state?: string;
  level?: string;
  family_income_limit?: string | null;
  education_level?: string | null;
  education_levels?: string[] | null;
}

export type SchemeTier = 'ELIGIBLE_OPTIMAL' | 'ELIGIBLE_SUBOPTIMAL' | 'HARD_DISQUALIFIED';

export interface DisqualificationRecord {
  ruleId: string;
  factUsed: string;
  factSource: 'profile' | 'explicit_statement' | 'inferred';
  reason: string;
}

export interface ScoredScheme extends Scheme {
  score: number;
  match_percentage?: number;
  tier: SchemeTier;
  matchReasons: string[];
  warnings: string[];
  disqualificationReason?: string;
  disqualificationRecord?: DisqualificationRecord;
  clarifyingQuestion?: string;
}

export function normalizeSchemeText(str: string): string {
  return (str || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const INDIAN_STATES = [
  'Maharashtra', 'Gujarat', 'Madhya Pradesh', 'Jharkhand', 'Delhi', 'Goa',
  'Assam', 'Tamil Nadu', 'Karnataka', 'Kerala', 'Rajasthan', 'Uttar Pradesh',
  'Bihar', 'Punjab', 'Haryana', 'Andhra Pradesh', 'Telangana', 'West Bengal',
  'Odisha', 'Himachal Pradesh', 'Uttarakhand', 'Chhattisgarh'
];

export const CITY_STATE_MAP: Record<string, string> = {
  // Maharashtra
  'mumbai': 'Maharashtra', 'pune': 'Maharashtra', 'nagpur': 'Maharashtra', 'nashik': 'Maharashtra',
  'thane': 'Maharashtra', 'aurangabad': 'Maharashtra', 'solapur': 'Maharashtra', 'kolhapur': 'Maharashtra',
  'amravati': 'Maharashtra', 'nanded': 'Maharashtra', 'mh': 'Maharashtra',
  // Gujarat
  'ahmedabad': 'Gujarat', 'surat': 'Gujarat', 'vadodara': 'Gujarat', 'rajkot': 'Gujarat',
  'bhavnagar': 'Gujarat', 'jamnagar': 'Gujarat', 'gandhinagar': 'Gujarat', 'junagadh': 'Gujarat', 'gj': 'Gujarat',
  // Madhya Pradesh
  'bhopal': 'Madhya Pradesh', 'indore': 'Madhya Pradesh', 'gwalior': 'Madhya Pradesh', 'jabalpur': 'Madhya Pradesh',
  'ujjain': 'Madhya Pradesh', 'sagar': 'Madhya Pradesh', 'rewa': 'Madhya Pradesh', 'mp': 'Madhya Pradesh',
  // Jharkhand
  'ranchi': 'Jharkhand', 'jamshedpur': 'Jharkhand', 'dhanbad': 'Jharkhand', 'bokaro': 'Jharkhand',
  'deoghar': 'Jharkhand', 'hazaribagh': 'Jharkhand', 'jh': 'Jharkhand',
  // Delhi
  'delhi': 'Delhi', 'new delhi': 'Delhi', 'ncr': 'Delhi', 'dl': 'Delhi',
  // Goa
  'goa': 'Goa', 'panaji': 'Goa', 'margao': 'Goa', 'vasco': 'Goa', 'mapusa': 'Goa', 'ga': 'Goa',
  // Assam
  'assam': 'Assam', 'guwahati': 'Assam', 'silchar': 'Assam', 'dibrugarh': 'Assam', 'jorhat': 'Assam', 'as': 'Assam',
  // Tamil Nadu
  'chennai': 'Tamil Nadu', 'coimbatore': 'Tamil Nadu', 'madurai': 'Tamil Nadu', 'trichy': 'Tamil Nadu',
  'salem': 'Tamil Nadu', 'tirunelveli': 'Tamil Nadu', 'tiruppur': 'Tamil Nadu', 'tn': 'Tamil Nadu',
  // Karnataka
  'bengaluru': 'Karnataka', 'bangalore': 'Karnataka', 'mysuru': 'Karnataka', 'mysore': 'Karnataka',
  'hubli': 'Karnataka', 'mangaluru': 'Karnataka', 'belgaum': 'Karnataka', 'gulbarga': 'Karnataka', 'ka': 'Karnataka',
  // Kerala
  'thiruvananthapuram': 'Kerala', 'trivandrum': 'Kerala', 'kochi': 'Kerala', 'cochin': 'Kerala',
  'kozhikode': 'Kerala', 'thrissur': 'Kerala', 'kollam': 'Kerala', 'palakkad': 'Kerala', 'kl': 'Kerala',
  // Rajasthan
  'jaipur': 'Rajasthan', 'jodhpur': 'Rajasthan', 'kota': 'Rajasthan', 'bikaner': 'Rajasthan',
  'ajmer': 'Rajasthan', 'udaipur': 'Rajasthan', 'bhilwara': 'Rajasthan', 'alwar': 'Rajasthan', 'rj': 'Rajasthan',
  // Uttar Pradesh
  'lucknow': 'Uttar Pradesh', 'kanpur': 'Uttar Pradesh', 'varanasi': 'Uttar Pradesh', 'agra': 'Uttar Pradesh',
  'prayagraj': 'Uttar Pradesh', 'allahabad': 'Uttar Pradesh', 'meerut': 'Uttar Pradesh', 'noida': 'Uttar Pradesh',
  'ghaziabad': 'Uttar Pradesh', 'gorakhpur': 'Uttar Pradesh', 'bareilly': 'Uttar Pradesh', 'aligarh': 'Uttar Pradesh', 'up': 'Uttar Pradesh',
  // Bihar
  'patna': 'Bihar', 'gaya': 'Bihar', 'bhagalpur': 'Bihar', 'muzaffarpur': 'Bihar', 'purnia': 'Bihar',
  'darbhanga': 'Bihar', 'biharsharif': 'Bihar', 'br': 'Bihar',
  // Punjab
  'ludhiana': 'Punjab', 'amritsar': 'Punjab', 'jalandhar': 'Punjab', 'patiala': 'Punjab', 'bathinda': 'Punjab', 'pb': 'Punjab',
  // Haryana
  'gurugram': 'Haryana', 'gurgaon': 'Haryana', 'faridabad': 'Haryana', 'panipat': 'Haryana',
  'ambala': 'Haryana', 'karnal': 'Haryana', 'hisar': 'Haryana', 'rohtak': 'Haryana', 'hr': 'Haryana',
  // Andhra Pradesh
  'visakhapatnam': 'Andhra Pradesh', 'vizag': 'Andhra Pradesh', 'vijayawada': 'Andhra Pradesh',
  'guntur': 'Andhra Pradesh', 'nellore': 'Andhra Pradesh', 'kurnool': 'Andhra Pradesh', 'tirupati': 'Andhra Pradesh', 'ap': 'Andhra Pradesh',
  // Telangana
  'hyderabad': 'Telangana', 'warangal': 'Telangana', 'nizamabad': 'Telangana', 'karimnagar': 'Telangana', 'ts': 'Telangana', 'tg': 'Telangana',
  // West Bengal
  'kolkata': 'West Bengal', 'calcutta': 'West Bengal', 'howrah': 'West Bengal', 'durgapur': 'West Bengal',
  'asansol': 'West Bengal', 'siliguri': 'West Bengal', 'wb': 'West Bengal',
  // Odisha
  'bhubaneswar': 'Odisha', 'cuttack': 'Odisha', 'rourkela': 'Odisha', 'berhampur': 'Odisha', 'sambalpur': 'Odisha', 'or': 'Odisha', 'od': 'Odisha',
  // Himachal Pradesh
  'shimla': 'Himachal Pradesh', 'dharamshala': 'Himachal Pradesh', 'solan': 'Himachal Pradesh', 'mandi': 'Himachal Pradesh', 'hp': 'Himachal Pradesh',
  // Uttarakhand
  'dehradun': 'Uttarakhand', 'haridwar': 'Uttarakhand', 'roorkee': 'Uttarakhand', 'haldwani': 'Uttarakhand', 'rishikesh': 'Uttarakhand', 'uk': 'Uttarakhand',
  // Chhattisgarh
  'raipur': 'Chhattisgarh', 'bhilai': 'Chhattisgarh', 'bilaspur': 'Chhattisgarh', 'korba': 'Chhattisgarh', 'durg': 'Chhattisgarh', 'cg': 'Chhattisgarh'
};

export type EducationLevelStage =
  | 'pre_matric'
  | 'post_matric'
  | 'undergraduate'
  | 'postgraduate'
  | 'doctoral'
  | 'overseas'
  | 'vocational'
  | 'not_applicable';

export function normalizeEducationLevel(level?: string | null): EducationLevelStage | null {
  if (!level) return null;
  const l = level.trim().toLowerCase().replace(/[- ]/g, '_');
  if (['school', 'pre_matric', 'prematric', '9th', '10th', 'matric'].includes(l)) return 'pre_matric';
  if (['post_matric', 'postmatric', '11th', '12th', 'intermediate', 'higher_secondary'].includes(l)) return 'post_matric';
  if (['undergraduate', 'college', 'bachelors', 'degree', 'graduation', 'higher_education'].includes(l)) return 'undergraduate';
  if (['postgraduate', 'masters', 'post_graduate'].includes(l)) return 'postgraduate';
  if (['doctoral', 'phd', 'doctorate', 'mphil', 'research'].includes(l)) return 'doctoral';
  if (['overseas', 'abroad', 'foreign', 'international'].includes(l)) return 'overseas';
  if (['vocational', 'iti', 'polytechnic', 'diploma'].includes(l)) return 'vocational';
  return null;
}

export function detectEducationLevel(text?: string | null): EducationLevelStage | null {
  if (!text || !text.trim()) return null;
  const lower = text.toLowerCase();

  // 1. Overseas / Abroad (Highest priority for explicit foreign/international study)
  if (/\b(abroad|overseas|foreign|international|usa|uk|germany|canada|australia|विदेश|बाहेर)\b/i.test(lower)) {
    return 'overseas';
  }

  // 2. Doctoral / Research / PhD / MPhil
  if (/\b(phd|ph\.d|doctoral|doctorate|m\.?phil|fellowship|research|शोध|रिसर्च)\b/i.test(lower)) {
    return 'doctoral';
  }

  // 3. Postgraduate / Masters / MBA / MTech / MCA / MD / MS
  if (/\b(postgraduate|post-graduate|post_graduate|masters|master|mba|mtech|m\.tech|mca|msc|m\.sc|ma|m\.a|md|ms|post-grad|स्नातकोत्तर|पदव्युत्तर)\b/i.test(lower)) {
    return 'postgraduate';
  }

  // 4. Pre-Matric (Class 9, Class 10, School, Pre-Matric)
  if (
    /\b(pre-matric|pre_matric|prematric|class\s*9|class\s*10|class\s*ix|class\s*x|9th|10th|school|middle\s*school|primary|पूर्व-मैट्रिक|शाळा)\b/i.test(lower) &&
    !/\b(after\s*10th|post-matric|higher\s*education|college|abroad)\b/i.test(lower)
  ) {
    return 'pre_matric';
  }

  // 5. Post-Matric (Class 11, Class 12, Intermediate, +2, Junior College, Higher Secondary)
  if (/\b(post-matric|post_matric|postmatric|class\s*11|class\s*12|class\s*xi|class\s*xii|11th|12th|intermediate|inter|\+2|junior\s*college|higher\s*secondary|उत्तर-मैट्रिक)\b/i.test(lower)) {
    return 'post_matric';
  }

  // 6. Vocational / ITI / Polytechnic / Skill Course
  if (/\b(vocational|iti|polytechnic|trade\s*course|skill\s*training|diploma|व्यावसायिक)\b/i.test(lower)) {
    return 'vocational';
  }

  // 7. Undergraduate / Higher Education / College / Degree / BTech / MBBS / Graduation
  if (/\b(higher\s*education|college|undergraduate|under-graduate|bachelors|bachelor|degree|btech|b\.tech|be|b\.e|mbbs|bba|bca|bsc|b\.sc|ba|b\.a|bcom|b\.com|graduation|उच्च\s*शिक्षा|महाविद्यालय|पदवी)\b/i.test(lower)) {
    return 'undergraduate';
  }

  return null;
}

export function schemeSupportsLevel(scheme: Scheme, targetLevel: EducationLevelStage): boolean {
  if (!scheme.education_level && (!scheme.education_levels || scheme.education_levels.length === 0)) {
    return true;
  }
  if (scheme.education_level === targetLevel) return true;
  if (scheme.education_levels && scheme.education_levels.includes(targetLevel)) return true;
  if (targetLevel === 'undergraduate' && scheme.education_levels?.includes('higher_education')) return true;
  if (targetLevel === 'postgraduate' && scheme.education_levels?.includes('higher_education')) return true;
  if (scheme.education_level === 'overseas' && (targetLevel === 'postgraduate' || targetLevel === 'doctoral' || targetLevel === 'undergraduate')) return true;
  return false;
}

export function isEducationStageScheme(scheme: Scheme): boolean {
  const normTypes = (scheme.eligible_project_types || []).map((t) => (t || '').toLowerCase().replace(/_/g, ' '));
  // Profession setup / clinic / enterprise is NOT an education stage scheme
  if (
    normTypes.some((t) => /clinic_setup|medical_equipment|self_employment|small_trade|business|manufacturing/.test(t)) ||
    /clinic|doctor/i.test(scheme.name)
  ) {
    return false;
  }

  const isScholarshipOrTuition =
    /scholarship|fellowship|shishyavrutti|tuition|vidyasiri|chhatra|balika shiksha/i.test(scheme.name) ||
    normTypes.some((t) => /scholarship|fellowship|tuition|education|higher_education|post_matric|pre_matric|phd/.test(t)) ||
    scheme.scheme_type === 'scholarship';

  return isScholarshipOrTuition && Boolean(scheme.education_level && scheme.education_level !== 'not_applicable');
}

export interface ExtractedProfile {
  community?: string;
  qualification?: string;
  occupation?: string;
  is_current_student: boolean;
  current_stage?: EducationLevelStage;
  state?: string;
  is_state_explicit: boolean;
  gender?: string;
  is_gender_explicit: boolean;
  age?: number;
  is_age_explicit: boolean;
  family_income_rs?: number;
  is_income_explicit: boolean;
  loan_amount_rs?: number;
  is_loan_explicit: boolean;
}

export interface ExtractedNeed {
  raw_purpose: string;
  clean_purpose: string;
  need_type: 'loan' | 'grant' | 'scholarship' | 'insurance' | 'training' | 'pension' | 'housing' | 'business';
  sector?: string;
  is_education_funding: boolean;
  is_health_treatment: boolean;
  is_pension_need: boolean;
  is_housing_need: boolean;
  is_laptop_need: boolean;
  is_fellowship_need: boolean;
  is_clinic_or_doctor_setup: boolean;
}

export interface ExtractedIntent {
  profile: ExtractedProfile;
  need: ExtractedNeed;
}

export function extractUserProfileAndNeed(text: string | undefined, entities: UserEntities): ExtractedIntent {
  const rawP = (text || entities.purpose || '').trim();
  const lowerP = rawP.toLowerCase();

  // 1. Profile Extraction
  // A. Community
  let community: string | undefined = entities.social_category;
  if (!community) {
    if (/\b(sc|scheduled\s*caste|dalit)\b/i.test(lowerP)) community = 'SC';
    else if (/\b(st|scheduled\s*tribe|adivasi)\b/i.test(lowerP)) community = 'ST';
    else if (/\b(obc|other\s*backward)\b/i.test(lowerP)) community = 'OBC';
    else if (/\b(ebc|economically\s*backward)\b/i.test(lowerP)) community = 'EBC';
  }

  // B. Qualification (who the user is / has completed)
  let qualification: string | undefined = undefined;
  const qualMatch = lowerP.match(/\b(medical\s*graduate|mbbs\s*graduate|bds\s*graduate|engineering\s*graduate|college\s*graduate|graduate|postgraduate|bds\s*holder|mbbs\s*holder|b\.?tech\s*holder|degree\s*holder|diploma\s*holder|matriculate|10th\s*pass|12th\s*pass)\b/i);
  if (qualMatch) qualification = qualMatch[1].toLowerCase();

  // C. Occupation (who the user is)
  let occupation: string | undefined = undefined;
  const occMatch = lowerP.match(/\b(doctor|physician|dentist|surgeon|farmer|kisan|artisan|weaver|cobbler|leather\s*worker|tanner|driver|safai\s*karamchari|sanitation\s*worker|scavenger|tailor|carpenter|blacksmith)\b/i);
  if (occMatch) occupation = occMatch[1].toLowerCase();

  // D. Current Student Status (is the user currently enrolled / studying?)
  // MUST NOT be triggered by past qualification words like "graduate", "medical graduate", "degree holder"
  const currentStudentSignals = /\b(currently\s+studying|studying\s+in|student\s+in|enrolled\s+in|admission\s+to|admitted\s+to|pursuing\s+(?:phd|degree|btech|mbbs|masters)|school\s+student|college\s+student|in\s+class\s*\d+|in\s+\d+th\s+standard|school\s+fees|college\s+fees|tuition\s+fees|scholarship\s+for\s+(?:my|me)|school\s+scholarship)\b/i;
  const is_current_student = Boolean(
    entities.course ||
    (entities.education_level && !qualification && !occupation) ||
    currentStudentSignals.test(lowerP)
  );

  let current_stage: EducationLevelStage | undefined = undefined;
  if (is_current_student) {
    current_stage = (normalizeEducationLevel(entities.education_level) || detectEducationLevel(lowerP)) || undefined;
  }

  // E. Explicit State
  const resolvedState = resolveUserState(entities);
  const is_state_explicit = Boolean(
    entities.state ||
    entities.location ||
    /\b(?:in|living in|resident of|from)\s+([a-zA-Z\s]+)\b/i.test(lowerP)
  );

  // F. Explicit Gender
  const is_gender_explicit = Boolean(
    entities.gender ||
    /\b(i am a woman|female|pregnant|mother|widow|महिला|स्त्री|i am a man|male|पुरुष)\b/i.test(lowerP)
  );
  let gender = entities.gender;
  if (!gender) {
    if (/\b(i am a woman|female|pregnant|mother|widow|महिला|स्त्री)\b/i.test(lowerP)) gender = 'female';
    else if (/\b(i am a man|male|पुरुष)\b/i.test(lowerP)) gender = 'male';
  }

  // G. Explicit Age
  const is_age_explicit = Boolean(entities.age != null);
  let age = entities.age;
  if (age == null) {
    const ageMatch = lowerP.match(/\b(?:age|aged|am)\s*(\d{1,2})\s*(?:years?\s*old|yr|yrs)?\b/i);
    if (ageMatch && ageMatch[1]) {
      const parsedAge = parseInt(ageMatch[1], 10);
      if (parsedAge >= 10 && parsedAge <= 110) {
        age = parsedAge;
      }
    }
  }

  // H. Explicit Income & Loan
  const is_income_explicit = Boolean(entities.family_income_rs != null);
  const is_loan_explicit = Boolean(entities.loan_amount_rs != null);

  // 2. Need Extraction (What the user wants to do)
  // Check specific intent flags
  const is_clinic_or_doctor_setup = /\b(clinic|private\s*clinic|open\s*a?\s*clinic|start\s*a?\s*clinic|medical\s*equipment|clinic\s*setup|medical\s*practice)\b/i.test(lowerP);
  
  const is_health_treatment = !is_clinic_or_doctor_setup && (
    /\b(health\s*insurance|mediclaim|health\s*cover|medical\s*insurance|hospitalisation|hospitalization)\b/i.test(lowerP) ||
    /\b(medical\s*treatment|cancer\s*treatment|treatment\s*grant|surgery|illness|disease|medical\s*bill|hospital\s*bill|patient|इलाज|बीमारी|अस्पताल)\b/i.test(lowerP)
  );

  const is_pension_need = /\b(pension|old\s*age\s*pension|widow\s*pension|senior\s*citizen\s*pension|nsap|social\s*security\s*pension|पेंशन|वृद्धावस्था)\b/i.test(lowerP);
  
  const is_housing_need = !/poly\s*house|chhatrawas/i.test(lowerP) && /\b(housing|house|home|awas|residential|flat|shelter|pucca\s*house|construct\s*a?\s*house|build\s*a?\s*house|आवास|मकान|घर)\b/i.test(lowerP);

  const is_laptop_need = /\b(laptop|laptops|computer|computers|pc|tablet|tablets|लैपटॉप|कंप्यूटर)\b/i.test(lowerP);

  const is_fellowship_need = /\b(phd|ph\.d|doctoral|doctorate|m\.?phil|fellowship|research\s*fellowship|शोध|रिसर्च)\b/i.test(lowerP);

  const is_education_funding = !is_clinic_or_doctor_setup && (
    is_fellowship_need ||
    is_laptop_need ||
    is_current_student ||
    /\b(education|study|studies|studying|college|school|university|degree|btech|mba|mbbs|engineering|scholarship|tuition|school\s*fees|college\s*fees|education\s*loan|study\s*loan|fund\s*my\s*studies|study\s*abroad|overseas\s*education|coaching|iit|nit|iim|iiit|aiims|छात्रवृत्ति|शिष्यवृत्ती|शिक्षा|पढ़ाई)\b/i.test(lowerP)
  );

  let need_type: ExtractedNeed['need_type'] = 'business';
  if (is_fellowship_need || is_education_funding) need_type = 'scholarship';
  else if (is_health_treatment) need_type = 'insurance';
  else if (is_pension_need) need_type = 'pension';
  else if (is_housing_need) need_type = 'housing';

  // Clean purpose text stripped of profile prefixes
  let clean_purpose = rawP
    .replace(/^i\s+am\s+an?\s+(?:sc|st|obc|ebc|general)?\s*(?:medical\s*graduate|doctor|farmer|artisan|weaver|student|widow)?\s*(?:and\s+)?(?:want\s+to|need\s+to|looking\s+to)?/i, '')
    .trim();
  if (!clean_purpose) clean_purpose = rawP;

  return {
    profile: {
      community,
      qualification,
      occupation,
      is_current_student,
      current_stage,
      state: resolvedState || undefined,
      is_state_explicit,
      gender,
      is_gender_explicit,
      age,
      is_age_explicit,
      family_income_rs: entities.family_income_rs,
      is_income_explicit,
      loan_amount_rs: entities.loan_amount_rs,
      is_loan_explicit,
    },
    need: {
      raw_purpose: rawP,
      clean_purpose,
      need_type,
      is_education_funding,
      is_health_treatment,
      is_pension_need,
      is_housing_need,
      is_laptop_need,
      is_fellowship_need,
      is_clinic_or_doctor_setup,
    },
  };
}

export function resolveUserState(entities: UserEntities): string | null {
  if (entities.state && entities.state.trim()) {
    const raw = entities.state.trim().toLowerCase();
    for (const s of INDIAN_STATES) {
      if (s.toLowerCase() === raw || raw.includes(s.toLowerCase())) return s;
    }
    if (CITY_STATE_MAP[raw]) return CITY_STATE_MAP[raw];
  }

  // Check location string (city/district/state)
  if (entities.location && entities.location.trim()) {
    const loc = entities.location.toLowerCase();
    for (const s of INDIAN_STATES) {
      if (loc.includes(s.toLowerCase())) return s;
    }
    const words = loc.split(/[\s,.-]+/).filter(Boolean);
    for (const w of words) {
      if (CITY_STATE_MAP[w]) return CITY_STATE_MAP[w];
    }
  }

  // Check purpose or raw text for explicit state mention
  if (entities.purpose) {
    const p = entities.purpose.toLowerCase();
    for (const s of INDIAN_STATES) {
      const sLower = s.toLowerCase();
      const regex = new RegExp(`\\b${sLower}\\b`, 'i');
      if (regex.test(p)) return s;
    }
    const words = p.split(/[\s,.-]+/).filter(Boolean);
    for (const w of words) {
      if (CITY_STATE_MAP[w]) return CITY_STATE_MAP[w];
    }
  }

  return null;
}

export async function fetchActiveSchemes(categoryHint?: string, userState?: string | null, stateOnly?: boolean): Promise<Scheme[]> {
  let query = 'SELECT * FROM schemes WHERE active = TRUE';
  const params: (string | number)[] = [];

  // We fetch all active schemes to avoid hiding candidates due to incorrect category hints from the LLM.
  // The advanced semantic scoring in scoreSchemes() will naturally sort and filter based on purpose and limits.

  if (stateOnly && userState) {
    params.push(userState);
    query += ` AND (state ILIKE $${params.length} AND (level = 'State' OR state != 'Central'))`;
  } else if (userState) {
    params.push(userState);
    query += ` AND (state = 'Central' OR state ILIKE $${params.length})`;
  }

  query += ' ORDER BY interest_rate_min ASC NULLS LAST, id ASC';
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

  const isAlternativeOrCompare =
    /\b(alternative|alternatives|other schemes?|similar|options|compare|comparison|versus|vs|better|all schemes?|more schemes?|which scheme is better|diff|difference|is there any|are there any|any\s*(?:other\s*)?schemes?|any\s*scheme|suggest\s*schemes?)\b/i.test(message) ||
    /विकल्प|अन्य योजना|इतर योजना|तुलना|फरक|સરખામણી|તુલના|વિકલ્પ|অন্যান্য/i.test(message);

  let queryFocus: SpecificSchemeResolution['queryFocus'] = 'overview';
  if (/interest rate|interest|rate of interest|vyaaj|vyaj|ब्याज|व्याज|વ્યાજ|સુદ|வட்டி|వడ్డీ/i.test(message)) {
    queryFocus = 'interest_rate';
  } else if (/eligib|who can apply|criteria|qualified|qualification|पात्रता|पात्र|योग्य|લાયકાत|যোগ্যতা/i.test(message)) {
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

  let matchedScheme: Scheme | null = null;
  const words = normAscii.split(' ').filter(Boolean);

  const NON_SCHEME_ACRONYMS = new Set(['sc', 'st', 'obc', 'ebc', 'dnt', 'vjnt', 'pwd', 'central', 'state', 'gujarat', 'maharashtra', 'rajasthan', 'punjab', 'delhi', 'mp', 'up', 'hp', 'ap']);

  for (const s of activeSchemes) {
    const parensMatch = s.name.match(/\(([^)]+)\)/);
    let acronym = parensMatch ? normalizeSchemeText(parensMatch[1]) : '';
    if (NON_SCHEME_ACRONYMS.has(acronym)) acronym = '';
    const baseName = normalizeSchemeText(s.name.replace(/\([^)]+\)/, ''));
    const fullName = normalizeSchemeText(s.name);
    const shortName = s.short_name ? normalizeSchemeText(s.short_name) : '';
    const normAliases = (s.aliases || []).map((a) => normalizeSchemeText(a));
    const multiAliases = (MULTILINGUAL_SCHEME_ALIASES[s.id] || []).map((a) => normalizeMultilingualText(a));
    const dbMultiAliases = (s.aliases || []).map((a) => normalizeMultilingualText(a));

    const isAcronymMatch = acronym.length >= 2 && (
      acronym === 'may'
        ? (normAscii === 'may' || /\bmay\s+(?:scheme|yojana|loan)\b/i.test(normAscii) || /\b(?:about|details\s*of)\s+may\b/i.test(normAscii))
        : words.includes(acronym)
    );
    const isShortMatch = shortName.length >= 2 && (
      shortName === 'may'
        ? (normAscii === 'may' || /\bmay\s+(?:scheme|yojana|loan)\b/i.test(normAscii) || /\b(?:about|details\s*of)\s+may\b/i.test(normAscii))
        : words.includes(shortName)
    );
    const isFullNameMatch = fullName.length >= 5 && normAscii.includes(fullName);
    const isBaseNameMatch = baseName.length >= 5 && normAscii.includes(baseName);

    const isAliasMatch = normAliases.some((alias) => {
      if (alias === 'may') {
        return normAscii === 'may' || /\bmay\s+(?:scheme|yojana|loan)\b/i.test(normAscii) || /\b(?:about|details\s*of)\s+may\b/i.test(normAscii);
      }
      if (alias.length <= 4) return words.includes(alias);
      return normAscii.includes(alias);
    });

    const isMultiMatch = multiAliases.some((alias) => normMulti.includes(alias)) ||
      dbMultiAliases.some((alias) => alias.length >= 3 && normMulti.includes(alias));

    if (isAcronymMatch || isShortMatch || isFullNameMatch || isBaseNameMatch || isAliasMatch || isMultiMatch) {
      matchedScheme = s;
      break;
    }
  }

  if (!matchedScheme && currentSelected?.id) {
    const prevScheme = activeSchemes.find((s) => s.id === currentSelected.id);
    if (prevScheme) {
      const isPronounOrFollowup =
        /\b(this|that|it|its|the scheme|this scheme|this loan|that loan|the loan)\b/i.test(message) ||
        /इस योजना|यह योजना|या योजने|या योजनेची|આ યોજના|এই প্রকল্প|அந்த திட்டம்|ఈ పథకం/i.test(message) ||
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
  const NON_SCHEME_ACRONYMS = new Set(['sc', 'st', 'obc', 'ebc', 'dnt', 'vjnt', 'pwd', 'central', 'state', 'gujarat', 'maharashtra', 'rajasthan', 'punjab', 'delhi', 'mp', 'up', 'hp', 'ap']);

  for (const s of all) {
    const parensMatch = s.name.match(/\(([^)]+)\)/);
    let acronym = parensMatch ? normalizeSchemeText(parensMatch[1]) : '';
    if (NON_SCHEME_ACRONYMS.has(acronym)) acronym = '';
    const baseName = normalizeSchemeText(s.name.replace(/\([^)]+\)/, ''));
    const fullName = normalizeSchemeText(s.name);
    const shortName = s.short_name ? normalizeSchemeText(s.short_name) : '';
    const normAliases = (s.aliases || []).map((a) => normalizeSchemeText(a));
    const multiAliases = (MULTILINGUAL_SCHEME_ALIASES[s.id] || []).map((a) => normalizeMultilingualText(a));

    if (
      (acronym && (acronym === 'may' ? (normInput === 'may' || /\bmay\s+(?:scheme|yojana|loan)\b/i.test(normInput)) : (normInput === acronym || normInput.split(' ').includes(acronym)))) ||
      (shortName && (shortName === 'may' ? (normInput === 'may' || /\bmay\s+(?:scheme|yojana|loan)\b/i.test(normInput)) : (normInput === shortName || normInput.split(' ').includes(shortName)))) ||
      (baseName && (normInput === baseName || normInput.includes(baseName) || baseName.includes(normInput))) ||
      (fullName && (normInput === fullName || normInput.includes(fullName) || fullName.includes(normInput))) ||
      normAliases.some((alias) => {
        if (alias === 'may') return normInput === 'may' || /\bmay\s+(?:scheme|yojana|loan)\b/i.test(normInput);
        return alias.length >= 2 && (normInput === alias || normInput.includes(alias) || alias.includes(normInput));
      }) ||
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

export function checkNarrowTradeMismatch(scheme: Scheme, normP: string): { isNarrow: boolean; mismatched: boolean; reason?: string } {
  // 1. Medical graduate doctors / private clinic setup
  const isDoctorClinicScheme =
    scheme.id === 76 ||
    /\b(clinic_setup|medical\s*graduate|private\s*clinic|mbbs|bds)\b/i.test(
      scheme.name + ' ' + (scheme.eligible_project_types || []).join(' ') + ' ' + (scheme.target_beneficiary || '') + ' ' + (scheme.description || '')
    );
  if (isDoctorClinicScheme) {
    const isDoctorClinicQuery = /\b(doctor|doctors|physician|dentist|mbbs|bds|md|clinic|private\s*clinic|medical\s*graduate|medical\s*equipment)\b/i.test(normP);
    if (!isDoctorClinicQuery) {
      return {
        isNarrow: true,
        mismatched: true,
        reason: `${scheme.name} is strictly for SC medical graduate doctors (MBBS/BDS/MD) setting up private clinics or purchasing medical equipment.`
      };
    }
    return { isNarrow: true, mismatched: false };
  }

  // 2. Leather craft / Charmakar community
  const isLeatherScheme =
    scheme.id === 72 ||
    /\b(leather_craft|charmakar|leather\s*worker|tanner|चर्मकार)\b/i.test(
      scheme.name + ' ' + (scheme.eligible_project_types || []).join(' ') + ' ' + (scheme.target_beneficiary || '') + ' ' + (scheme.description || '')
    );
  if (isLeatherScheme) {
    const isLeatherQuery = /\b(leather|charmakar|footwear|shoe|shoes|cobbler|tanner|tannery|चर्मकार|चमड़ा)\b/i.test(normP);
    if (!isLeatherQuery) {
      return {
        isNarrow: true,
        mismatched: true,
        reason: `${scheme.name} is strictly for the Charmakar (leather-working) community and leather craft/footwear enterprises.`
      };
    }
    return { isNarrow: true, mismatched: false };
  }

  // 3. Passenger Auto-rickshaw
  const isAutoRickshawScheme =
    scheme.id === 75 ||
    ((scheme.eligible_project_types || []).includes('auto_rickshaw') && !(scheme.eligible_project_types || []).includes('small_trade'));
  if (isAutoRickshawScheme) {
    const isAutoQuery = /\b(auto|rickshaw|auto-rickshaw|autorickshaw|three\s*wheeler|taxi|commercial\s*driver)\b/i.test(normP);
    if (!isAutoQuery) {
      return {
        isNarrow: true,
        mismatched: true,
        reason: `${scheme.name} is strictly for the purchase and operation of passenger auto-rickshaws.`
      };
    }
    return { isNarrow: true, mismatched: false };
  }

  // 4. Sanitation / Safai Karamchari / Scavenger
  const isSanitationWorkerScheme =
    /\b(safai\s*karamchari|manual\s*scavenger|sanitation\s*worker)\b/i.test(
      scheme.name + ' ' + (scheme.target_beneficiary || '') + ' ' + (scheme.description || '')
    );
  if (isSanitationWorkerScheme) {
    const isSanitationQuery = /\b(safai|sanitation|scavenger|cleaning\s*worker|waste\s*picker)\b/i.test(normP);
    if (!isSanitationQuery) {
      return {
        isNarrow: true,
        mismatched: true,
        reason: `${scheme.name} is strictly for sanitation workers, manual scavengers, and their dependents.`
      };
    }
    return { isNarrow: true, mismatched: false };
  }

  // 5. Foundation Seed Production & Dedicated Agriculture Subsidy
  const isSeedScheme = scheme.id === 113 || /foundation seeds|seed production/i.test(scheme.name);
  if (isSeedScheme) {
    const isSeedQuery = /\b(seed|seeds|farming|crop|farmer)\b/i.test(normP) && !/\b(grocery|kirana|shop|store|retail|dukaan|stationery|bookstore)\b/i.test(normP);
    if (!isSeedQuery) {
      return {
        isNarrow: true,
        mismatched: true,
        reason: `${scheme.name} is strictly for foundation seed production for SC/ST farmers, not commercial retail shop or trade enterprises.`
      };
    }
    return { isNarrow: true, mismatched: false };
  }

  // 6. Dedicated agricultural cultivation / farming subsidy schemes vs non-farm retail/commercial shop queries
  const isRetailTradeQuery = /\b(grocery|kirana|shop|store|retail|dukaan|stationery|bookstore|books|tailor|tailoring|salon|parlour)\b/i.test(normP);
  const isDedicatedAgri =
    (scheme.eligible_project_types || []).length > 0 &&
    (scheme.eligible_project_types || []).every(t => /agriculture|seed_production|farming|crop|livestock|cattle|poultry|fisheries/i.test(t)) &&
    !(scheme.eligible_project_types || []).some(t => /small_trade|petty_shop|retail|shop|self_employment|services/.test(t));
  if (isDedicatedAgri && isRetailTradeQuery) {
    return {
      isNarrow: true,
      mismatched: true,
      reason: `${scheme.name} is strictly for agricultural farming / crop production activities, not commercial retail shop or trade enterprises.`
    };
  }

  return { isNarrow: false, mismatched: false };
}

function purposeMatchScore(scheme: Scheme, purpose: string | undefined): number {
  const p = (purpose || '').trim();
  if (!p) return 15;

  const normP = normalizeSchemeText(p);
  const pTokens = normP.split(/\s+/).filter(Boolean);

  // Narrow trade mismatch penalty
  const narrow = checkNarrowTradeMismatch(scheme, normP);
  if (narrow.mismatched) {
    return -100;
  }

  const parensMatch = scheme.name.match(/\(([^)]+)\)/);
  let acronym = parensMatch ? normalizeSchemeText(parensMatch[1]) : '';
  const NON_SCHEME_ACRONYMS = new Set(['sc', 'st', 'obc', 'ebc', 'dnt', 'vjnt', 'pwd', 'central', 'state', 'gujarat', 'maharashtra', 'rajasthan', 'punjab', 'delhi', 'mp', 'up', 'hp', 'ap']);
  if (NON_SCHEME_ACRONYMS.has(acronym)) acronym = '';
  const baseName = scheme.name.replace(/\([^)]+\)/, '').trim();

  const normAcronym = normalizeSchemeText(acronym);
  const normBaseName = normalizeSchemeText(baseName);
  const normFullName = normalizeSchemeText(scheme.name);
  const normShortName = scheme.short_name ? normalizeSchemeText(scheme.short_name) : '';
  const normAliases = (scheme.aliases || []).map((a) => normalizeSchemeText(a));

  // Check direct scheme match against acronym, short_name, base_name, full_name, or aliases
  const isAcronymMatch = normAcronym.length > 0 && (
    normAcronym === 'may'
      ? (normP === 'may' || /\bmay\s+(?:scheme|yojana|loan)\b/i.test(normP) || /\b(?:about|details\s*of)\s+may\b/i.test(normP))
      : (normP === normAcronym || pTokens.includes(normAcronym))
  );
  const isShortMatch = normShortName.length > 0 && (
    normShortName === 'may'
      ? (normP === 'may' || /\bmay\s+(?:scheme|yojana|loan)\b/i.test(normP) || /\b(?:about|details\s*of)\s+may\b/i.test(normP))
      : (normP === normShortName || pTokens.includes(normShortName))
  );
  const isFullNameMatch = normFullName.length >= 3 && (normP === normFullName || normP.includes(normFullName) || normFullName.includes(normP));
  const isBaseNameMatch = normBaseName.length >= 3 && (normP === normBaseName || normP.includes(normBaseName) || normBaseName.includes(normP));
  const isAliasMatch = normAliases.some((alias) => {
    if (alias === 'may') {
      return normP === 'may' || /\bmay\s+(?:scheme|yojana|loan)\b/i.test(normP) || /\b(?:about|details\s*of)\s+may\b/i.test(normP);
    }
    return alias.length >= 2 && (normP === alias || normP.includes(alias) || alias.includes(normP));
  });

  const rawTypes = scheme.eligible_project_types || [];
  const normalizedTypes = rawTypes.map((t) => t.toLowerCase().replace(/[-_]/g, ' '));

  if (isAcronymMatch || isShortMatch || isFullNameMatch || isBaseNameMatch || isAliasMatch) {
    const tokenBonus = normalizedTypes.some((t) => normP.includes(t)) ? 20 : 0;
    return 100 + tokenBonus;
  }

  // Generic keyword overlap scoring based on eligible_project_types
  let tagMatchScore = 0;
  let matchingTagCount = 0;

  const GENERIC_TAG_STOPWORDS = new Set([
    'insurance', 'loan', 'scheme', 'schemes', 'support', 'training', 'development',
    'programme', 'program', 'assistance', 'credit', 'finance', 'subsidy', 'fund',
    'services', 'centre', 'benefit', 'benefits', 'project', 'activities'
  ]);

  for (const tag of normalizedTypes) {
    if (!tag) continue;
    // Exclude 'poly house' from false matching residential housing queries
    if (tag === 'poly house' && (normP.includes('house') || normP.includes('housing') || normP.includes('awas')) && !normP.includes('poly')) {
      continue;
    }
    if (normP.includes(tag) || tag.includes(normP)) {
      tagMatchScore += 45;
      matchingTagCount++;
      continue;
    }
    const tagWords = tag.split(/\s+/).filter((w) => w.length > 2 && !GENERIC_TAG_STOPWORDS.has(w));
    const hasWordMatch = tagWords.some((tw) => pTokens.includes(tw) || normP.includes(tw));
    if (hasWordMatch) {
      tagMatchScore += 30;
      matchingTagCount++;
    }
  }

  // Rural / Urban semantic match
  const ruralWords = ['rural', 'village', 'gaon', 'gram', 'gramin', 'गांव', 'ग्राम', 'ग्रामीण', 'ગામ', 'ಗ್ರಾಮ', 'ഗ്രാമം', 'கிராமம்', 'పల్లె', 'ଗାଁ', 'ਪਿੰਡ'];
  const urbanWords = ['urban', 'city', 'town', 'municipal', 'metro', 'shahar', 'nagarpalika', 'शहर', 'नगर'];

  const isRuralQuery = ruralWords.some((w) => normP.includes(w));
  const isUrbanQuery = urbanWords.some((w) => normP.includes(w));
  const isRuralScheme = normalizedTypes.some(t => t.includes('rural')) || /gramin|rural/i.test(scheme.name);
  const isUrbanScheme = normalizedTypes.some(t => t.includes('urban')) || /urban/i.test(scheme.name);

  if (isRuralQuery && isUrbanScheme && !isRuralScheme) {
    tagMatchScore -= 60;
  }
  if (isUrbanQuery && isRuralScheme && !isUrbanScheme) {
    tagMatchScore -= 60;
  }
  if (isRuralQuery && isRuralScheme) {
    tagMatchScore += 45;
    matchingTagCount++;
  }
  if (isUrbanQuery && isUrbanScheme) {
    tagMatchScore += 45;
    matchingTagCount++;
  }

  // Housing specialized semantic match
  const housingWords = [
    'housing', 'house', 'home', 'awas', 'residential', 'shelter', 'flat', 'property',
    'आवास', 'मकान', 'घर', 'गृह'
  ];
  const isHousingQuery = housingWords.some((w) => normP.includes(w));
  const isHousingScheme = normalizedTypes.some((t) => /housing|rural housing|urban housing|affordable housing/.test(t) || /\bawas\b/.test(t)) || (/\b(awas|housing)\b/i.test(scheme.name) && !/chhatrawas/i.test(scheme.name));

  if (isHousingQuery) {
    if (isHousingScheme) {
      tagMatchScore += 65;
      matchingTagCount++;
      return Math.max(85, 45 + tagMatchScore);
    }
    // Heavy negative penalty for non-housing schemes when housing is explicitly requested
    return -75;
  }

  // Health & Medical Insurance specialized semantic match
  const isClinicOrDoctorSetup = /\b(clinic|private\s*clinic|open\s*a?\s*clinic|start\s*a?\s*clinic|medical\s*equipment|clinic\s*setup|medical\s*practice)\b/i.test(normP);
  const isHealthInsuranceQuery = /\b(health\s*insurance|mediclaim|health\s*cover|medical\s*insurance|hospitalisation|hospitalization)\b/i.test(normP) ||
    ((normP.includes('health') || normP.includes('swasthya') || normP.includes('arogya') || normP.includes('स्वास्थ्य') || normP.includes('आरोग्य')) &&
     (normP.includes('insurance') || normP.includes('bima') || normP.includes('बीमा')));
  const isHealthQuery = !isClinicOrDoctorSetup && (
    isHealthInsuranceQuery ||
    /\b(health|hospital|hospitalisation|hospitalization|treatment|illness|disease|surgery|medicine|ayushman|swasthya|arogya|mediclaim|healthcare|cancer|dialysis|cure|patient|स्वास्थ्य|आरोग्य|इलाज|दवा|दवाई|अस्पताल|बीमारी)\b/i.test(normP) ||
    (/\bmedical\b/i.test(normP) && !/\b(medical\s*graduate|medical\s*college|medical\s*education|medical\s*admission|mbbs)\b/i.test(normP))
  );

  const isHealthInsuranceScheme = normalizedTypes.some((t) => /health_insurance|medical_treatment|hospitalisation|hospitalization/.test(t)) ||
    /\b(ayushman|jan arogya|swasthya bima)\b/i.test(scheme.name);
  const isHealthScheme = isHealthInsuranceScheme ||
    normalizedTypes.some((t) => /health|medical|swasthya|arogya/.test(t)) ||
    /\b(ayushman|arogya|swasthya|jan arogya)\b/i.test(scheme.name);

  if (isHealthInsuranceQuery) {
    if (isHealthInsuranceScheme) {
      tagMatchScore += 80;
      matchingTagCount++;
      return Math.max(90, 45 + tagMatchScore);
    }
    return -80;
  }

  if (isHealthQuery) {
    if (isHealthScheme) {
      tagMatchScore += 80;
      matchingTagCount++;
      return Math.max(90, 45 + tagMatchScore);
    }
    // Heavy negative penalty for non-health schemes (especially crop insurance, general bank accounts, skill programmes)
    return -80;
  }

  // Pension & Senior Citizen Social Security specialized semantic match
  const pensionWords = [
    'pension', 'old age', 'elderly', 'senior citizen', 'retirement', 'retire',
    'widow pension', 'disability pension', 'nsap', 'vridha', 'vriddha',
    'पेंशन', 'वृद्धावस्था', 'बुजुर्ग', 'वरिष्ठ नागरिक', 'निवृत्ती वेतन'
  ];
  const isPensionQuery = pensionWords.some((w) => normP.includes(w));
  const isPensionScheme = normalizedTypes.some((t) => /pension|elderly|old_age|senior_citizen|social_security/.test(t)) ||
    /\b(pension|nsap|social assistance|old age)\b/i.test(scheme.name);

  if (isPensionQuery) {
    if (isPensionScheme) {
      tagMatchScore += 80;
      matchingTagCount++;
      return Math.max(90, 45 + tagMatchScore);
    }
    // Heavy negative penalty for non-pension schemes (skill development, startups, business loans, etc.)
    return -80;
  }

  // Laptop & Digital Device specialized semantic match
  const laptopWords = ['laptop', 'laptops', 'computer', 'computers', 'pc', 'tablet', 'tablets', 'लैपटॉप', 'कंप्यूटर'];
  const isLaptopQuery = laptopWords.some((w) => normP.includes(w));
  if (isLaptopQuery) {
    const isLaptopScheme = /laptop|computer/i.test(scheme.name) ||
      normalizedTypes.some((t) => /laptop|computer|technology/.test(t));
    if (isLaptopScheme) {
      tagMatchScore += 80;
      matchingTagCount++;
      return Math.max(95, 50 + tagMatchScore);
    }
    // General non-laptop schemes receive a penalty when laptop is specifically requested
    tagMatchScore -= 35;
  }

  // Academic Merit & Marks specialized semantic match
  const meritWords = ['merit', 'meritorious', 'marks', 'percentage', 'topper', 'मेधावी', 'प्रतिभाशाली'];
  const isMeritQuery = meritWords.some((w) => normP.includes(w));
  if (isMeritQuery) {
    const isMeritScheme = /merit|meritorious|मेधावी/i.test(scheme.name) || /merit|marks|60%/i.test(scheme.notes || '');
    if (isMeritScheme) {
      tagMatchScore += 35;
      matchingTagCount++;
    }
  }

  // Scholarship specialized semantic match
  const scholarshipWords = ['scholarship', 'scholarships', 'छात्रवृत्ति', 'शिष्यवृत्ती', 'वृत्ति'];
  const isScholarshipQuery = scholarshipWords.some((w) => normP.includes(w));
  if (isScholarshipQuery) {
    const isScholarshipScheme = /scholarship|fellowship|छात्रवृत्ति/i.test(scheme.name) ||
      (scheme.education_level && scheme.education_level !== 'not_applicable') ||
      normalizedTypes.some((t) => /scholarship|fellowship/.test(t));
    if (isScholarshipScheme) {
      tagMatchScore += 65;
      matchingTagCount++;
    } else {
      return -70;
    }
  }

  // PhD / Doctoral / Fellowship specialized semantic match
  const phdWords = ['phd', 'ph.d', 'doctoral', 'doctorate', 'm.phil', 'mphil', 'fellowship', 'research'];
  const isPhdQuery = phdWords.some((w) => normP.includes(w));
  const isFellowshipScheme = normalizedTypes.some((t) => /phd|mphil|fellowship|research/.test(t)) ||
    scheme.education_level === 'doctoral' ||
    (scheme.name.toLowerCase().includes('fellowship') && !scheme.name.toLowerCase().includes('overseas'));

  if (isPhdQuery) {
    if (isFellowshipScheme) {
      tagMatchScore += 75;
      matchingTagCount++;
    } else if (scheme.education_level === 'overseas' && !normP.includes('abroad') && !normP.includes('overseas')) {
      tagMatchScore -= 30;
    }
  }

  // Overseas / Study Abroad semantic match
  const overseasWords = ['abroad', 'overseas', 'foreign', 'international', 'विदेश', 'बाहेर'];
  if (overseasWords.some((w) => normP.includes(w))) {
    if (
      normalizedTypes.includes('overseas') ||
      scheme.education_level === 'overseas' ||
      (scheme.education_levels && scheme.education_levels.includes('overseas'))
    ) {
      tagMatchScore += 55;
      matchingTagCount++;
    }
  }

  // Grant / Interest-free semantic match
  const grantWords = ['grant', 'grants', 'no loan', 'not a loan', 'no repayment', 'non repayable', 'interest free', 'interest-free', 'zero interest', '0%', '0 percent', 'अनुदान', 'बिनव्याजी'];
  if (grantWords.some(w => normP.includes(w))) {
    const isGrant = Number(scheme.interest_rate_min) === 0 || 
                    (scheme.description && /grant|interest-free|0%|no repayment/i.test(scheme.description)) ||
                    (scheme.notes && /grant|interest-free|0%|no repayment/i.test(scheme.notes));
    if (isGrant) {
      tagMatchScore += 85;
      matchingTagCount++;
    } else if (scheme.interest_rate_min != null && Number(scheme.interest_rate_min) > 0) {
      tagMatchScore -= 50;
    }
  }

  // Higher education semantic match
  if (normP.includes('higher education') || normP.includes('higher_education') || normP.includes('उच्च शिक्षा')) {
    if (
      normalizedTypes.includes('higher_education') ||
      scheme.education_levels?.includes('higher_education') ||
      scheme.education_level === 'undergraduate' ||
      scheme.education_level === 'overseas' ||
      scheme.education_level === 'doctoral'
    ) {
      tagMatchScore += 45;
      matchingTagCount++;
    }
  }

  // Multilingual & cross-domain sector clusters
  const sanitationWords = ['waste', 'recycling', 'sanitation', 'garbage', 'sewage', 'toilet', 'scavenger', 'cleaning', 'safai', 'सफाई', 'कचरा', 'शौचालय', 'स्वच्छता'];
  const greenWords = ['green', 'electric', 'rickshaw', 'solar', 'biogas', 'polyhouse', 'organic', 'eco', 'renewable', 'ev', 'ई-रिक्शा', 'सौर', 'पर्यावरण'];
  const artisanWords = ['artisan', 'handicraft', 'weaving', 'craft', 'pottery', 'woodwork', 'sculpture', 'textile', 'carpet', 'embroidery', 'शिल्पकार', 'बुनकर', 'हस्तकला', 'हस्तशिल्प'];
  const businessWords = ['tailoring', 'shop', 'grocery', 'kirana', 'trade', 'enterprise', 'business', 'store', 'restaurant', 'hotel', 'manufacturing', 'repair', 'auto', 'rickshaw', 'सिलाई', 'दुकान', 'व्यापार', 'व्यवसाय', 'शिलाई', 'उद्योग'];
  const livelihoodWords = [
    'work', 'working', 'job', 'livelihood', 'self employment', 'self-employment', 'swarojgar',
    'income generation', 'income generating', 'small business', 'enterprise', 'start work', 'money for work',
    'funds for work', 'kaam', 'kam', 'काम', 'धंधा', 'कामधंधा', 'आजीविका', 'स्वरोजगार', 'रोजगार'
  ];
  const agriWords = ['agriculture', 'farming', 'farm', 'agro', 'poultry', 'animal', 'cattle', 'horticulture', 'dairy', 'crop', 'fisheries', 'खेती', 'कृषि', 'डेयरी', 'पशुपालन', 'शेतकरी'];
  const techWords = ['saas', 'software', 'tech', 'it', 'b2b', 'supplier', 'suppliers', 'supply', 'logistics', 'services', 'agency', 'wholesale', 'सॉफ्टवेयर', 'तकनीक', 'सप्लायर'];
  const educationWords = [
    'education', 'study', 'college', 'school', 'engineering', 'mbbs', 'degree', 'student',
    'scholarship', 'university', 'course', 'vocational', 'tuition', 'btech', 'mtech', 'mba',
    'शिक्षा', 'पढ़ाई', 'सिक्षा', 'शिक्षण', 'इंजीनियरिंग', 'कोर्स',
    'ಶಿಕ್ಷಣ', 'ಸಾಹಿತ್ಯ', 'ಅಧ್ಯಯನ', 'ಕಾಲೇಜು', 'ವಿದ್ಯಾಭ್ಯಾಸ', 'ಎಂಜಿನಿಯರಿಂಗ್',
    'શિક્ષણ', 'கல்வி', 'విద్య', 'വിദ്യാഭ്യാസം', 'ଶିକ୍ଷା', 'ਸਿੱਖਿਆ'
  ];

  const hasBroadEntrepreneurshipTags =
    normalizedTypes.some((t) => /self_employment|small_trade|services|manufacturing/.test(t)) &&
    !normalizedTypes.some((t) => /seed_production|leather_craft|clinic_setup|auto_rickshaw/.test(t));

  const isMultiPurposeConcessional =
    (scheme.category === 'micro_finance' && !/svanidhi/.test(scheme.name.toLowerCase())) ||
    /mcf|micro credit|term loan|udyam nidhi|swarojgar|stand-up india|stand up india|finance and development|rscfdc|kscdc|ksfdc|tadco/i.test(scheme.name) ||
    (scheme.category === 'entrepreneurship' && hasBroadEntrepreneurshipTags);

  const isSanitationScheme = normalizedTypes.some((t) => /sanitation|waste|sewage|toilet|clean|scavenger/.test(t));
  const isGreenScheme = normalizedTypes.some((t) => /green|solar|renewable|electric|rickshaw|biogas|eco/.test(t));
  const isArtisanScheme = normalizedTypes.some((t) => /artisan|handicraft|weaving|craft|pottery|leather|wood_work|textile|embroidery/.test(t));
  const isAgriScheme = normalizedTypes.some((t) => /agri|farm|dairy|poultry|crop|livestock|fisher|cattle|animal/.test(t));
  const isEducationScheme = scheme.category === 'education_loan' || scheme.education_required || normalizedTypes.some((t) => /education|course|degree|school|college|scholarship|study/.test(t));

  const matchWords = (words: string[]) => words.some(w => /^[a-z0-9]+$/i.test(w) ? new RegExp(`\\b${w}\\b`, 'i').test(normP) : normP.includes(w));

  if (matchWords(educationWords)) {
    if (isEducationScheme) return Math.max(50, tagMatchScore);
    return -15;
  }
  if (matchWords(sanitationWords)) {
    if (isSanitationScheme) return Math.max(50, tagMatchScore);
    return 5;
  }
  if (matchWords(greenWords)) {
    if (isGreenScheme) return Math.max(50, tagMatchScore);
    return 10;
  }
  if (matchWords(artisanWords)) {
    if (isArtisanScheme) return Math.max(50, tagMatchScore);
    return 10;
  }
  if (matchWords(agriWords)) {
    if (isAgriScheme) {
      const getAgriSubTypes = (text: string): Set<string> => {
        const normText = text.toLowerCase();
        const types = new Set<string>();
        if (/\b(crop|cultivation|seed|seeds|farming|farm|kisan|krishi|fasal|शेतकरी|खेती|पीक)\b/i.test(normText)) types.add('crop');
        if (/\b(livestock|dairy|cattle|cow|cows|buffalo|poultry|goat|sheep|piggery|fodder|animal|milk|पशुपालन|दूध|मुर्गी)\b/i.test(normText)) types.add('livestock');
        if (/\b(fish|fisheries|aquaculture|मछली)\b/i.test(normText)) types.add('fisheries');
        if (/\b(horticulture|poly\s*house|polyhouse|organic|vermicompost|vegetable|fruit|बागवानी)\b/i.test(normText)) types.add('horticulture');
        if (/\b(cold\s*storage|warehouse|processing|logistics|post-harvest|post\s*harvest|भंडारण)\b/i.test(normText)) types.add('infrastructure');
        if (/\b(tractor|drip|sprinkler|irrigation|equipment|machinery|ट्रैक्टर|सिंचाई)\b/i.test(normText)) types.add('equipment');
        if (/\b(welfare|insurance|pension|kalia|kmy)\b/i.test(normText)) types.add('welfare');
        return types;
      };

      const querySubTypes = getAgriSubTypes(normP);
      if (querySubTypes.size === 0) {
        querySubTypes.add('crop');
        querySubTypes.add('equipment');
      }

      const schemeText = (scheme.name + " " + normalizedTypes.join(" ") + " " + (scheme.description||"") + " " + (scheme.notes||"")).toLowerCase();
      const schemeSubTypes = getAgriSubTypes(schemeText);
      if (schemeSubTypes.size === 0 && /\b(agriculture|agri)\b/i.test(schemeText)) {
        schemeSubTypes.add('crop');
      }

      let subTypeMatch = false;
      for (const qs of querySubTypes) {
        if (schemeSubTypes.has(qs)) {
          subTypeMatch = true;
          break;
        }
      }

      if (!subTypeMatch && schemeSubTypes.size > 0) {
         return -75;
      }

      const isDedicatedAgri = /kisan|krishi|fasal|agri/i.test(scheme.name) || 
        (normalizedTypes.filter(t => /agri|farm|dairy|poultry|crop|livestock|fisher|cattle|animal/.test(t)).length / Math.max(1, normalizedTypes.length)) > 0.4;
      if (isDedicatedAgri) return Math.min(95, Math.max(85, tagMatchScore + 35));
      return Math.max(50, tagMatchScore);
    }
    if (scheme.category === 'entrepreneurship' || normalizedTypes.includes('manufacturing')) return 30;
    return 5;
  }
  if (matchWords(techWords)) {
    if (normalizedTypes.some((t) => /services|technology|software|startup|innovation/.test(t))) return 40;
    return 5;
  }
  if (matchWords(livelihoodWords)) {
    const isLivelihoodScheme =
      isMultiPurposeConcessional ||
      normalizedTypes.some((t) => /self_employment|small_trade|micro_finance|business|service|livelihood|transport/.test(t));
    if (isLivelihoodScheme) {
      return Math.min(95, Math.max(55, 40 + tagMatchScore));
    }
    if (isEducationScheme || scheme.category === 'skill_development' || scheme.category === 'welfare') {
      return -40;
    }
    return 20;
  }
  if (matchWords(businessWords)) {
    if (normP.includes('सिलाई') || normP.includes('tailoring') || normP.includes('शिलाई') || normP.includes('sewing')) {
      if (normalizedTypes.some((t) => t.includes('tailoring') || t.includes('sewing'))) return 85;
    }

    // Retail shop matching (grocery, kirana, stationery, bookstore, store, general store)
    const isRetailShopQuery = /\b(grocery|kirana|shop|store|retail|dukaan|stationery|bookstore|books|दुकान|व्यापार)\b/i.test(normP);
    if (isRetailShopQuery) {
      const isFixedShop = !/\b(street|vendor|hawker|cart|thela|rehri|footpath|mobile)\b/i.test(normP);
      // PM SVANidhi (street vendor) fixed shop penalty: cap at 20 so it cannot outrank or tie with MCF / MSY / Term Loan
      if ((scheme.id === 45 || /svanidhi/i.test(scheme.name)) && isFixedShop) {
        return 20;
      }
      if (normalizedTypes.some((t) => /petty_shop|small_trade|retail|shop|store/.test(t))) {
        return 85;
      }
      if (normalizedTypes.includes('self_employment') || isMultiPurposeConcessional) {
        return 65;
      }
      const isDedicatedAgri =
        /kisan|krishi|fasal|seed/i.test(scheme.name) ||
        ((normalizedTypes.filter(t => /agri|farm|dairy|poultry|crop|livestock|fisher|cattle|animal/.test(t)).length / Math.max(1, normalizedTypes.length)) > 0.4 &&
         !normalizedTypes.some(t => /self_employment|small_trade|services/.test(t)));
      if (isDedicatedAgri) return -50;
    }

    if (matchingTagCount > 0) return Math.min(95, 35 + tagMatchScore);
    const isDedicatedAgri =
      /kisan|krishi|fasal|seed/i.test(scheme.name) ||
      ((normalizedTypes.filter(t => /agri|farm|dairy|poultry|crop|livestock|fisher|cattle|animal/.test(t)).length / Math.max(1, normalizedTypes.length)) > 0.4 &&
       !normalizedTypes.some(t => /self_employment|small_trade|services/.test(t)));
    if (isDedicatedAgri) return -50;
    if (isSanitationScheme || isArtisanScheme) return -30;
    if (isEducationScheme || scheme.category === 'skill_development' || scheme.category === 'welfare') return -50;
    if (isMultiPurposeConcessional) return 40;
    return 15;
  }

  if (matchingTagCount > 0) {
    return Math.min(95, 30 + tagMatchScore);
  }

  // Only penalize dedicated narrow schemes when a non-matching query is run; never penalize multi-purpose schemes
  if (!isMultiPurposeConcessional) {
    const isDedicatedAgri = /kisan|krishi|fasal/i.test(scheme.name) || (normalizedTypes.filter(t => /agri|farm|dairy|poultry|crop|livestock|fisher|cattle|animal/.test(t)).length / Math.max(1, normalizedTypes.length)) > 0.4;
    const isDedicatedSanitation = (normalizedTypes.filter(t => /sanitation|waste|sewage|toilet|clean|scavenger/.test(t)).length / Math.max(1, normalizedTypes.length)) > 0.4;
    const isDedicatedArtisan = (normalizedTypes.filter(t => /artisan|handicraft|weaving|craft|pottery|leather|wood_work|textile|embroidery/.test(t)).length / Math.max(1, normalizedTypes.length)) > 0.4;

    if (isDedicatedSanitation || isDedicatedArtisan || isDedicatedAgri) return -30;
    if (isGreenScheme) return -15;
  }

  return 15;
}

function incomeScore(scheme: Scheme, incomeRs: number | undefined): { score: number; warning?: string } {
  if (!incomeRs) {
    // When income is unspecified, rank based on accessibility/breadth of eligibility cap
    if (scheme.max_income_lakh == null || Number(scheme.max_income_lakh) === 0) {
      return { score: 15 }; // Universal / merit-based (no income barrier)
    }
    const cap = Number(scheme.max_income_lakh);
    if (cap >= 6.0) return { score: 12 }; // Broad income ceiling (e.g. ₹8L Top Class)
    if (cap >= 2.5) return { score: 10 }; // Standard moderate ceiling (e.g. ₹2.5L Post-Matric)
    return { score: 7 }; // Strict low income ceiling (e.g. ₹1L EBC)
  }
  const incomeLakh = incomeRs / 100000;

  if (incomeLakh > 5.0 && scheme.level === 'Central') {
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

  if (schemeMax === 0 && (scheme.category === 'skill_development' || scheme.category === 'welfare')) {
    return {
      score: -100,
      warning: `${scheme.name} is a non-loan assistance programme (₹0 loan ceiling)`,
    };
  }

  if (schemeMax > 0 && amountLakh > schemeMax) {
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
  const isEduStage = isEducationStageScheme(scheme);
  if (isEducation && isEduStage) return 50;
  if (isEducation && !isEduStage) return 0;
  if (!isEducation && isEduStage) return -150;
  return 5;
}

function genderScore(scheme: Scheme, gender: string | undefined): { score: number; warning?: string; disqualified?: boolean } {
  const isWomenOnly = scheme.gender_eligibility === 'women_only' || scheme.name.toLowerCase().includes('mahila');
  if (isWomenOnly) {
    if (gender === 'female') {
      return { score: 25 };
    }
    if (gender && gender !== 'female') {
      return { score: -300, warning: 'This scheme is exclusively for women applicants', disqualified: true };
    }
    // Unknown is not a mismatch. A missing fact (gender) must never disqualify.
    return { score: 0, warning: 'This scheme is designated for women applicants' };
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

export function computeMatchPercentage(rawScore: number, tier: SchemeTier): number {
  if (tier === 'HARD_DISQUALIFIED') {
    return Math.max(10, Math.min(38, Math.round(rawScore <= 0 ? 15 : 20 + (rawScore / 40) * 15)));
  }
  const clamped = Math.max(50, Math.min(320, rawScore));
  const normalized = 55 + Math.round(((clamped - 50) / 270) * 43);
  return Math.min(98, Math.max(50, normalized));
}

export function scoreSchemes(schemes: Scheme[], entities: UserEntities, categoryHint?: string): ScoredScheme[] {
  const pNorm = (entities.purpose || '').toLowerCase();
  const intent = extractUserProfileAndNeed(entities.purpose, entities);
  const detectedLevel = intent.profile.current_stage || normalizeEducationLevel(entities.education_level);

  // Education query intent applies ONLY when the need is to fund studying, or when the user is a current student
  const isEducation = Boolean(
    intent.need.is_education_funding ||
    intent.profile.is_current_student ||
    (categoryHint === 'education_loan' && !intent.need.is_clinic_or_doctor_setup)
  );

  const isHousingQuery = intent.need.is_housing_need || categoryHint === 'housing';
  const isPhdQuery = intent.need.is_fellowship_need;

  const isHealthInsuranceQuery = intent.need.is_health_treatment && (pNorm.includes('insurance') || pNorm.includes('bima') || pNorm.includes('cover'));
  const isHealthQuery = intent.need.is_health_treatment;

  const isPensionQuery = intent.need.is_pension_need;
  const isScholarshipQuery = intent.need.is_education_funding && !intent.need.is_clinic_or_doctor_setup;

  const userState = intent.profile.state || resolveUserState(entities);

  const scored = schemes
    .map((scheme): ScoredScheme => {
      let score = 0;
      let tier: SchemeTier = 'ELIGIBLE_SUBOPTIMAL';
      const matchReasons: string[] = [];
      const warnings: string[] = [];

      const normalizedTypes = (scheme.eligible_project_types || []).map((t) => (t || '').toLowerCase().replace(/_/g, ' '));
      const isHousingScheme = normalizedTypes.some((t) => /housing|rural housing|urban housing|affordable housing/.test(t) || /\bawas\b/.test(t)) || (/\b(awas|housing)\b/i.test(scheme.name) && !/chhatrawas/i.test(scheme.name));
      const isFellowship = normalizedTypes.some((t) => /phd|mphil|fellowship|research/.test(t)) ||
        scheme.education_level === 'doctoral' ||
        (scheme.name.toLowerCase().includes('fellowship') && !scheme.name.toLowerCase().includes('overseas'));

      const isHealthInsuranceScheme = normalizedTypes.some((t) => /health_insurance|medical_treatment|hospitalisation|hospitalization/.test(t)) ||
        /\b(ayushman|jan arogya|swasthya bima)\b/i.test(scheme.name);
      const isHealthScheme = isHealthInsuranceScheme ||
        normalizedTypes.some((t) => /health|medical|swasthya|arogya/.test(t)) ||
        /\b(ayushman|arogya|swasthya|jan arogya)\b/i.test(scheme.name);

      const isPensionScheme = normalizedTypes.some((t) => /pension|elderly|old_age|senior_citizen|social_security/.test(t)) ||
        /\b(pension|nsap|social assistance|old age)\b/i.test(scheme.name);

      const isScholarshipScheme = /scholarship|fellowship|छात्रवृत्ति/i.test(scheme.name) ||
        (scheme.education_level && scheme.education_level !== 'not_applicable') ||
        normalizedTypes.some((t) => /scholarship|fellowship/.test(t));

      const isClinicSetupScheme = normalizedTypes.some((t) => /clinic|medical_equipment|doctor/.test(t)) || /clinic|doctor/i.test(scheme.name);

      if (intent.need.is_clinic_or_doctor_setup && isClinicSetupScheme) {
        score += 120;
        matchReasons.push('Specifically designed for private clinic setup and medical equipment acquisition');
      }

      if (isPhdQuery && isFellowship) {
        score += 60;
        matchReasons.push('Purpose-built doctoral research fellowship');
      }

      if (isHousingQuery && isHousingScheme) {
        score += 100;
        matchReasons.push('Purpose-built residential housing scheme');
      }

      if (isHealthInsuranceQuery && isHealthInsuranceScheme) {
        score += 60;
        matchReasons.push('Comprehensive health / medical insurance coverage');
      } else if (isHealthQuery && isHealthScheme) {
        score += 50;
        matchReasons.push('Health and medical assistance scheme');
      }

      if (isPensionQuery && isPensionScheme) {
        score += 100;
        matchReasons.push('Social security pension for elderly/eligible beneficiaries');
      }

      if (isScholarshipQuery && isScholarshipScheme) {
        score += 50;
        matchReasons.push('Educational scholarship support');
      }

      const pScore = purposeMatchScore(scheme, entities.purpose);
      score += pScore;
      if (pScore >= 30) matchReasons.push('Purpose matches this scheme\'s eligible activities');

      const isDirectMatch = pScore >= 100 || (intent.need.is_clinic_or_doctor_setup && isClinicSetupScheme);

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

      // Education level categorical check & scoring: ONLY when user is a current student or need is study funding
      if (detectedLevel && isEducationStageScheme(scheme)) {
        if (schemeSupportsLevel(scheme, detectedLevel)) {
          score += 60;
          const schemeLevelLabel = (scheme.education_level || detectedLevel).replace(/_/g, ' ');
          matchReasons.push(`Specifically matches your requested ${detectedLevel.replace(/_/g, ' ')} education level (${schemeLevelLabel})`);
        } else {
          score -= 80;
          warnings.push(`This scheme is designated for ${scheme.education_level?.replace(/_/g, ' ') || 'other'} stage, not for ${detectedLevel.replace(/_/g, ' ')}.`);
        }
      }

      let { score: gScore, warning: gWarn } = genderScore(scheme, entities.gender);
      if (isDirectMatch && gScore < 0) {
        gScore = 0;
      }
      score += gScore;
      if (gWarn) warnings.push(gWarn);
      else if (entities.gender === 'female' && gScore > 0) matchReasons.push('Exclusive concessional scheme for women entrepreneurs');

      // State relevance bonus
      const isStateExplicit = Boolean(entities.state_only || entities.level === 'State' || /\b(state\s*specific|state\s*level|state\s*government|state\s*only|only\s*state|state\s*scheme|state\s*schemes)\b/i.test(pNorm));
      if (userState && scheme.state && scheme.state.toLowerCase() === userState.toLowerCase()) {
        if (pScore >= 60 || isDirectMatch || isStateExplicit) {
          score += 35;
          matchReasons.push(`Specifically tailored for residents of ${scheme.state}`);
        } else if (pScore >= 35) {
          score += 10;
          matchReasons.push(`State-level scheme for residents of ${scheme.state}`);
        }
        
        const agriWords = ['agriculture', 'farming', 'farm', 'agro', 'poultry', 'animal', 'cattle', 'horticulture', 'dairy', 'crop', 'fisheries', 'खेती', 'कृषि', 'डेयरी', 'पशुपालन', 'शेतकरी'];
        const isAgriQuery = agriWords.some(w => pNorm.includes(w));
        const isAgriScheme = normalizedTypes.some((t) => /agri|farm|dairy|poultry|crop|livestock|fisher|cattle|animal/.test(t)) || /kisan|krishi|fasal/i.test(scheme.name);
        if (isAgriQuery && isAgriScheme && pScore >= 35) {
          score += 100;
        }
      }

      // SC / Social Category preference bonus
      const isScQuery = intent.profile.community === 'SC' || /\b(sc|scheduled\s*caste|dalit)\b/i.test(pNorm);
      if (isScQuery) {
        if (scheme.for_sc || /\bsc\b|scheduled caste/i.test(scheme.name)) {
          score += 25;
          matchReasons.push('Exclusively designated for Scheduled Caste (SC) beneficiaries');
        } else if (/\bebc\b|economically backward/i.test(scheme.name)) {
          score -= 25; // Deduct for EBC scheme when SC is requested
        }
      }

      // Non-loan interest rate treatment
      const isNonLoanOrGrant = scheme.scheme_type === 'scholarship' ||
        scheme.scheme_type === 'grant' ||
        scheme.scheme_type === 'in_kind' ||
        scheme.max_loan_lakh == null ||
        Number(scheme.max_loan_lakh) === 0 ||
        /scholarship|fellowship|laptop/i.test(scheme.name);

      const effectiveRate = scheme.interest_rate_min != null
        ? Number(scheme.interest_rate_min)
        : (isNonLoanOrGrant ? 0 : 6);

      score += Math.max(0, (10 - effectiveRate) * 2);

      // --- TYPE-B INFERRED SIGNAL ADJUSTMENTS (Score penalties/adjustments only, NEVER hard-disqualify) ---
      const narrow = checkNarrowTradeMismatch(scheme, pNorm);
      if (narrow.mismatched) {
        score -= 150;
        if (narrow.reason) warnings.push(narrow.reason);
      }

      if (isHousingQuery && !isHousingScheme) {
        score -= 80;
        warnings.push(`${scheme.name} is a commercial/business/transport scheme, not an eligible housing scheme.`);
      }

      if (isHealthQuery && !isHealthScheme) {
        score -= 80;
        warnings.push(`${scheme.name} is not a health or medical assistance scheme.`);
      }

      if (isPensionQuery && !isPensionScheme) {
        score -= 80;
        warnings.push(`${scheme.name} is not a pension or senior citizen social security scheme.`);
      }

      if (isScholarshipQuery && !isScholarshipScheme) {
        score -= 60;
        warnings.push(`${scheme.name} is a loan or commercial scheme, not an educational student scholarship.`);
      }

      // --- 3-TIER DETERMINISTIC CLASSIFICATION (Type-A Explicit Facts Only) ---
      let disqualificationReason: string | undefined = undefined;
      let disqualificationRecord: DisqualificationRecord | undefined = undefined;

      const loanLakh = intent.profile.loan_amount_rs ? intent.profile.loan_amount_rs / 100000 : null;
      const incomeLakh = intent.profile.family_income_rs ? intent.profile.family_income_rs / 100000 : null;
      const isWomenOnly = scheme.gender_eligibility === 'women_only' || scheme.name.toLowerCase().includes('mahila');
      const schemeMaxLoan = Number(scheme.max_loan_lakh || 0);
      const schemeMaxIncome = Number(scheme.max_income_lakh || 0);
      const isFellowshipOrGrant = scheme.interest_rate_min === 0 || scheme.education_level === 'doctoral' || (scheme.eligible_project_types || []).includes('fellowship') || scheme.scheme_type === 'grant' || scheme.scheme_type === 'scholarship';

      // Rule 1: State mismatch (Type-A explicit state)
      if (scheme.state && scheme.state !== 'Central' && intent.profile.state && intent.profile.is_state_explicit && scheme.state.toLowerCase() !== intent.profile.state.toLowerCase()) {
        tier = 'HARD_DISQUALIFIED';
        disqualificationReason = `This scheme is exclusively for residents of ${scheme.state}.`;
        disqualificationRecord = {
          ruleId: 'RULE_STATE_MISMATCH',
          factUsed: `User State: ${intent.profile.state}, Scheme State: ${scheme.state}`,
          factSource: 'explicit_statement',
          reason: disqualificationReason,
        };
      }
      // Rule 2: State-only explicit request excludes Central schemes (Type-A explicit instruction)
      else if (
        (entities.state_only || entities.level === 'State' || /\b(state\s*specific|state\s*level|state\s*government|state\s*only|only\s*state|state\s*scheme|state\s*schemes)\b/i.test(pNorm)) &&
        (scheme.level === 'Central' || scheme.state === 'Central')
      ) {
        tier = 'HARD_DISQUALIFIED';
        disqualificationReason = 'User explicitly requested state-specific schemes; Central schemes are excluded.';
        disqualificationRecord = {
          ruleId: 'RULE_STATE_ONLY_CENTRAL_EXCLUDED',
          factUsed: 'User requested state-only schemes',
          factSource: 'explicit_statement',
          reason: disqualificationReason,
        };
      }
      // Rule 3: Gender exclusivity (Type-A explicit gender)
      else if (isWomenOnly && intent.profile.gender && intent.profile.gender !== 'female') {
        tier = 'HARD_DISQUALIFIED';
        disqualificationReason = 'This scheme is exclusively reserved for women applicants.';
        disqualificationRecord = {
          ruleId: 'RULE_GENDER_MISMATCH',
          factUsed: `Applicant Gender: ${intent.profile.gender}`,
          factSource: intent.profile.is_gender_explicit ? 'explicit_statement' : 'profile',
          reason: disqualificationReason,
        };
      }
      // Rule 4: Minimum Age limit (Type-A explicit age)
      else if (intent.profile.age != null && scheme.age_min != null && intent.profile.age < scheme.age_min) {
        tier = 'HARD_DISQUALIFIED';
        disqualificationReason = `Applicant age (${intent.profile.age}) is below the minimum entry age of ${scheme.age_min} for this scheme.`;
        disqualificationRecord = {
          ruleId: 'RULE_AGE_MIN_MISMATCH',
          factUsed: `Applicant Age: ${intent.profile.age}, Minimum Allowed: ${scheme.age_min}`,
          factSource: intent.profile.is_age_explicit ? 'explicit_statement' : 'profile',
          reason: disqualificationReason,
        };
      }
      // Rule 5: Maximum Age limit (Type-A explicit age)
      else if (intent.profile.age != null && scheme.age_max != null && intent.profile.age > scheme.age_max) {
        tier = 'HARD_DISQUALIFIED';
        disqualificationReason = `Applicant age (${intent.profile.age}) is above the maximum entry age of ${scheme.age_max} for this scheme.`;
        disqualificationRecord = {
          ruleId: 'RULE_AGE_MAX_MISMATCH',
          factUsed: `Applicant Age: ${intent.profile.age}, Maximum Allowed: ${scheme.age_max}`,
          factSource: intent.profile.is_age_explicit ? 'explicit_statement' : 'profile',
          reason: disqualificationReason,
        };
      }
      // Rule 6: Family income ceiling exceeded (Type-A explicit income)
      else if (incomeLakh != null && schemeMaxIncome > 0 && incomeLakh > schemeMaxIncome) {
        tier = 'HARD_DISQUALIFIED';
        disqualificationReason = `Annual family income (₹${incomeLakh.toFixed(1)}L) exceeds the statutory eligibility cap of ₹${schemeMaxIncome.toFixed(1)}L/yr for this scheme.`;
        disqualificationRecord = {
          ruleId: 'RULE_INCOME_CEILING_EXCEEDED',
          factUsed: `Family Income: ₹${incomeLakh.toFixed(1)}L, Statutory Cap: ₹${schemeMaxIncome.toFixed(1)}L`,
          factSource: intent.profile.is_income_explicit ? 'explicit_statement' : 'profile',
          reason: disqualificationReason,
        };
      }
      // Rule 7: Loan ceiling exceeded (Type-A explicit loan requirement)
      else if (loanLakh != null && schemeMaxLoan > 0 && loanLakh > schemeMaxLoan && !isFellowshipOrGrant) {
        tier = 'HARD_DISQUALIFIED';
        disqualificationReason = `Requested loan amount (₹${loanLakh.toFixed(1)}L) exceeds the maximum statutory ceiling of ₹${schemeMaxLoan.toFixed(1)}L for ${scheme.name}.`;
        disqualificationRecord = {
          ruleId: 'RULE_LOAN_CEILING_EXCEEDED',
          factUsed: `Requested Loan: ₹${loanLakh.toFixed(1)}L, Scheme Ceiling: ₹${schemeMaxLoan.toFixed(1)}L`,
          factSource: intent.profile.is_loan_explicit ? 'explicit_statement' : 'profile',
          reason: disqualificationReason,
        };
      }
      // Rule 8: Non-loan scheme when loan requested (Type-A explicit loan requirement)
      else if (loanLakh != null && loanLakh > 0 && schemeMaxLoan === 0 && !isFellowshipOrGrant && (scheme.category === 'skill_development' || scheme.category === 'welfare')) {
        tier = 'HARD_DISQUALIFIED';
        disqualificationReason = `${scheme.name} is a non-loan skill training or social welfare programme with no loan facility (₹0 cap). It cannot provide the requested loan of ₹${loanLakh.toFixed(1)}L.`;
        disqualificationRecord = {
          ruleId: 'RULE_NON_LOAN_FACILITY',
          factUsed: `Requested Loan: ₹${loanLakh.toFixed(1)}L, Scheme Facility: ₹0`,
          factSource: intent.profile.is_loan_explicit ? 'explicit_statement' : 'profile',
          reason: disqualificationReason,
        };
      }
      // Rule 9: Explicit current-education stage mismatch (Type-A fact: only when user states they are currently a student AND need is study funding)
      else if (
        intent.profile.is_current_student &&
        intent.profile.current_stage &&
        intent.need.is_education_funding &&
        isEducationStageScheme(scheme) &&
        !schemeSupportsLevel(scheme, intent.profile.current_stage)
      ) {
        tier = 'HARD_DISQUALIFIED';
        disqualificationReason = `Education level mismatch: This scheme is for ${scheme.education_level?.replace('_', ' ') || 'other'} stage, not for current ${intent.profile.current_stage.replace('_', ' ')} studies.`;
        disqualificationRecord = {
          ruleId: 'RULE_CURRENT_STAGE_MISMATCH',
          factUsed: `Current Enrolled Stage: ${intent.profile.current_stage}, Scheme Stage: ${scheme.education_level || 'other'}`,
          factSource: 'explicit_statement',
          reason: disqualificationReason,
        };
      }
      else {
        // Qualified schemes: Segment into OPTIMAL vs SUBOPTIMAL
        const hasSpecificPurpose = Boolean(
          entities.purpose &&
          entities.purpose.trim().length > 3 &&
          !/^(loan|schemes?|business|start\s*a?\s*business|any|best|help|funds?|government\s*schemes?|yojana|work|money\s*for\s*work|general\s*work)$/i.test(entities.purpose.trim())
        );

        const isLivelihoodScheme =
          scheme.category === 'micro_finance' ||
          scheme.category === 'entrepreneurship' ||
          /mcf|micro credit|term loan|udyam nidhi|swarojgar|finance and development|rscfdc/i.test(scheme.name);

        const hasGenuinePurposeMatch = pScore >= 35 || isDirectMatch || isHealthScheme || isPensionScheme || isScholarshipScheme || isHousingScheme || isFellowship || isLivelihoodScheme || (intent.need.is_clinic_or_doctor_setup && isClinicSetupScheme);

        if (score >= 70 && (!hasSpecificPurpose || hasGenuinePurposeMatch)) {
          tier = 'ELIGIBLE_OPTIMAL';
        } else {
          tier = 'ELIGIBLE_SUBOPTIMAL';
        }
      }

      const isFixedShop = /\b(grocery|kirana|shop|store|retail|dukaan|stationery|bookstore|books)\b/i.test(pNorm) &&
        !/\b(street|vendor|hawker|cart|thela|rehri|footpath|mobile)\b/i.test(pNorm);
      if (isFixedShop && (scheme.id === 45 || /svanidhi/i.test(scheme.name))) {
        warnings.push('PM SVANidhi is primarily designed for informal street vendors / mobile carts (₹50K limit) rather than fixed commercial retail shops.');
      }

      if (tier === 'HARD_DISQUALIFIED') {
        if (disqualificationReason && !warnings.includes(disqualificationReason)) {
          warnings.unshift(disqualificationReason);
        }
        if (!isDirectMatch && score > 40) {
          score = 40;
        }
      }

      const match_percentage = computeMatchPercentage(score, tier);
      return { ...scheme, score, match_percentage, tier, matchReasons, warnings, disqualificationReason, disqualificationRecord };
    })
    .filter((s) => s.score > -30)
    .sort((a, b) => {
      // Prioritize by tier first: OPTIMAL (1) > SUBOPTIMAL (2) > HARD_DISQUALIFIED (3)
      const tierRank = (t: SchemeTier) => (t === 'ELIGIBLE_OPTIMAL' ? 1 : t === 'ELIGIBLE_SUBOPTIMAL' ? 2 : 3);
      const rankDiff = tierRank(a.tier) - tierRank(b.tier);
      if (rankDiff !== 0) return rankDiff;
      if (b.score !== a.score) return b.score - a.score;

      // Tiebreaker 1: State preference (State-specific matching user's state prioritized over general Central)
      if (userState) {
        const aIsState = a.state && a.state.toLowerCase() === userState.toLowerCase();
        const bIsState = b.state && b.state.toLowerCase() === userState.toLowerCase();
        if (aIsState && !bIsState) return -1;
        if (!aIsState && bIsState) return 1;
      }

      // Tiebreaker 2: Lower minimum interest rate
      const rateA = a.interest_rate_min != null ? Number(a.interest_rate_min) : 999;
      const rateB = b.interest_rate_min != null ? Number(b.interest_rate_min) : 999;
      if (rateA !== rateB) return rateA - rateB;

      // Tiebreaker 3: Higher maximum loan limit
      const loanA = a.max_loan_lakh != null ? Number(a.max_loan_lakh) : 0;
      const loanB = b.max_loan_lakh != null ? Number(b.max_loan_lakh) : 0;
      if (loanA !== loanB) return loanB - loanA;

      // Tiebreaker 4: Stable ID
      return a.id - b.id;
    });

  return scored;
}

export async function recommendSchemes(entities: UserEntities, categoryHint?: string, limit: number = 3, stateOnly?: boolean): Promise<ScoredScheme[]> {
  const pNorm = normalizeSchemeText(entities.purpose || '');
  const isStateOnly = Boolean(
    stateOnly ||
    entities.state_only ||
    entities.level === 'State' ||
    /\b(state\s*specific|state\s*level|state\s*government|state\s*only|only\s*state|state\s*scheme|state\s*schemes)\b/i.test(pNorm) ||
    /राज्य\s*स्तरीय|राज्य\s*सरकार|केवळ\s*राज्य|फक्त\s*राज्य|રાજ્ય\s*સ્તરીય/i.test(pNorm)
  );
  const userState = resolveUserState(entities);
  console.log('[SCHEME_SERVICE] recommendSchemes called:', JSON.stringify({ categoryHint, userState, isStateOnly, purpose: entities.purpose, loan_amount_rs: entities.loan_amount_rs, gender: entities.gender, family_income_rs: entities.family_income_rs }));

  let all = await fetchActiveSchemes(categoryHint, userState, isStateOnly);
  console.log(`[DATABASE] fetchActiveSchemes(${categoryHint || 'all'}, ${userState || 'any'}, stateOnly=${isStateOnly}) returned ${all.length} schemes`);

  if (all.length === 0 && categoryHint) {
    console.log('[DATABASE] Category filter returned 0 results, falling back to all active schemes for state');
    all = await fetchActiveSchemes(undefined, userState, isStateOnly);
  }

  const scored = scoreSchemes(all, { ...entities, state_only: isStateOnly, level: isStateOnly ? 'State' : entities.level }, categoryHint);
  console.log(`[SCHEME_SERVICE] scoreSchemes returned ${scored.length} scored schemes:`, scored.slice(0, 5).map(s => `${s.name}(score=${s.score},tier=${s.tier},state=${s.state})`).join(', '));

  // Log disqualification records for top 5 candidates by purpose relevance
  const top5ByRelevance = [...scored]
    .sort((a, b) => purposeMatchScore(b, entities.purpose) - purposeMatchScore(a, entities.purpose))
    .slice(0, 5);

  for (const s of top5ByRelevance) {
    if (s.tier === 'HARD_DISQUALIFIED' && s.disqualificationRecord) {
      console.log(`[SCHEME_SERVICE] Top candidate "${s.name}" disqualified by rule=${s.disqualificationRecord.ruleId} fact="${s.disqualificationRecord.factUsed}" source=${s.disqualificationRecord.factSource}: ${s.disqualificationRecord.reason}`);
    }
  }

  // Log warning if the highest raw scoring scheme was hard disqualified
  const highestScoring = [...scored].sort((a, b) => b.score - a.score)[0];
  if (highestScoring && highestScoring.tier === 'HARD_DISQUALIFIED') {
    console.warn(`[SCHEME_SERVICE] WARNING: Highest-scoring scheme "${highestScoring.name}" (score=${highestScoring.score}) was HARD_DISQUALIFIED! Rule: ${highestScoring.disqualificationRecord?.ruleId}, Reason: ${highestScoring.disqualificationRecord?.reason}`);
  }

  if (scored.length === 0) {
    return [];
  }

  const eligible = scored.filter((s) => s.tier !== 'HARD_DISQUALIFIED');
  if (eligible.length === 0) {
    // Safety Net: check if any schemes cleared the purpose relevance threshold (purposeMatchScore >= 30)
    const relevantCandidates = scored
      .filter((s) => purposeMatchScore(s, entities.purpose) >= 30)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    if (relevantCandidates.length > 0) {
      console.log(`[SCHEME_SERVICE] Safety net triggered: 0 eligible schemes, but ${relevantCandidates.length} relevant candidate(s) found. Generating clarifying question.`);
      const topCand = relevantCandidates[0];
      let clarifyingQuestion = '';

      if (topCand.disqualificationRecord?.ruleId === 'RULE_CURRENT_STAGE_MISMATCH') {
        clarifyingQuestion = 'Do you want funding for your studies, or to set up a professional practice or business?';
      } else if (topCand.disqualificationRecord?.ruleId === 'RULE_STATE_MISMATCH') {
        clarifyingQuestion = `Are you located in or seeking assistance specifically in ${topCand.state || 'your current state'}?`;
      } else if (topCand.disqualificationRecord?.ruleId === 'RULE_LOAN_CEILING_EXCEEDED') {
        clarifyingQuestion = `Your requested loan amount exceeds the ceiling of ₹${topCand.max_loan_lakh} Lakhs for ${topCand.name}. Would you consider a loan within this limit?`;
      } else if (topCand.disqualificationRecord?.ruleId === 'RULE_GENDER_MISMATCH') {
        clarifyingQuestion = `This scheme is reserved for women applicants. Would you like to explore general schemes open to all genders?`;
      } else if (topCand.disqualificationRecord?.ruleId === 'RULE_INCOME_CEILING_EXCEEDED') {
        clarifyingQuestion = `This scheme has an annual family income limit of ₹${topCand.max_income_lakh} Lakhs. Could you confirm your annual family income?`;
      } else {
        clarifyingQuestion = `Could you clarify your specific requirements or eligibility details so we can find matching schemes?`;
      }

      return relevantCandidates.map((c) => ({
        ...c,
        clarifyingQuestion,
      }));
    }

    return [];
  }

  // 1. Segment into OPTIMAL vs SUBOPTIMAL
  const optimal = eligible.filter((s) => s.tier === 'ELIGIBLE_OPTIMAL');

  // Rule: If optimal matches exist, return ONLY optimal matches (up to limit). NEVER pad with suboptimal!
  if (optimal.length > 0) {
    return optimal.slice(0, limit);
  }

  // 2. If NO optimal matches exist, check if any suboptimal matches clear the genuine relevance threshold.
  const worthySuboptimal = eligible.filter((s) => {
    if (s.score < 50) return false;
    const hasPurposeMatch = s.matchReasons.some((r) =>
      r.includes('Purpose') ||
      r.includes('matches') ||
      r.includes('education') ||
      r.includes('fellowship') ||
      r.includes('Designed for') ||
      r.includes('coverage') ||
      r.includes('pension') ||
      r.includes('scholarship') ||
      r.includes('tailored for residents') ||
      r.includes('State-level scheme') ||
      r.includes('Specifically tailored') ||
      r.includes('Scheduled Caste')
    );
    return hasPurposeMatch;
  });

  if (worthySuboptimal.length > 0) {
    return worthySuboptimal.slice(0, limit);
  }

  return [];
}
