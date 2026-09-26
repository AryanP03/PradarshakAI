import http from 'http';
import { fetchActiveSchemes, scoreSchemes } from '../services/SchemeEngine';

function postJson(url: string, body: any): Promise<{ data: any; durationMs: number }> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const u = new URL(url);
    const t0 = performance.now();
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
        const durationMs = performance.now() - t0;
        try {
          resolve({ data: JSON.parse(resData), durationMs });
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function runPerformanceBenchmark() {
  console.log('=== SECTION 7: PERFORMANCE & LATENCY BENCHMARK ===');

  // 1. In-memory scoring benchmark (CPU time to score all 198 schemes)
  const allSchemes = await fetchActiveSchemes();
  console.log(`Loaded ${allSchemes.length} schemes from database.`);

  const sampleProfile = {
    purpose: 'tailoring business small loan sewing machine garments',
    gender: 'female',
    state: 'Maharashtra',
    family_income_rs: 200000,
    loan_amount_rs: 150000,
  };

  const scoringIterations = 200;
  const scoringTimes: number[] = [];
  for (let i = 0; i < scoringIterations; i++) {
    const t0 = performance.now();
    scoreSchemes(allSchemes, sampleProfile);
    scoringTimes.push(performance.now() - t0);
  }

  scoringTimes.sort((a, b) => a - b);
  const avgScoring = scoringTimes.reduce((a, b) => a + b, 0) / scoringTimes.length;
  const p95Scoring = scoringTimes[Math.floor(scoringTimes.length * 0.95)];
  console.log(`\nIn-Memory Scoring Benchmark (${scoringIterations} iterations across ${allSchemes.length} schemes):`);
  console.log(`- Min scoring time: ${scoringTimes[0].toFixed(3)} ms`);
  console.log(`- Average scoring time: ${avgScoring.toFixed(3)} ms`);
  console.log(`- P95 scoring time: ${p95Scoring.toFixed(3)} ms`);
  console.log(`- Max scoring time: ${scoringTimes[scoringTimes.length - 1].toFixed(3)} ms`);

  // 2. DB Query Benchmark (fetchActiveSchemes)
  const dbIterations = 20;
  const dbTimes: number[] = [];
  for (let i = 0; i < dbIterations; i++) {
    const t0 = performance.now();
    await fetchActiveSchemes(undefined, 'Maharashtra');
    dbTimes.push(performance.now() - t0);
  }
  dbTimes.sort((a, b) => a - b);
  const avgDb = dbTimes.reduce((a, b) => a + b, 0) / dbTimes.length;
  console.log(`\nDatabase Fetch Benchmark (PostgreSQL query with State filter, ${dbIterations} runs):`);
  console.log(`- Min DB latency: ${dbTimes[0].toFixed(2)} ms`);
  console.log(`- Average DB latency: ${avgDb.toFixed(2)} ms`);
  console.log(`- P95 DB latency: ${dbTimes[Math.floor(dbTimes.length * 0.95)].toFixed(2)} ms`);

  // 3. End-to-End HTTP API Benchmark (POST /api/recommend/finder)
  const apiIterations = 15;
  const apiTimes: number[] = [];
  console.log(`\nRunning ${apiIterations} end-to-end HTTP requests to POST /api/recommend/finder...`);

  for (let i = 0; i < apiIterations; i++) {
    const { durationMs } = await postJson('http://localhost:4000/api/recommend/finder', {
      purpose: 'small kirana store grocery retail',
      gender: 'male',
      state: 'Gujarat',
      family_income_rs: 250000,
      loan_amount_rs: 100000,
      limit: 3,
    });
    apiTimes.push(durationMs);
  }

  apiTimes.sort((a, b) => a - b);
  const avgApi = apiTimes.reduce((a, b) => a + b, 0) / apiTimes.length;
  const p95Api = apiTimes[Math.floor(apiTimes.length * 0.95)];
  console.log(`End-to-End API Latency Results:`);
  console.log(`- Min HTTP latency: ${apiTimes[0].toFixed(2)} ms`);
  console.log(`- Average HTTP latency: ${avgApi.toFixed(2)} ms`);
  console.log(`- P95 HTTP latency: ${p95Api.toFixed(2)} ms`);
  console.log(`- Max HTTP latency: ${apiTimes[apiTimes.length - 1].toFixed(2)} ms`);

  process.exit(0);
}

runPerformanceBenchmark().catch(err => {
  console.error(err);
  process.exit(1);
});
