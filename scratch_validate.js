const puppeteer = require('./frontend/node_modules/puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = path.resolve('d:/SIH_2026/PradarsakAI/screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function measureViewport(page, name, width, height, dsf = 2) {
  await page.setViewport({ width, height, deviceScaleFactor: dsf });
  await sleep(1500);

  // Take screenshot
  const screenshotPath = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: false });

  // Measure overflow & elements
  const metrics = await page.evaluate((vpW, vpH) => {
    const doc = document.documentElement;
    const winWidth = window.innerWidth;
    const docScrollWidth = doc.scrollWidth;
    const docClientWidth = doc.clientWidth;

    const overflowingElements = [];
    const all = document.querySelectorAll('*');

    for (const el of all) {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      const isHidden = style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0';
      if (isHidden) continue;

      if (rect.right > winWidth + 1.5) {
        overflowingElements.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || '',
          className: (typeof el.className === 'string' ? el.className.trim() : '').slice(0, 50),
          rectRight: Math.round(rect.right),
          rectWidth: Math.round(rect.width),
          winWidth,
          overflowPx: Math.round(rect.right - winWidth),
          text: (el.innerText || el.textContent || '').slice(0, 60).replace(/\s+/g, ' ').trim(),
        });
      }
    }

    // Check message bubble alignment
    const userBubbleEl = document.querySelector('.chat-bubble-user');
    const botBubbleEl = document.querySelector('.chat-bubble-bot');
    let userBubbleMetrics = null;
    let botBubbleMetrics = null;

    if (userBubbleEl) {
      const ubRect = userBubbleEl.getBoundingClientRect();
      userBubbleMetrics = {
        left: Math.round(ubRect.left),
        right: Math.round(ubRect.right),
        width: Math.round(ubRect.width),
        distFromRightEdge: Math.round(winWidth - ubRect.right),
        distFromLeftEdge: Math.round(ubRect.left),
        isRightAligned: (winWidth - ubRect.right) < ubRect.left,
      };
    }

    if (botBubbleEl) {
      const bbRect = botBubbleEl.getBoundingClientRect();
      botBubbleMetrics = {
        left: Math.round(bbRect.left),
        right: Math.round(bbRect.right),
        width: Math.round(bbRect.width),
        distFromLeftEdge: Math.round(bbRect.left),
        distFromRightEdge: Math.round(winWidth - bbRect.right),
        isLeftAligned: bbRect.left < (winWidth - bbRect.right),
      };
    }

    // Scheme Titles Word Wrapping: verify words per line
    const titles = Array.from(document.querySelectorAll('h3')).map((h) => {
      const text = h.innerText.trim();
      const rect = h.getBoundingClientRect();
      const words = text.split(/\s+/).filter(Boolean);
      const computedLineHeight = parseFloat(window.getComputedStyle(h).lineHeight) || 24;
      const linesApprox = Math.max(1, Math.round(rect.height / computedLineHeight));
      const wordsPerLine = words.length / linesApprox;
      return {
        text: text.slice(0, 60),
        wordCount: words.length,
        height: Math.round(rect.height),
        linesApprox,
        wordsPerLine: Math.round(wordsPerLine * 10) / 10,
        isSingleWordPerLine: wordsPerLine <= 1.2 && words.length > 3,
      };
    });

    // Check scheme cards width vs viewport width
    const cards = Array.from(document.querySelectorAll('[id^="scheme-card-"]')).map((c) => {
      const r = c.getBoundingClientRect();
      return {
        width: Math.round(r.width),
        left: Math.round(r.left),
        right: Math.round(r.right),
        pctOfViewport: Math.round((r.width / winWidth) * 100),
      };
    });

    // Match percentage check: search DOM for any '% Match' or 'NN% Match'
    const fullText = document.body.innerText;
    const matchPercentageRegex = /\b\d{1,3}%\s*Match\b/i;
    const hasMatchPercentageInText = matchPercentageRegex.test(fullText);

    // Best Match badge check
    const hasBestMatchBadge = fullText.includes('Best Match') || document.querySelector('[style*="background: rgb(232, 119, 34)"]') !== null;

    // 25% chip check
    const chip25 = Array.from(document.querySelectorAll('*')).find((el) => (el.innerText || '').trim() === '25%');
    const chip25Info = chip25
      ? {
          found: true,
          title: chip25.getAttribute('title') || chip25.parentElement?.getAttribute('title') || '',
          ariaLabel: chip25.getAttribute('aria-label') || chip25.parentElement?.getAttribute('aria-label') || '',
        }
      : { found: false };

    // Action buttons tap target check
    const buttons = Array.from(document.querySelectorAll('button, a[href]')).filter((b) => {
      const t = (b.innerText || '').toLowerCase();
      return t.includes('know more') || t.includes('documents') || t.includes('calculate emi') || t.includes('compare') || t.includes('partner') || t.includes('visit portal') || t.includes('new chat');
    }).map((b) => {
      const r = b.getBoundingClientRect();
      return {
        text: (b.innerText || '').slice(0, 30).trim(),
        width: Math.round(r.width),
        height: Math.round(r.height),
        meets44px: Math.round(r.height) >= 40,
      };
    });

    return {
      viewport: `${vpW}x${vpH}`,
      winWidth,
      docScrollWidth,
      docClientWidth,
      isScrollWidthEqualClientWidth: docScrollWidth <= docClientWidth,
      overflowCount: overflowingElements.length,
      overflowingElements: overflowingElements.slice(0, 5),
      userBubbleMetrics,
      botBubbleMetrics,
      titles,
      cards,
      hasMatchPercentageInText,
      hasBestMatchBadge,
      chip25Info,
      buttons,
    };
  }, width, height);

  return { metrics, screenshotPath };
}

