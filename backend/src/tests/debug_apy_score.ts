const { pool } = require('../db/pool');
const { scoreSchemes } = require('../services/SchemeEngine');

async function run() {
  const { rows } = await pool.query('SELECT * FROM schemes WHERE id = 57');
  const scheme = rows[0];
  const entities = { purpose: 'tell me about pension schemes for sc citizens' };
  
  const pNorm = entities.purpose.toLowerCase();
  let pScore = 0;
  let tagMatchScore = 0;
  let matchingTagCount = 0;
  const normalizedTypes = (scheme.eligible_project_types || []).map(t => t.toLowerCase().replace(/_/g, ' '));
  for (const tag of normalizedTypes) {
    if (pNorm.includes(tag) || tag.includes(pNorm)) {
      tagMatchScore += 45;
      matchingTagCount++;
    }
  }
  
  if (matchingTagCount > 0) pScore = Math.min(95, 30 + tagMatchScore);
  
  let score = 0;
  score += pScore;
  score += Math.max(0, (10 - Number(scheme.interest_rate_min || 6)) * 2);
  
  const final = scoreSchemes(rows, entities);
  console.log('Final Engine Score:', final[0].score);
  console.log('Computed pScore:', pScore);
  console.log('Computed score before penalty:', score);
}

run();
