import { fetchActiveSchemes, scoreSchemes, Scheme, ScoredScheme } from '../services/SchemeEngine';

export interface AuditFailure {
  schemeId: number;
  schemeName: string;
  queryType: 'positive_1' | 'positive_2' | 'positive_3' | 'negative_control';
  query: string;
  state?: string;
  rank?: number;
  score?: number;
  tier?: string;
  ruleViolated?: string;
  reason?: string;
}

export function buildSyntheticPersona(scheme: Scheme, tagIndex: number = 0): {
  purpose: string;
  state?: string;
  gender?: string;
  age?: number;
  family_income_rs?: number;
  loan_amount_rs?: number;
} {
  const tags = scheme.eligible_project_types || [];
  const primaryTag = tags[tagIndex % Math.max(1, tags.length)] || scheme.category || 'business';
  const cleanTag = primaryTag.replace(/_/g, ' ');

  // Determine state
  const state = scheme.state && scheme.state !== 'Central' ? scheme.state : undefined;

  // Determine gender
  let gender: string | undefined = undefined;
  if (scheme.gender_eligibility === 'women_only' || /mahila|women|matru/i.test(scheme.name)) {
    gender = 'female';
  }

  // Determine age
  let age: number | undefined = undefined;
  if (scheme.age_min && scheme.age_max) {
    age = Math.round((scheme.age_min + scheme.age_max) / 2);
  } else if (scheme.age_min) {
    age = scheme.age_min + 5;
  } else if (scheme.age_max) {
    age = Math.max(18, scheme.age_max - 5);
  } else if (/pension|elderly|old_age|senior/i.test(scheme.name + ' ' + tags.join(' '))) {
    age = 65;
  }

  // Determine income
  let family_income_rs: number | undefined = undefined;
  if (scheme.max_income_lakh && Number(scheme.max_income_lakh) > 0) {
    family_income_rs = Math.round((Number(scheme.max_income_lakh) * 0.6) * 100000);
  }

  // Determine loan amount
  let loan_amount_rs: number | undefined = undefined;
  if (scheme.max_loan_lakh && Number(scheme.max_loan_lakh) > 0) {
    loan_amount_rs = Math.round((Number(scheme.max_loan_lakh) * 0.4) * 100000);
  }

  // Build query purpose text incorporating profession / group context if applicable
  let purpose = `I want financial support for ${cleanTag}`;

  if (/doctor|medical|clinic/i.test(scheme.name + ' ' + (scheme.target_beneficiary || ''))) {
    if (tagIndex === 0) purpose = `I am an SC medical graduate and want to open a clinic`;
    else if (tagIndex === 1) purpose = `I am a doctor looking for loan to purchase medical equipment`;
    else purpose = `financial assistance for clinic setup and medical practice`;
  } else if (/leather|charmakar/i.test(scheme.name + ' ' + tags.join(' '))) {
    if (tagIndex === 0) purpose = `I am a leather artisan wanting to expand my footwear workshop`;
    else if (tagIndex === 1) purpose = `loan for leather craft and shoe making business`;
    else purpose = `financial assistance for Charmakar community footwear unit`;
  } else if (/auto_rickshaw|rickshaw/i.test(tags.join(' '))) {
    if (tagIndex === 0) purpose = `loan to purchase an auto-rickshaw for passenger transport`;
    else if (tagIndex === 1) purpose = `financial help to buy a passenger auto rickshaw`;
    else purpose = `commercial vehicle loan for three wheeler passenger auto`;
  } else if (/safai|sanitation|scavenger/i.test(scheme.name + ' ' + (scheme.target_beneficiary || ''))) {
    if (tagIndex === 0) purpose = `sanitation worker looking for equipment loan`;
    else if (tagIndex === 1) purpose = `financial assistance for mechanized cleaning equipment`;
    else purpose = `loan for sanitation services and waste cleaning work`;
  } else if (/seed/i.test(scheme.name)) {
    if (tagIndex === 0) purpose = `financial assistance for foundation seed production`;
    else if (tagIndex === 1) purpose = `subsidy for quality certified seed cultivation`;
    else purpose = `seed production farm loan`;
  } else if (/laptop/i.test(scheme.name)) {
    if (tagIndex === 0) purpose = `free laptop scheme for meritorious student`;
    else if (tagIndex === 1) purpose = `digital computer assistance for merit student`;
    else purpose = `laptop for student who scored good marks`;
  } else if (/fellowship|doctoral|phd/i.test(scheme.name + ' ' + tags.join(' '))) {
    if (tagIndex === 0) purpose = `I am pursuing PhD research and need fellowship support`;
    else if (tagIndex === 1) purpose = `fellowship for doctoral studies in university`;
    else purpose = `research fellowship for SC MPhil/PhD scholar`;
  } else if (/overseas/i.test(scheme.name + ' ' + (scheme.education_level || ''))) {
    if (tagIndex === 0) purpose = `scholarship for overseas higher education studies`;
    else if (tagIndex === 1) purpose = `financial assistance for studying masters abroad`;
    else purpose = `fellowship support for overseas doctoral studies`;
  } else if (/pre.?matric/i.test(scheme.name + ' ' + (scheme.education_level || ''))) {
    if (tagIndex === 0) purpose = `pre-matric scholarship for school student education`;
    else if (tagIndex === 1) purpose = `financial assistance for school student fees`;
    else purpose = `scholarship support for school student in standard 9`;
  } else if (/scholarship|shishyavrutti/i.test(scheme.name)) {
    if (tagIndex === 0) purpose = `scholarship for student education fees`;
    else if (tagIndex === 1) purpose = `financial assistance for college tuition fees`;
    else purpose = `scholarship support for higher education`;
  } else if (/pension/i.test(scheme.name)) {
    if (tagIndex === 0) purpose = `old age pension for senior citizens`;
    else if (tagIndex === 1) purpose = `social security pension support`;
    else purpose = `monthly pension for elderly`;
  } else if (/awas|housing/i.test(scheme.name)) {
    if (tagIndex === 0) purpose = `financial assistance to construct a residential house`;
    else if (tagIndex === 1) purpose = `housing loan subsidy for pucca home`;
    else purpose = `affordable housing scheme for family home`;
  } else if (/cancer/i.test(scheme.name)) {
    if (tagIndex === 0) purpose = `financial assistance for cancer patient medical treatment`;
    else if (tagIndex === 1) purpose = `grant for cancer and malignant disease treatment`;
    else purpose = `medical aid for cancer patient`;
  } else if (/health|swasthya|arogya|ayushman/i.test(scheme.name)) {
    if (tagIndex === 0) purpose = `government health insurance for hospitalization`;
    else if (tagIndex === 1) purpose = `medical health cover for family`;
    else purpose = `health insurance scheme for medical treatment`;
  } else if (/tailor/i.test(cleanTag)) {
    if (tagIndex === 0) purpose = `loan to start a tailoring and boutique shop`;
    else if (tagIndex === 1) purpose = `financial help for buying sewing machines`;
    else purpose = `tailoring business loan`;
  } else {
    const isEdu = scheme.category === 'education_loan' || scheme.scheme_type === 'scholarship';
    if (tagIndex === 0) purpose = isEdu ? `financial assistance for ${cleanTag} course` : `I want a loan to start ${cleanTag}`;
    else if (tagIndex === 1) purpose = `financial assistance for ${cleanTag}`;
    else purpose = isEdu ? `subsidy and scholarship support for ${cleanTag} studies` : `subsidy and loan support for ${cleanTag} enterprise`;
  }

  if (state && !purpose.toLowerCase().includes(state.toLowerCase())) {
    purpose += ` in ${state}`;
  }

  return { purpose, state, gender, age, family_income_rs, loan_amount_rs };
}