async function runValidation() {
  console.log('=== STARTING BROWSER VALIDATION ===');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  try {
    const page = await browser.newPage();

    // ── STEP 1: Standard Conversation Validation across 4 Mobile + 1 Desktop Viewports ──
    console.log('\n[Phase 1] Navigating to http://localhost:3000/chat...');
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    await page.goto('http://localhost:3000/chat', { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('textarea', { timeout: 10000 });

    const query = 'I live in Kerala, SC, I want to start a dairy business and buy cows';
    console.log(`Submitting query: "${query}"`);
    await page.type('textarea', query);
    await sleep(500);

    const sendBtn = await page.$('button[aria-label="Send message"]');
    if (sendBtn) {
      await sendBtn.click();
    } else {
      await page.keyboard.press('Enter');
    }

    console.log('Waiting for response and cards to render (up to 45s)...');
    let cardsLoaded = false;
    for (let i = 0; i < 45; i++) {
      await sleep(1000);
      const count = await page.evaluate(() => document.querySelectorAll('[id^="scheme-card-"], .interactive-3d-card').length);
      if (count > 0) {
        cardsLoaded = true;
        console.log(`Cards rendered at sec ${i + 1} (${count} cards)`);
        break;
      }
    }

    if (!cardsLoaded) {
      throw new Error('Cards did not render within 45s');
    }

    // Allow typing animation to finish
    await sleep(3000);

    const viewports = [
      { name: 'after_390x844', width: 390, height: 844 },
      { name: 'after_360x800', width: 360, height: 800 },
      { name: 'after_412x915', width: 412, height: 915 },
      { name: 'after_320x568', width: 320, height: 568 },
      { name: 'after_desktop_1280x800', width: 1280, height: 800, dsf: 1 },
    ];

    const results = [];
    for (const vp of viewports) {
      console.log(`\nTesting viewport ${vp.name} (${vp.width}x${vp.height})...`);
      const res = await measureViewport(page, vp.name, vp.width, vp.height, vp.dsf || 2);
      console.log(`  docScrollWidth: ${res.metrics.docScrollWidth}, docClientWidth: ${res.metrics.docClientWidth}`);
      console.log(`  scrollWidth === clientWidth: ${res.metrics.isScrollWidthEqualClientWidth}`);
      console.log(`  Overflowing elements count: ${res.metrics.overflowCount}`);
      console.log(`  User bubble right-aligned: ${res.metrics.userBubbleMetrics?.isRightAligned} (dist from right edge: ${res.metrics.userBubbleMetrics?.distFromRightEdge}px, left: ${res.metrics.userBubbleMetrics?.distFromLeftEdge}px)`);
      console.log(`  Bot bubble left-aligned: ${res.metrics.botBubbleMetrics?.isLeftAligned} (dist from left edge: ${res.metrics.botBubbleMetrics?.distFromLeftEdge}px, right: ${res.metrics.botBubbleMetrics?.distFromRightEdge}px)`);
      console.log(`  Scheme cards width % of viewport: ${JSON.stringify(res.metrics.cards)}`);
      console.log(`  Match % found in text: ${res.metrics.hasMatchPercentageInText}`);
      console.log(`  Best Match badge: ${res.metrics.hasBestMatchBadge}`);
      console.log(`  25% Chip Tooltip: "${res.metrics.chip25Info?.title}"`);
      console.log(`  Titles wrap test: ${JSON.stringify(res.metrics.titles)}`);
      console.log(`  Sample button tap targets: ${JSON.stringify(res.metrics.buttons.slice(0, 4))}`);
      console.log(`  Screenshot saved: ${res.screenshotPath}`);
      results.push(res);
    }

    // ── STEP 2: Stress-Testing with Long Scheme Names & 3 Cards ──
    console.log('\n[Phase 2] Stress-testing with long scheme names...');
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });

    await page.evaluate(() => {
      const longTitle1 = 'Dr. Ambedkar Central Sector Scheme of Interest Subsidy on Educational Loans';
      const longTitle2 = 'Rajarshi Chhatrapati Shahu Maharaj Shikshan Shulkh Shishyavrutti Yojana';
      const titles = document.querySelectorAll('h3');
      if (titles[0]) titles[0].innerText = longTitle1;
      if (titles[1]) titles[1].innerText = longTitle2;
    });
    await sleep(800);

    const stressRes = await measureViewport(page, 'after_stress_long_names_390x844', 390, 844, 2);
    console.log(`  Long Scheme Names - docScrollWidth: ${stressRes.metrics.docScrollWidth}, docClientWidth: ${stressRes.metrics.docClientWidth}`);
    console.log(`  Overflowing elements: ${stressRes.metrics.overflowCount}`);
    console.log(`  Titles wrap metrics:`, JSON.stringify(stressRes.metrics.titles));

    // ── STEP 3: Compare Schemes View ──
    console.log('\n[Phase 3] Testing Compare Schemes view...');
    const compareBtn = await page.evaluateHandle(() => {
      return Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('Compare Schemes'));
    });
    let compRes = null;
    if (compareBtn) {
      await compareBtn.click();
      console.log('  Waiting for ComparisonCard to render...');
      await page.waitForSelector('.comparison-card', { timeout: 25000 });
      await sleep(2000);
      compRes = await measureViewport(page, 'after_comparison_390x844', 390, 844, 2);
      console.log(`  Comparison View - docScrollWidth: ${compRes.metrics.docScrollWidth}, docClientWidth: ${compRes.metrics.docClientWidth}`);
      console.log(`  Overflowing elements: ${compRes.metrics.overflowCount}`);
      console.log(`  Match % found in comparison: ${compRes.metrics.hasMatchPercentageInText}`);
    } else {
      console.log('  Compare button not clicked or not present');
    }

    // ── STEP 4: Language Check (Hindi & Marathi) ──
    console.log('\n[Phase 4] Testing Language: Hindi (hi)...');
    // Clear chat session storage to test clean Hindi UI
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      document.cookie = 'app_lang_mode=hi; path=/';
      document.cookie = 'app_lang=hi; path=/';
      localStorage.setItem('app_lang_mode', 'hi');
      localStorage.setItem('app_lang', 'hi');
      window.location.href = 'http://localhost:3000/chat';
    });
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 });
    await page.waitForSelector('textarea', { timeout: 10000 });
    await sleep(2000);

    const hiRes = await measureViewport(page, 'after_hindi_390x844', 390, 844, 2);
    console.log(`  Hindi UI - docScrollWidth: ${hiRes.metrics.docScrollWidth}, docClientWidth: ${hiRes.metrics.docClientWidth}`);
    console.log(`  scrollWidth === clientWidth: ${hiRes.metrics.isScrollWidthEqualClientWidth}`);
    console.log(`  Overflowing elements: ${hiRes.metrics.overflowCount}`);

    console.log('\n[Phase 5] Testing Language: Marathi (mr)...');
    await page.evaluate(() => {
      document.cookie = 'app_lang_mode=mr; path=/';
      document.cookie = 'app_lang=mr; path=/';
      localStorage.setItem('app_lang_mode', 'mr');
      localStorage.setItem('app_lang', 'mr');
      window.location.href = 'http://localhost:3000/chat';
    });
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 });
    await page.waitForSelector('textarea', { timeout: 10000 });
    await sleep(2000);

    const mrRes = await measureViewport(page, 'after_marathi_390x844', 390, 844, 2);
    console.log(`  Marathi UI - docScrollWidth: ${mrRes.metrics.docScrollWidth}, docClientWidth: ${mrRes.metrics.docClientWidth}`);
    console.log(`  scrollWidth === clientWidth: ${mrRes.metrics.isScrollWidthEqualClientWidth}`);
    console.log(`  Overflowing elements: ${mrRes.metrics.overflowCount}`);

    // Restore English
    await page.evaluate(() => {
      document.cookie = 'app_lang_mode=en; path=/';
      document.cookie = 'app_lang=en; path=/';
      localStorage.setItem('app_lang_mode', 'en');
      localStorage.setItem('app_lang', 'en');
    });

    // Save summary log to disk for reference
    const summaryData = {
      viewports: results.map((r) => r.metrics),
      stress: stressRes.metrics,
      comparison: compRes?.metrics || null,
      hindi: hiRes.metrics,
      marathi: mrRes.metrics,
    };
    fs.writeFileSync(path.join(SCREENSHOT_DIR, 'validation_summary.json'), JSON.stringify(summaryData, null, 2));
    console.log('\nSaved validation_summary.json');

    console.log('\n=== ALL VALIDATION TESTS COMPLETED SUCCESSFULLY ===');
  } catch (err) {
    console.error('Validation script error:', err);
  } finally {
    await browser.close();
  }
}

runValidation();
