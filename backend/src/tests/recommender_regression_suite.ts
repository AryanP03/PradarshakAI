import { fetchActiveSchemes, scoreSchemes, recommendSchemes, ScoredScheme } from '../services/SchemeEngine';

export interface TestCase {
  id: string;
  description: string;
  entities: {
    purpose: string;
    state?: string;
    gender?: string;
    age?: number;
    family_income_rs?: number;
    loan_amount_rs?: number;
    education_level?: string;
  };
  categoryHint?: string;
  must_include?: string[]; // Substring matches of scheme names that MUST appear in top 5
  must_exclude?: string[]; // Substring matches of scheme names that MUST NOT appear in top 5
  must_be_first?: string;  // Substring match of scheme name that MUST be rank #1
}

export const REGRESSION_TEST_CASES: TestCase[] = [
  {
    id: 'case_1_tailoring_maharashtra',
    description: 'tailoring in Maharashtra: MSY near the top, Charmakar scheme absent',
    entities: {
      purpose: 'I want to start a tailoring shop in Maharashtra',
      state: 'Maharashtra',
      gender: 'female',
    },
    categoryHint: 'business_loan',
    must_include: ['Mahila Samriddhi'],
    must_exclude: ['Charmakar', 'LIDCOM'],
  },
  {
    id: 'case_2_grocery_shop_tn',
    description: 'a grocery shop in Tamil Nadu: Foundation Seeds absent',
    entities: {
      purpose: 'I want to open a grocery shop in Tamil Nadu',
      state: 'Tamil Nadu',
    },
    categoryHint: 'business_loan',
    must_exclude: ['Foundation Seeds'],
  },
  {
    id: 'case_3_iit_admission',
    description: 'IIT admission: Top Class present, Dr. P. G. Solanki absent',
    entities: {
      purpose: 'I got admission to IIT for BTech and need financial assistance',
      education_level: 'undergraduate',
    },
    categoryHint: 'education_loan',
    must_include: ['Top Class Education Scheme for SC Students'],
    must_exclude: ['Dr. P. G. Solanki'],
  },
  {
    id: 'case_4_phd_fellowship',
    description: 'PhD: the fellowships, not ELS',
    entities: {
      purpose: 'I want to pursue PhD research in university',
      education_level: 'doctoral',
    },
    must_include: ['National Fellowship for Scheduled Caste Students'],
    must_exclude: ['Educational Loan Scheme (ELS)'],
  },
  {
    id: 'case_5_housing',
    description: 'housing: PMAY present, no auto-rickshaw scheme',
    entities: {
      purpose: 'financial assistance for building pucca house',
    },
    categoryHint: 'housing',
    must_include: ['Awas Yojana'],
    must_exclude: ['Auto-Rickshaw', 'Passenger Auto'],
  },
  {
    id: 'case_6_farming_kerala',
    description: 'farming in Kerala: the Kerala agriculture schemes',
    entities: {
      purpose: 'agriculture farming and crop cultivation in Kerala',
      state: 'Kerala',
    },
    must_include: ['Kerala'],
  },
  {
    id: 'case_7_pension_age_62',
    description: 'pension at age 62: NSAP, not PM-SYM or APY',
    entities: {
      purpose: 'old age pension for senior citizens',
      age: 62,
    },
    must_include: ['National Social Assistance Programme'],
    must_exclude: ['Atal Pension Yojana', 'APY', 'Shram Yogi Maan-dhan', 'PM-SYM'],
  },
  {
    id: 'case_8_man_business_loan',
    description: 'a man asking for business loans: no women-only scheme',
    entities: {
      purpose: 'loan to start a retail business',
      gender: 'male',
    },
    categoryHint: 'business_loan',
    must_exclude: ['Mahila Samriddhi', 'Mahila Adhikarita', 'PMMVY'],
  },
  {
    id: 'case_9_income_over_cap',
    description: 'an income just over a cap: that scheme excluded (Post-Matric cap is 2.5L)',
    entities: {
      purpose: 'college scholarship for my higher education',
      family_income_rs: 350000, // ₹3.5 Lakh exceeds ₹2.5 Lakh limit
    },
    must_exclude: ['Post-Matric Scholarship for SC Students'],
  },
  {
    id: 'case_10_sc_medical_graduate_clinic_gujarat',
    description: 'an SC medical graduate opening a clinic in Gujarat: Dr. P. G. Solanki first',
    entities: {
      purpose: 'I am an SC medical graduate and want to open a clinic in Gujarat',
      state: 'Gujarat',
    },
    categoryHint: 'business_loan',
    must_include: ['Dr. P. G. Solanki'],
    must_be_first: 'Dr. P. G. Solanki',
  },
  {
    id: 'case_11_sc_medical_graduate_clinic_maharashtra',
    description: 'the same query for Maharashtra: Solanki absent',
    entities: {
      purpose: 'I am an SC medical graduate and want to open a clinic in Maharashtra',
      state: 'Maharashtra',
    },
    categoryHint: 'business_loan',
    must_exclude: ['Dr. P. G. Solanki'],
  },
  {
    id: 'case_12_mbbs_admission_education_loan',
    description: '“I got admission to MBBS and need an education loan”: ELS and the education schemes present',
    entities: {
      purpose: 'I got admission to MBBS and need an education loan',
    },
    categoryHint: 'education_loan',
    must_include: ['Educational Loan Scheme (ELS)'],
  },
  {
    id: 'case_13_health_insurance',
    description: 'health insurance: Ayushman Bharat',
    entities: {
      purpose: 'medical health insurance scheme for hospitalization',
    },
    must_include: ['Ayushman Bharat'],
  },
  {
    id: 'case_14_cancer_treatment_assam',
    description: 'cancer treatment in Assam: the Assam cancer grant',
    entities: {
      purpose: 'financial grant for cancer patient treatment in Assam',
      state: 'Assam',
    },
    must_include: ['Cancer & Malignant Disease Patients – Assam'],
  },
  {
    id: 'case_15_laptop_goa',
    description: 'a free laptop for a merit student in Goa: the Goa laptop scheme',
    entities: {
      purpose: 'free laptop scheme for merit student in Goa',
      state: 'Goa',
    },
    must_include: ['Laptop Scheme for Meritorious Students of SC/ST – Goa'],
  },
];

