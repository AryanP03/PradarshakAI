import http from 'http';

function getJson(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function runFrontendAudit() {
  console.log('=== SECTION 4: FRONTEND / UI AUDIT ===');
  
  // 1. Fetch from live API endpoint used by frontend
  const schemes = await getJson('http://localhost:4000/api/schemes');
  console.log('Total schemes returned by GET /api/schemes:', schemes.length);

  // 2. Count per typeFilter tab:
  const allCount = schemes.length;
  const financingCount = schemes.filter((s: any) => s.scheme_type !== 'informational' && s.channel_partner_applicable !== false).length;
  const informationalCount = schemes.filter((s: any) => s.scheme_type === 'informational' || s.channel_partner_applicable === false).length;
  console.log(`\nTab Counts (rendered in UI headers):`);
  console.log(`- 'All Catalog': ${allCount}`);
  console.log(`- 'Financing Schemes': ${financingCount}`);
  console.log(`- 'Informational Programmes': ${informationalCount}`);

  // 3. Count per category
  const categories = [
    'micro_finance',
    'term_loan',
    'education_loan',
    'entrepreneurship',
    'skill_development',
    'welfare',
    'other_programme',
  ];

  console.log('\nSchemes rendered per Category Tab / Filter:');
  const catBreakdown: Record<string, number> = {};
  for (const cat of categories) {
    const matching = schemes.filter((s: any) => {
      if (s.category === cat) return true;
      if (cat === 'entrepreneurship' && (s.category === 'entrepreneurship' || s.category === 'term_loan')) return true;
      if (cat === 'term_loan' && (s.category === 'term_loan' || s.category === 'entrepreneurship')) return true;
      if (cat === 'other_programme' && (s.category === 'other_programme' || s.category === 'welfare')) return true;
      if (cat === 'welfare' && (s.category === 'welfare' || s.category === 'other_programme')) return true;
      return false;
    });
    catBreakdown[cat] = matching.length;
    console.log(`- ${cat}: ${matching.length} schemes`);
  }

  // Exact raw category count in database
  const rawCatCounts: Record<string, number> = {};
  schemes.forEach((s: any) => {
    rawCatCounts[s.category] = (rawCatCounts[s.category] || 0) + 1;
  });
  console.log('\nExact raw DB category distribution:', JSON.stringify(rawCatCounts, null, 2));

  // 4. Detail view check for new schemes (IDs > 14)
  // Spot check 5 new schemes across different categories
  const spotCheckIds = [20, 44, 75, 129, 175];
  console.log('\nDetail View Inspection for 5 new non-original-14 schemes:');
  for (const id of spotCheckIds) {
    const s = await getJson(`http://localhost:4000/api/schemes/${id}`);
    console.log(`\n--- Scheme ID ${id}: ${s.name} ---`);
    console.log(`Category: ${s.category}`);
    console.log(`State: ${s.state || 'Central'}`);
    console.log(`Max Loan: ₹${s.max_loan_lakh} Lakh`);
    console.log(`Interest Rate: ${s.interest_rate_min}% - ${s.interest_rate_max}%`);
    console.log(`Max Income: ₹${s.max_income_lakh} Lakh`);
    console.log(`Eligible Projects:`, s.eligible_project_types);
    console.log(`Documents:`, s.documents_required?.slice(0, 3));
    console.log(`Description preview:`, s.description?.substring(0, 90) + '...');
    
    // Check for any undefined or null string representations
    const rawStr = JSON.stringify(s);
    const hasUndefinedString = rawStr.includes('"undefined"') || rawStr.includes('undefined');
    console.log(`Contains literal 'undefined': ${hasUndefinedString}`);
  }
}

runFrontendAudit().catch(err => {
  console.error(err);
  process.exit(1);
});
