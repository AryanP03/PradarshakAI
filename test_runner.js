const puppeteer = require('./frontend/node_modules/puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = path.resolve('d:/SIH_2026/PradarsakAI/screenshots');

async function test() {
  console.log('Launching Chrome...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  try {
    const page = await browser.newPage();
    page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message));

    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    console.log('Loading /chat...');
    await page.goto('http://localhost:3000/chat', { waitUntil: 'networkidle2', timeout: 30000 });

    console.log('Waiting for textarea...');
    await page.waitForSelector('textarea', { timeout: 10000 });

    const query = 'I live in Kerala, SC, I want to start a dairy business and buy cows';
    console.log('Typing query...');
    await page.type('textarea', query);
    await new Promise((r) => setTimeout(r, 500));

    console.log('Clicking send button...');
    const sendBtn = await page.$('button[aria-label="Send message"]');
    if (sendBtn) {
      await sendBtn.click();
    } else {
      await page.keyboard.press('Enter');
    }

    console.log('Waiting for assistant message / cards...');
    for (let i = 0; i < 40; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      const state = await page.evaluate(() => {
        const text = document.body.innerText;
        const cards = document.querySelectorAll('[id^="scheme-card-"], .interactive-3d-card');
        const userBubbles = document.querySelectorAll('[id^="msg-text-"]');
        return {
          cardCount: cards.length,
          msgCount: userBubbles.length,
          hasDairy: text.includes('Dairy') || text.includes('Livestock') || text.includes('National Livestock'),
          hasCards: cards.length > 0,
        };
      });
      console.log(`[sec ${i + 1}] cards: ${state.cardCount}, msgs: ${state.msgCount}, hasLivestock: ${state.hasDairy}`);
      if (state.cardCount > 0) {
        console.log('Cards rendered successfully!');
        break;
      }
    }

    const shotPath = path.join(SCREENSHOT_DIR, 'test_run.png');
    await page.screenshot({ path: shotPath });
    console.log('Saved test screenshot to:', shotPath);
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    await browser.close();
  }
}

test();