export function buildNegativePersona(scheme: Scheme): {
  purpose: string;
  state?: string;
  gender?: string;
  family_income_rs?: number;
} {
  const state = scheme.state && scheme.state !== 'Central' ? scheme.state : undefined;
  const tags = (scheme.eligible_project_types || []).join(' ').toLowerCase();

  let negPurpose = 'purchase a heavy tractor for agriculture farming';
  if (/agri|farm|crop|kisan|cattle|dairy/.test(tags) || /kisan|krishi|fasal/i.test(scheme.name)) {
    negPurpose = 'tuition fees for overseas masters degree in engineering';
  } else if (/education|scholarship|school|college|phd|study/.test(tags) || /scholarship|fellowship/i.test(scheme.name)) {
    negPurpose = 'setting up a retail grocery kirana shop';
  } else if (/housing|awas/.test(tags) || /awas|housing/i.test(scheme.name)) {
    negPurpose = 'purchase of passenger commercial auto-rickshaw';
  } else if (/health|medical|cancer/.test(tags) || /swasthya|arogya|ayushman/i.test(scheme.name)) {
    negPurpose = 'opening a salon and beauty parlour shop';
  } else if (/pension|elderly/.test(tags) || /pension/i.test(scheme.name)) {
    negPurpose = 'starting a software technology startup company';
  }

  if (state) negPurpose += ` in ${state}`;

  return {
    purpose: negPurpose,
    state,
    gender: scheme.gender_eligibility === 'women_only' ? 'female' : undefined,
    family_income_rs: scheme.max_income_lakh ? Math.round(Number(scheme.max_income_lakh) * 0.5 * 100000) : undefined,
  };
}

