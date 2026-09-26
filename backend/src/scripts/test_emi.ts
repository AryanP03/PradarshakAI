import http from 'http';

function postJson(url: string, body: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const u = new URL(url);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    }, (res) => {
      let resData = '';
      res.on('data', chunk => resData += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(resData));
        } catch (e) {
          reject(new Error(`Failed to parse response: ${resData}`));
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function runEmiAudit() {
  console.log('=== SECTION 5: EMI CALCULATOR AUDIT ===');
  
  // Scheme ID 75: Passenger Auto Rickshaw Loan Scheme – Gujarat (SC)
  // Max loan: 2 Lakh (₹2,00,000), interest rate: 5% (middle of 4-6%), tenure: 36 months, moratorium: 3 months
  const payload = {
    principalLakh: 2.0,
    annualRatePercent: 5.0,
    tenureMonths: 36,
    moratoriumMonths: 3,
    borrowerMode: 'individual',
  };

  console.log('Testing Scheme: Passenger Auto Rickshaw Loan Scheme – Gujarat (SC) [ID 75]');
  console.log('Input Parameters:', JSON.stringify(payload, null, 2));

  const result = await postJson('http://localhost:4000/api/emi/calculate', payload);
  console.log('\n--- Live API Response (POST /api/emi/calculate) ---');
  console.log(JSON.stringify(result, null, 2));

  // Mathematical verification:
  // With 3-month moratorium:
  // Monthly interest rate r = 5 / 100 / 12 = 0.004166666667
  // Moratorium interest per month (simple interest) or capitalized:
  // Let's verify how FinancialEngine computed it
  console.log('\n--- Verification of Calculations ---');
  console.log(`Principal: ₹${result.principal}`);
  console.log(`Monthly EMI: ₹${result.monthlyEMI}`);
  console.log(`Total Interest: ₹${result.totalInterest}`);
  console.log(`Total Repayment: ₹${result.totalRepayment}`);
  console.log(`Moratorium Months: ${result.moratoriumMonths}`);
  console.log(`Amortization Schedule length: ${result.amortizationSchedule?.length} months`);

  // Verify first 4 months of schedule (moratorium + first repayment month)
  console.log('\nFirst 5 months of Amortization Schedule:');
  result.amortizationSchedule?.slice(0, 5).forEach((m: any) => {
    console.log(`Month ${m.month}: EMI=₹${m.emi}, Principal=₹${m.principal}, Interest=₹${m.interest}, Balance=₹${m.balance}`);
  });

  // Verify informal vs concessional debt trap comparison
  if (result.informalComparison) {
    console.log('\nDebt Trap Comparison with informal credit (36%):');
    console.log(`Informal Monthly EMI: ₹${result.informalComparison.monthlyEMI}`);
    console.log(`Informal Total Interest: ₹${result.informalComparison.totalInterest}`);
    console.log(`Beneficiary Savings: ₹${result.informalComparison.savings}`);
  }
}

runEmiAudit().catch(err => {
  console.error(err);
  process.exit(1);
});
