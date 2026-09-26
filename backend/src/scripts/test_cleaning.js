const fs = require('fs');

function cleanText(text) {
  if (!text) return text;
  let str = text;

  // Specific phrases
  str = str.replace(/\?10K \? \?20K \? \?50K/g, '₹10K → ₹20K → ₹50K');
  str = str.replace(/income \? \?15,000/g, 'income ≤ ₹15,000');
  str = str.replace(/income \? \?1\.2 lakh/g, 'income ≤ ₹1.2 lakh');
  str = str.replace(/\? ?2 ha/g, '≤ 2 ha');

  // Double question mark before numbers (meaning <= ₹)
  str = str.replace(/\?\?([0-9])/g, '≤ ₹$1');

  // Rupee range e.g. ?1,000?5,000 or ?200?500
  str = str.replace(/\?([0-9,]+)\s*[\?]\s*\?([0-9,]+)/g, '₹$1–₹$2');

  // Percentage range e.g. 4?6% or 1.5?2%
  str = str.replace(/([0-9.]+)\s*[\?]\s*([0-9.]+)%/g, '$1–$2%');

  // Classes range e.g. Classes XI?PhD, Classes IX?X
  str = str.replace(/Classes ([IVXLCDM]+)\s*[\?]\s*([a-zA-Z0-9]+)/g, 'Classes $1–$2');

  // General range between numbers e.g. 18?40
  str = str.replace(/([0-9]+)\s*[\?]\s*([0-9]+)/g, '$1–$2');

  // Decimal range e.g. 1.5?2.5
  str = str.replace(/([0-9]+\.[0-9]+)\s*[\?]\s*([0-9]+\.[0-9]+)/g, '$1–$2');

  // Single ? followed by digit e.g. ?1.40 or ?50 or ?3
  str = str.replace(/\?([0-9])/g, '₹$1');

  // In quotes or brackets or separators
  str = str.replace(/–\s*\?/g, '– ₹');

  return str;
}

const content = fs.readFileSync('src/db/updated_schemes.csv', 'utf8');
const lines = content.split('\n');
const stillWithQ = [];
lines.forEach((l, idx) => {
  if (idx === 0) return; // header
  const c = cleanText(l);
  if (c.includes('?')) {
    stillWithQ.push({ line: idx + 1, content: c });
  }
});

console.log('Still with ? count:', stillWithQ.length);
stillWithQ.forEach(x => {
  console.log(`L${x.line}: ${x.content.slice(0, 100)}`);
});
