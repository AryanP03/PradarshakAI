const fs = require('fs');
const path = require('path');
const p = path.resolve('frontend/lib/translations.ts');
let content = fs.readFileSync(p, 'utf8');

const additions = {
  en: { 'scheme.no_limit': 'No Limit', 'scheme.na': 'N/A', 'scheme.visit_portal': 'Visit Portal' },
  hi: { 'scheme.no_limit': 'कोई सीमा नहीं', 'scheme.na': 'लागू नहीं', 'scheme.visit_portal': 'पोर्टल पर जाएं' },
  mr: { 'scheme.no_limit': 'कोणतीही मर्यादा नाही', 'scheme.na': 'लागू नाही', 'scheme.visit_portal': 'पोर्टलला भेट द्या' },
  bn: { 'scheme.no_limit': 'কোন সীমা নেই', 'scheme.na': 'প্রযোজ্য নয়', 'scheme.visit_portal': 'পোর্টাল ভিজিট করুন' },
  gu: { 'scheme.no_limit': 'કોઈ મર્યાદા નથી', 'scheme.na': 'લાગુ નથી', 'scheme.visit_portal': 'પોર્ટલની મુલાકાત લો' },
  kn: { 'scheme.no_limit': 'ಯಾವುದೇ ಮಿತಿಯಿಲ್ಲ', 'scheme.na': 'ಅನ್ವಯಿಸುವುದಿಲ್ಲ', 'scheme.visit_portal': 'ಪೋರ್ಟಲ್ ಭೇಟಿ ನೀಡಿ' },
  ml: { 'scheme.no_limit': 'പരിധിയില്ല', 'scheme.na': 'ബാധകമല്ല', 'scheme.visit_portal': 'പോർട്ടൽ സന്ദർശിക്കുക' },
  od: { 'scheme.no_limit': 'କୌଣସି ସୀମା ନାହିଁ', 'scheme.na': 'ପ୍ରଯୁଜ୍ୟ ନୁହେଁ', 'scheme.visit_portal': 'ପୋର୍ଟାଲ୍ ପରିଦର୍ଶନ କରନ୍ତୁ' },
  pa: { 'scheme.no_limit': 'ਕੋਈ ਸੀਮਾ ਨਹੀਂ', 'scheme.na': 'ਲਾਗੂ ਨਹੀਂ', 'scheme.visit_portal': 'ਪੋਰਟਲ ਤੇ ਜਾਓ' },
  ta: { 'scheme.no_limit': 'எந்த எல்லையும் இல்லை', 'scheme.na': 'பொருந்தாது', 'scheme.visit_portal': 'போர்ட்டலைப் பார்வையிடவும்' },
  te: { 'scheme.no_limit': 'పరిమితి లేదు', 'scheme.na': 'వర్తించదు', 'scheme.visit_portal': 'పోర్టల్ సందర్శించండి' }
};

for (const [lang, keys] of Object.entries(additions)) {
  const matchStr = new RegExp('(\\n  ' + lang + ': \\{)([\\s\\S]*?)(?=\\n  [a-z]{2}: \\{|\\n\\};)');
  content = content.replace(matchStr, (match, p1, p2) => {
    let str = p1;
    for (const [k, v] of Object.entries(keys)) {
      str += `\n    '${k}': '${v}',`;
    }
    str += p2;
    return str;
  });
}

fs.writeFileSync(p, content, 'utf8');
console.log('Done');
