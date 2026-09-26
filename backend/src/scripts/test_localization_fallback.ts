import http from 'http';
import { getLocalizedSchemeName, getLocalizedSchemeDesc } from '../../frontend/lib/translations';

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

async function testLocalizationFallback() {
  console.log('=== TESTING MULTILINGUAL FALLBACK FOR ALL 198 SCHEMES ===');
  const schemes = await getJson('http://localhost:4000/api/schemes');
  
  const testLangs = ['hi', 'mr', 'gu', 'ta', 'bn'];
  
  for (const lang of testLangs) {
    let emptyNames = 0;
    let emptyDescs = 0;
    let translatedNames = 0;
    let fallbackNames = 0;

    for (const s of schemes) {
      const locName = getLocalizedSchemeName(s.name, lang);
      const locDesc = getLocalizedSchemeDesc(s.name, s.description, lang);

      if (!locName || locName === 'undefined') emptyNames++;
      if (!locDesc || locDesc === 'undefined') emptyDescs++;

      if (locName !== s.name) {
        translatedNames++;
      } else {
        fallbackNames++;
      }
    }

    console.log(`Language [${lang}]:`);
    console.log(`  - Total schemes tested: ${schemes.length}`);
    console.log(`  - Empty/Undefined names: ${emptyNames}`);
    console.log(`  - Empty/Undefined descs: ${emptyDescs}`);
    console.log(`  - Dedicated translations: ${translatedNames}`);
    console.log(`  - Clean English fallbacks: ${fallbackNames}`);
  }

  // Spot-check 2 new non-original schemes in Hindi
  const sampleNew1 = schemes.find((s: any) => s.id === 75); // Passenger Auto Rickshaw - Gujarat
  const sampleNew2 = schemes.find((s: any) => s.id === 20); // Post-Matric Scholarship
  console.log('\nSpot-check of new scheme fallback in Hindi (hi):');
  console.log(`Scheme 75: Name -> "${getLocalizedSchemeName(sampleNew1.name, 'hi')}"`);
  console.log(`Scheme 75: Desc -> "${getLocalizedSchemeDesc(sampleNew1.name, sampleNew1.description, 'hi').substring(0, 80)}..."`);
  console.log(`Scheme 20: Name -> "${getLocalizedSchemeName(sampleNew2.name, 'hi')}"`);
  console.log(`Scheme 20: Desc -> "${getLocalizedSchemeDesc(sampleNew2.name, sampleNew2.description, 'hi').substring(0, 80)}..."`);
}

testLocalizationFallback().catch(err => {
  console.error(err);
  process.exit(1);
});