export async function runRegressionSuite(): Promise<{
  total: number;
  passed: number;
  failed: number;
  results: { id: string; passed: boolean; message: string; topSchemes: string[] }[];
}> {
  const allSchemes = await fetchActiveSchemes();
  let passedCount = 0;
  let failedCount = 0;
  const results: { id: string; passed: boolean; message: string; topSchemes: string[] }[] = [];

  for (const tc of REGRESSION_TEST_CASES) {
    const scored = scoreSchemes(allSchemes, tc.entities, tc.categoryHint);
    const eligible = scored.filter((s) => s.tier !== 'HARD_DISQUALIFIED');
    const top5 = eligible.slice(0, 5);
    const top5Names = top5.map((s) => s.name);

    let testPassed = true;
    const failureReasons: string[] = [];

    // Check must_include
    if (tc.must_include) {
      for (const inc of tc.must_include) {
        const found = top5.some((s) => s.name.toLowerCase().includes(inc.toLowerCase()));
        if (!found) {
          testPassed = false;
          failureReasons.push(`Expected "${inc}" in top 5, but got: [${top5Names.join('; ')}]`);
        }
      }
    }

    // Check must_exclude
    if (tc.must_exclude) {
      for (const exc of tc.must_exclude) {
        const found = top5.some((s) => s.name.toLowerCase().includes(exc.toLowerCase()));
        if (found) {
          testPassed = false;
          failureReasons.push(`Found forbidden scheme matching "${exc}" in top 5: [${top5Names.join('; ')}]`);
        }
      }
    }

    // Check must_be_first
    if (tc.must_be_first) {
      const first = top5[0];
      if (!first || !first.name.toLowerCase().includes(tc.must_be_first.toLowerCase())) {
        testPassed = false;
        failureReasons.push(`Expected rank #1 to be "${tc.must_be_first}", but rank #1 is: "${first ? first.name : 'NONE'}"`);
      }
    }

    if (testPassed) {
      passedCount++;
      results.push({
        id: tc.id,
        passed: true,
        message: 'PASSED',
        topSchemes: top5Names,
      });
    } else {
      failedCount++;
      results.push({
        id: tc.id,
        passed: false,
        message: failureReasons.join(' | '),
        topSchemes: top5Names,
      });
    }
  }

  return {
    total: REGRESSION_TEST_CASES.length,
    passed: passedCount,
    failed: failedCount,
    results,
  };
}

if (require.main === module) {
  runRegressionSuite()
    .then((res) => {
      console.log('\n======================================================');
      console.log('            RECOMMENDER REGRESSION SUITE              ');
      console.log('======================================================');
      console.log(`Total test cases: ${res.total}`);
      console.log(`Passed: ${res.passed}`);
      console.log(`Failed: ${res.failed}`);
      console.log('------------------------------------------------------');
      res.results.forEach((r) => {
        const symbol = r.passed ? '✅' : '❌';
        console.log(`${symbol} [${r.id}] ${r.message}`);
        if (!r.passed) {
          console.log(`   Top 5 returned:`, r.topSchemes);
        }
      });
      process.exit(res.failed > 0 ? 1 : 0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
