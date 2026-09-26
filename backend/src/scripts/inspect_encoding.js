const fs = require('fs');
const content = fs.readFileSync('src/db/updated_schemes.csv', 'utf8');

const matches = [];
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('?') || line.includes('')) {
    matches.push({ line: idx + 1, content: line.slice(0, 150) });
  }
});

console.log(`Total lines with ? or : ${matches.length}`);
console.log('First 10 sample lines:');
matches.slice(0, 10).forEach(m => console.log(`L${m.line}: ${m.content}`));
