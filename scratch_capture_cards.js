const puppeteer = require('./frontend/node_modules/puppeteer-core');
(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.goto('http://localhost:3000/chat', { waitUntil: 'networkidle2' });
  await page.waitForSelector('textarea');
  await page.type('textarea', 'I live in Kerala, SC, I want to start a dairy business and buy cows');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.querySelectorAll('[id^="scheme-card-"]').length > 0, { timeout: 30000 });
  await new Promise(r => setTimeout(r, 4000));
  
  await page.evaluate(() => {
    const card = document.querySelector('[id^="scheme-card-"]');
    if (card) card.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'screenshots/before_cards_390x844.png' });
  console.log('Saved screenshots/before_cards_390x844.png');
  await browser.close();
})();