export async function runAutomatedAudit(): Promise<{
  totalSchemes: number;
  positiveTestsRun: number;
  negativeTestsRun: number;
  failures: AuditFailure[];
  failuresByRule: Record<string, number>;
}> {
  const allSchemes = await fetchActiveSchemes();
  const failures: AuditFailure[] = [];
  const failuresByRule: Record<string, number> = {};

  function recordFailure(f: AuditFailure) {
    failures.push(f);
    const rule = f.ruleViolated || 'UNRANKED_TOP5';
    failuresByRule[rule] = (failuresByRule[rule] || 0) + 1;
  }

  let positiveTestsRun = 0;
  let negativeTestsRun = 0;

  for (const scheme of allSchemes) {
    // 3 Positive tests
    for (let qIdx = 0; qIdx < 3; qIdx++) {
      positiveTestsRun++;
      const persona = buildSyntheticPersona(scheme, qIdx);
      const scored = scoreSchemes(allSchemes, persona);

      // Rank index
      const foundIdx = scored.findIndex((s) => s.id === scheme.id);
      const targetScored = scored.find((s) => s.id === scheme.id);

      if (!targetScored) {
        recordFailure({
          schemeId: scheme.id,
          schemeName: scheme.name,
          queryType: `positive_${qIdx + 1}` as any,
          query: persona.purpose,
          state: persona.state,
          rank: -1,
          ruleViolated: 'SCHEME_FILTERED_OUT',
          reason: 'Scheme did not appear in scored results (score <= -30)',
        });
      } else if (targetScored.tier === 'HARD_DISQUALIFIED') {
        recordFailure({
          schemeId: scheme.id,
          schemeName: scheme.name,
          queryType: `positive_${qIdx + 1}` as any,
          query: persona.purpose,
          state: persona.state,
          rank: foundIdx + 1,
          score: targetScored.score,
          tier: targetScored.tier,
          ruleViolated: targetScored.disqualificationReason?.split(':')[0]?.slice(0, 40) || 'HARD_DISQUALIFIED',
          reason: targetScored.disqualificationReason || 'Hard disqualified on its own matching query',
        });
      } else if (foundIdx >= 5) {
        recordFailure({
          schemeId: scheme.id,
          schemeName: scheme.name,
          queryType: `positive_${qIdx + 1}` as any,
          query: persona.purpose,
          state: persona.state,
          rank: foundIdx + 1,
          score: targetScored.score,
          tier: targetScored.tier,
          ruleViolated: 'RANK_BELOW_TOP_5',
          reason: `Scheme ranked #${foundIdx + 1} (outside top 5) with score=${targetScored.score}`,
        });
      }
    }

    // 1 Negative control test
    negativeTestsRun++;
    const negPersona = buildNegativePersona(scheme);
    const scoredNeg = scoreSchemes(allSchemes, negPersona);
    const negIdx = scoredNeg.findIndex((s) => s.id === scheme.id);

    if (negIdx >= 0 && negIdx < 3) {
      const s = scoredNeg[negIdx];
      recordFailure({
        schemeId: scheme.id,
        schemeName: scheme.name,
        queryType: 'negative_control',
        query: negPersona.purpose,
        state: negPersona.state,
        rank: negIdx + 1,
        score: s.score,
        tier: s.tier,
        ruleViolated: 'NEGATIVE_CONTROL_LEAK_TOP_3',
        reason: `Unrelated query falsely ranked #${negIdx + 1} with score=${s.score}`,
      });
    }
  }

  return {
    totalSchemes: allSchemes.length,
    positiveTestsRun,
    negativeTestsRun,
    failures,
    failuresByRule,
  };
}

if (require.main === module) {
  runAutomatedAudit()
    .then((res) => {
      console.log('\n======================================================');
      console.log('       DETERMINISTIC SCHEME ENGINE AUDIT RESULTS       ');
      console.log('======================================================');
      console.log(`Total active schemes audited: ${res.totalSchemes}`);
      console.log(`Positive tests run: ${res.positiveTestsRun}`);
      console.log(`Negative control tests run: ${res.negativeTestsRun}`);
      console.log(`Total tests: ${res.positiveTestsRun + res.negativeTestsRun}`);
      console.log(`Total failures: ${res.failures.length}`);
      console.log('\nFailures by Rule:');
      for (const [rule, count] of Object.entries(res.failuresByRule)) {
        console.log(`  - ${rule}: ${count}`);
      }

      console.log('\nTop 20 Failure Details:');
      res.failures.slice(0, 20).forEach((f) => {
        console.log(`[ID ${f.schemeId}] ${f.schemeName} | ${f.queryType} | Rank: ${f.rank} | Rule: ${f.ruleViolated} | Query: "${f.query}" | Reason: ${f.reason}`);
      });
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
