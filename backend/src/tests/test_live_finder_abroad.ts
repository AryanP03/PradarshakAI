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

async function testLiveFinder() {
  console.log('=== TESTING LIVE /api/recommend/finder ===');
  const payload = {
    purpose: 'suggest schemes for higher education abroad',
    family_income_rs: 200000,
    limit: 5,
  };
  const res = await postJson('http://localhost:4000/api/recommend/finder', payload);
  console.log('Live Finder returned schemes:', res.schemes?.length);
  res.schemes?.forEach((s: any, idx: number) => {
    console.log(`${idx + 1}. [ID ${s.id}] ${s.name} (Score: ${s.score}, Tier: ${s.tier}, State: ${s.state})`);
    console.log(`   Reasons: ${s.matchReasons?.join('; ')}`);
  });
}

testLiveFinder().catch(console.error);
