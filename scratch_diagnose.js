const puppeteer = require('./frontend/node_modules/puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = path.resolve('d:/SIH_2026/PradarsakAI/screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function run() {
  console.log('Launching browser with Chrome at:', CHROME_PATH);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });

    console.log('Navigating to http://localhost:3000/chat...');
    await page.goto('http://localhost:3000/chat', { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait for chat textarea
    await page.waitForSelector('textarea', { timeout: 10000 });
    console.log('Chat page loaded. Entering query...');

    const query = 'I live in Kerala, SC, I want to start a dairy business and buy cows';
    await page.type('textarea', query);
    
    // Press Enter to send
    await page.keyboard.press('Enter');
    console.log('Query submitted. Waiting for response...');

    // Wait for assistant response to render scheme cards or schemes
    await page.waitForFunction(
      () => {
        const text = document.body.innerText;
        return (
          document.querySelectorAll('[id^="scheme-card-"]').length > 0 ||
          document.querySelectorAll('.interactive-3d-card').length > 0 ||
          text.includes('Match') ||
          text.includes('Dairy') ||
          text.includes('Loan') ||
          text.includes('Yojana')
        );
      },
      { timeout: 30000 }
    );

    // Wait 3 seconds for typing animation and cards to settle
    await new Promise((r) => setTimeout(r, 4000));

    // Capture before screenshot at 390x844
    const shot390 = path.join(SCREENSHOT_DIR, 'before_390x844.png');
    await page.screenshot({ path: shot390, fullPage: false });
    console.log('Saved 390x844 screenshot to:', shot390);

    // Diagnostic measurement
    const diagnosis = await page.evaluate(() => {
      const doc = document.documentElement;
      const winWidth = window.innerWidth;
      const docScrollWidth = doc.scrollWidth;
      const docClientWidth = doc.clientWidth;

      const overflowing = [];
      const scrollWidthOverClient = [];
      const allElements = document.querySelectorAll('*');

      for (const el of allElements) {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        const isHidden = style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0';
        if (isHidden) continue;

        if (el.scrollWidth > el.clientWidth + 1) {
          scrollWidthOverClient.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || '',
            className: typeof el.className === 'string' ? el.className.trim() : '',
            scrollWidth: el.scrollWidth,
            clientWidth: el.clientWidth,
            diff: el.scrollWidth - el.clientWidth,
            styleOverflow: style.overflow,
            styleOverflowX: style.overflowX,
            styleOverflowY: style.overflowY,
            textSnippet: (el.innerText || el.textContent || '').slice(0, 60).replace(/\s+/g, ' ').trim(),
          });
        }

        // Check if element extends past right edge of window
        if (rect.right > winWidth + 1) {
          overflowing.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || '',
            className: typeof el.className === 'string' ? el.className.trim() : '',
            rect: {
              top: Math.round(rect.top),
              left: Math.round(rect.left),
              right: Math.round(rect.right),
              width: Math.round(rect.width),
            },
            scrollWidth: el.scrollWidth,
            clientWidth: el.clientWidth,
            computedStyles: {
              width: style.width,
              minWidth: style.minWidth,
              maxWidth: style.maxWidth,
              flexShrink: style.flexShrink,
              whiteSpace: style.whiteSpace,
              overflow: style.overflow,
              overflowX: style.overflowX,
              position: style.position,
              display: style.display,
            },
            textSnippet: (el.innerText || el.textContent || '').slice(0, 80).replace(/\s+/g, ' ').trim(),
          });
        }
      }

      return {
        winWidth,
        docScrollWidth,
        docClientWidth,
        hasDocOverflow: docScrollWidth > docClientWidth,
        overflowingElementsCount: overflowing.length,
        overflowingElements: overflowing,
        scrollWidthOverClient,
      };
    });

    console.log('--- DIAGNOSIS RESULTS ---');
    console.log(JSON.stringify(diagnosis, null, 2));

    // Viewport 360x800
    await page.setViewport({ width: 360, height: 800, deviceScaleFactor: 2 });
    await new Promise((r) => setTimeout(r, 1000));
    const shot360 = path.join(SCREENSHOT_DIR, 'before_360x800.png');
    await page.screenshot({ path: shot360, fullPage: false });
    console.log('Saved 360x800 screenshot to:', shot360);

    // Viewport 412x915
    await page.setViewport({ width: 412, height: 915, deviceScaleFactor: 2 });
    await new Promise((r) => setTimeout(r, 1000));
    const shot412 = path.join(SCREENSHOT_DIR, 'before_412x915.png');
    await page.screenshot({ path: shot412, fullPage: false });
    console.log('Saved 412x915 screenshot to:', shot412);

    // Viewport 320x568
    await page.setViewport({ width: 320, height: 568, deviceScaleFactor: 2 });
    await new Promise((r) => setTimeout(r, 1000));
    const shot320 = path.join(SCREENSHOT_DIR, 'before_320x568.png');
    await page.screenshot({ path: shot320, fullPage: false });
    console.log('Saved 320x568 screenshot to:', shot320);

    // Viewport 1280x800 (Desktop)
    await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
    await new Promise((r) => setTimeout(r, 1000));
    const shotDesktop = path.join(SCREENSHOT_DIR, 'before_desktop_1280x800.png');
    await page.screenshot({ path: shotDesktop, fullPage: false });
    console.log('Saved desktop screenshot to:', shotDesktop);

  } catch (err) {
    console.error('Diagnostic error:', err);
  } finally {
    await browser.close();
  }
}

run();
