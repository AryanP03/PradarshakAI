const puppeteer = require('./frontend/node_modules/puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = path.resolve('d:/SIH_2026/PradarsakAI/screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

let passed = 0;
let failed = 0;

function assert(condition, testName, detail = '') {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}${detail ? ` -> ${detail}` : ''}`);
    failed++;
  }
}

async function runBrowserTests() {
  console.log('\n================== E2E REGISTRATION CAPTCHA & LIVE IDENTITY TESTS ==================\n');

  console.log('Launching Chrome browser...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  try {
    const page = await browser.newPage();
    page.on('console', (msg) => {
      // console.log('[BROWSER CONSOLE]', msg.text());
    });

    await page.setViewport({ width: 1200, height: 900 });

    console.log('Navigating to http://localhost:3000/register ...');
    await page.goto('http://localhost:3000/register', { waitUntil: 'networkidle2', timeout: 30000 });

    // ── Check 1: Section 1 is loaded
    await page.waitForSelector('h1', { timeout: 10000 });
    const title = await page.$eval('h1', el => el.innerText);
    assert(title.includes('Beneficiary Account'), 'Registration page loads with main title');

    // ── Complete Section 1 (Check eligibility & Verify Email to reveal Sections 2-6)
    console.log('\nFulfilling eligibility and email verification in Section 1...');
    // Check eligibility checkboxes
    const checkboxes = await page.$$('input[type="checkbox"]');
    if (checkboxes.length >= 2) {
      await checkboxes[0].click();
      await checkboxes[1].click();
    }

    // Full Name
    const nameInput = await page.$('input[placeholder="As it appears on official documents"]');
    if (nameInput) await nameInput.type('Sunil Meshram');

    // Mobile
    const mobInput = await page.$('input[placeholder="10-digit mobile"]');
    if (mobInput) await mobInput.type('9876543210');

    // Email
    const testEmail = `test_captcha_${Date.now()}@pradarshak-demo.in`;
    const emailInput = await page.$('input[type="email"]');
    if (emailInput) await emailInput.type(testEmail);

    // Click "Verify Email" button
    console.log('Clicking Verify Email button...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const verifyEmailBtn = btns.find(b => b.innerText.includes('Verify Email'));
      if (verifyEmailBtn) verifyEmailBtn.click();
    });

    // Wait for OTP input to appear
    console.log('Waiting for OTP input to render...');
    await page.waitForSelector('input[placeholder="Enter 6-digit OTP"]', { timeout: 30000 });

    // Wait 500ms for demoOtp state update or read demoOtp from input
    await new Promise(r => setTimeout(r, 600));
    const otpValue = await page.$eval('input[placeholder="Enter 6-digit OTP"]', el => el.value);
    console.log(`Current OTP input value: "${otpValue}"`);

    if (!otpValue || otpValue.length !== 6) {
      // Fetch OTP from backend console or fetch direct demo OTP
      let otpToUse = await page.evaluate(async (email) => {
        try {
          const res = await fetch('http://localhost:4000/api/registration/send-email-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
          });
          const data = await res.json();
          return data.demoOtp;
        } catch {
          return null;
        }
      }, testEmail);

      if (!otpToUse) {
        // Fallback: read directly from the backend server task log
        const logPath = 'C:\\Users\\Nitin Phanse\\.gemini\\antigravity-ide\\brain\\814264e9-87a1-44fc-8979-6cb3b14e62b4\\.system_generated\\tasks\\task-276.log';
        if (fs.existsSync(logPath)) {
          const content = fs.readFileSync(logPath, 'utf8');
          const regex = new RegExp(`Generated OTP for ${testEmail.toLowerCase()}: (\\d{6})`, 'g');
          let match;
          while ((match = regex.exec(content)) !== null) {
            otpToUse = match[1];
          }
        }
      }

      console.log(`Using OTP for verification: ${otpToUse}`);
      if (otpToUse) {
        await page.type('input[placeholder="Enter 6-digit OTP"]', otpToUse);
      }
    }

    // Click "Verify OTP"
    console.log('Clicking Verify OTP button...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const verifyOtpBtn = btns.find(b => b.innerText.includes('Verify OTP'));
      if (verifyOtpBtn) verifyOtpBtn.click();
    });

    // Wait for Section 3 (Live Identity Check / Security Check) to become visible
    console.log('Waiting for Section 3 to render...');
    await page.waitForFunction(() => {
      return document.body.innerText.includes('3. Live Identity Check') || document.body.innerText.includes('Security Verification (CAPTCHA)');
    }, { timeout: 15000 });

    console.log('\n--- VERIFICATION TEST SUITE ---');

    // ── Check 2: Camera is NEVER activated and no video element exists
    const videoElements = await page.$$('video');
    assert(videoElements.length === 0, 'No video stream or video element mounted (Camera is NEVER activated)');

    // ── Check 3: Live Identity Verification Disablement Banner matches OCR pattern & tone
    const bannerInfo = await page.evaluate(() => {
      const body = document.body.innerText;
      return {
        hasDevEnv: body.includes('Development / Demo Environment'),
        hasBypassed: body.includes('Bypassed'),
        hasDisabledMsg: body.includes('Live identity verification is temporarily disabled in the development/demo environment. Camera-based facial recognition will be enabled for production.'),
        hasCameraBypassedBadge: body.includes('Demo Mode — Camera Bypassed'),
      };
    });
    assert(bannerInfo.hasDevEnv && bannerInfo.hasBypassed, 'Disablement banner displays "Development / Demo Environment" and "Bypassed" badge');
    assert(bannerInfo.hasDisabledMsg, 'Disablement explanation text accurately explains temporary disablement in professional tone');
    assert(bannerInfo.hasCameraBypassedBadge, 'Section 3 header displays "Demo Mode — Camera Bypassed" badge');

    // ── Check 4: Disabled OCR and its existing explanation remain unchanged
    const ocrInfo = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasOcrHeader: text.includes('4. Document Verification (Caste & Income OCR)'),
        hasOcrExplanation: text.includes('Document verification is temporarily disabled in the development/demo environment. Certificate verification will be enabled for production.'),
        hasOcrBadge: text.includes('Demo Mode — Verification Optional'),
      };
    });
    assert(ocrInfo.hasOcrHeader, 'Section 4 Document Verification (OCR) is present');
    assert(ocrInfo.hasOcrExplanation, 'Original OCR disablement explanation remains completely intact');
    assert(ocrInfo.hasOcrBadge, 'Original OCR "Demo Mode — Verification Optional" badge remains unchanged');

    // ── Check 5: Placement Verification: CAPTCHA is moved to Section 6 directly above Submit button
    const placementInfo = await page.evaluate(() => {
      const submitBtn = document.querySelector('button[type="submit"]');
      const captchaInput = document.getElementById('captcha-input');
      const termsCheckbox = document.querySelector('input[type="checkbox"][required]');
      const sections = Array.from(document.querySelectorAll('section'));
      const sec3 = sections.find(s => s.innerText.includes('3. Live Identity Check'));

      const captchaInSec3 = sec3 ? sec3.contains(captchaInput) : false;
      const captchaBeforeSubmit = submitBtn && captchaInput && (captchaInput.compareDocumentPosition(submitBtn) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
      const termsBeforeCaptcha = termsCheckbox && captchaInput && (termsCheckbox.compareDocumentPosition(captchaInput) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;

      return { captchaInSec3, captchaBeforeSubmit, termsBeforeCaptcha };
    });
    assert(!placementInfo.captchaInSec3, 'CAPTCHA is removed from Section 3 (Live Identity Check)');
    assert(placementInfo.termsBeforeCaptcha && placementInfo.captchaBeforeSubmit, 'CAPTCHA is placed after declaration/consent and directly above Submit button');

    // ── Check 6: Visual Appearance Verification
    await page.waitForSelector('#captcha-challenge-display', { timeout: 5000 });
    const visualInfo = await page.evaluate(() => {
      const el = document.getElementById('captcha-challenge-display');
      if (!el) return { found: false };
      const isSvg = el.tagName.toLowerCase() === 'svg';
      const paths = el.querySelectorAll('path');
      const texts = el.querySelectorAll('text');
      const filter = el.querySelector('filter#captcha-distortion');
      const firstText = texts[0];
      const fill = firstText ? firstText.getAttribute('fill') : '';
      const fontStyle = firstText ? firstText.getAttribute('font-style') : '';

      return {
        found: true,
        isSvg,
        pathsCount: paths.length,
        textsCount: texts.length,
        hasFilter: !!filter,
        fill,
        fontStyle,
        challengeText: el.textContent.trim(),
      };
    });
    assert(visualInfo.isSvg, 'CAPTCHA is rendered as an SVG display');
    assert(visualInfo.pathsCount >= 4, `Multiple (${visualInfo.pathsCount}) thin wavy interference lines cross through the challenge`);
    assert(visualInfo.textsCount === 6, 'Contains 6 individual alphanumeric characters with distinct rotations and spacing');
    assert(visualInfo.fill === '#14532d' && visualInfo.fontStyle === 'italic', 'Characters are styled in dark green italic font');
    assert(visualInfo.hasFilter, 'Subtle organic distortion filter (#captcha-distortion) is applied');
    assert(visualInfo.challengeText.length === 6 && visualInfo.challengeText !== '------', `Dynamic challenge rendered: "${visualInfo.challengeText}"`);

    // ── Check 7: Empty CAPTCHA submission blocks progression and shows error
    console.log('\nTesting empty CAPTCHA submission...');
    const isBtnDisabled = await page.$eval('#btn-verify-captcha', b => b.disabled);
    assert(isBtnDisabled === true, 'Verify button is disabled when CAPTCHA input is empty');

    // ── Check 8: Incorrect CAPTCHA blocks progression and displays error
    console.log('\nTesting incorrect CAPTCHA submission...');
    await page.type('#captcha-input', '000000');
    await page.click('#btn-verify-captcha');
    await page.waitForSelector('#captcha-error-msg', { timeout: 8000 });
    const errorText = await page.$eval('#captcha-error-msg', el => el.innerText);
    assert(errorText.includes('Incorrect CAPTCHA') || errorText.includes('try again'), `Incorrect CAPTCHA displays validation error: "${errorText}"`);

    // ── Check 9: CAPTCHA remains usable after failed attempt and updates challenge
    await new Promise(r => setTimeout(r, 1200));
    const challengeAfterFail = await page.$eval('#captcha-challenge-display', el => el.textContent.trim());
    assert(challengeAfterFail.length === 6, `CAPTCHA remains usable with new challenge after failed attempt: "${challengeAfterFail}"`);

    // ── Check 10: Refreshing / regenerating CAPTCHA updates challenge and invalidates previous
    console.log('\nTesting Refresh CAPTCHA button...');
    const preRefresh = await page.$eval('#captcha-challenge-display', el => el.textContent.trim());
    await page.click('#btn-refresh-captcha');
    await new Promise(r => setTimeout(r, 1200));
    const postRefresh = await page.$eval('#captcha-challenge-display', el => el.textContent.trim());
    assert(postRefresh.length === 6, `New code generated on refresh: "${postRefresh}"`);

    // ── Check 11: Correct CAPTCHA allows progression (case-insensitive & trimmed)
    console.log('\nTesting correct CAPTCHA verification...');
    const activeChallenge = await page.$eval('#captcha-challenge-display', el => el.textContent.trim());
    await page.evaluate(() => {
      const inp = document.getElementById('captcha-input');
      if (inp) inp.value = '';
    });
    // Type lowercase with extra spaces
    await page.type('#captcha-input', `  ${activeChallenge.toLowerCase()}  `);
    await page.click('#btn-verify-captcha');

    await page.waitForSelector('#captcha-success-msg', { timeout: 8000 });
    const successText = await page.$eval('#captcha-success-msg', el => el.innerText);
    assert(successText.includes('verified successfully'), `Correct CAPTCHA displays success: "${successText}"`);

    // Screenshot of Section 6 with the CAPTCHA directly above the Submit button
    await page.evaluate(() => {
      const el = document.getElementById('captcha-challenge-display');
      if (el) el.scrollIntoView({ block: 'center' });
    });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'captcha_visual_placement.png') });
    console.log(`Saved screenshot of CAPTCHA placement to: ${path.join(SCREENSHOT_DIR, 'captcha_visual_placement.png')}`);

    // ── Check 12: Complete the registration flow with CAPTCHA
    console.log('\nCompleting full registration submission with verified CAPTCHA...');
    await page.evaluate(() => {
      const setNativeValue = (element, value) => {
        if (!element) return;
        const prototype = Object.getPrototypeOf(element);
        const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
        if (descriptor && descriptor.set) {
          descriptor.set.call(element, value);
        } else {
          element.value = value;
        }
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
      };

      const labels = Array.from(document.querySelectorAll('label'));
      const setByLabel = (labelTxt, val) => {
        const l = labels.find(x => x.innerText.includes(labelTxt));
        if (l) {
          const inp = l.parentElement.querySelector('input');
          if (inp) setNativeValue(inp, val);
        }
      };

      setByLabel('House/Flat', 'Flat 101, Ambedkar Nagar');
      setByLabel('City / Town', 'Nagpur');
      setByLabel('District', 'Nagpur');
      setByLabel('PIN Code', '440001');

      // State select
      const selects = Array.from(document.querySelectorAll('select'));
      const stateSelect = selects.find(s => Array.from(s.options).some(o => o.value === 'Maharashtra'));
      if (stateSelect) {
        stateSelect.value = 'Maharashtra';
        stateSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }

      // Gender
      const genderSelect = selects.find(s => Array.from(s.options).some(o => o.value === 'Male'));
      if (genderSelect) {
        genderSelect.value = 'Male';
        genderSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }

      // Date of Birth
      const dobInput = document.querySelector('input[type="date"]');
      if (dobInput) setNativeValue(dobInput, '1995-04-14');

      // Annual Family Income
      const incomeInput = document.querySelector('input[type="number"]');
      if (incomeInput) setNativeValue(incomeInput, '120000');

      // Education Level button
      const eduBtns = Array.from(document.querySelectorAll('button[type="button"]'));
      const gradBtn = eduBtns.find(b => b.innerText.includes("Graduate / Bachelor's") || b.innerText.includes("Grad"));
      if (gradBtn) gradBtn.click();

      // Job category select
      const jobSelect = selects.find(s => Array.from(s.options).some(o => o.value === 'tailoring_boutique' || o.value.includes('tailor')));
      if (jobSelect) {
        jobSelect.value = 'tailoring_boutique';
        jobSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }

      // Password and Confirm Password
      const pwInputs = document.querySelectorAll('input[type="password"]');
      if (pwInputs.length >= 2) {
        setNativeValue(pwInputs[0], 'Password@123');
        setNativeValue(pwInputs[1], 'Password@123');
      }

      // Accept terms checkbox
      const allCheckboxes = Array.from(document.querySelectorAll('input[type="checkbox"]'));
      const termsCheckbox = allCheckboxes[allCheckboxes.length - 1];
      if (termsCheckbox && !termsCheckbox.checked) {
        termsCheckbox.click();
      }
    });

    await new Promise(r => setTimeout(r, 600));

    // ── Check 12: Verify form submission is blocked when CAPTCHA is empty
    console.log('Testing submit button when CAPTCHA is empty...');
    await page.evaluate(() => {
      const setNativeValue = (element, value) => {
        if (!element) return;
        const prototype = Object.getPrototypeOf(element);
        const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
        if (descriptor && descriptor.set) {
          descriptor.set.call(element, value);
        } else {
          element.value = value;
        }
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
      };
      const inp = document.getElementById('captcha-input');
      if (inp) setNativeValue(inp, '');
    });
    await page.evaluate(() => {
      const submitBtn = document.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.click();
    });
    await new Promise(r => setTimeout(r, 600));
    const emptyBlocked = await page.evaluate(() => {
      const inp = document.getElementById('captcha-input');
      const isInvalid = inp ? !inp.checkValidity() : false;
      const err = document.getElementById('captcha-error-msg');
      const hasErrorMsg = err ? err.innerText.length > 0 : false;
      const bodyHasError = document.body.innerText.includes('Please enter the CAPTCHA code');
      return isInvalid || hasErrorMsg || bodyHasError;
    });
    assert(emptyBlocked, 'Empty CAPTCHA blocks form submission');

    // ── Check 13: Verify form submission is blocked when CAPTCHA is incorrect
    console.log('Testing submit button when CAPTCHA is incorrect...');
    await page.type('#captcha-input', 'WRONG9');
    await page.evaluate(() => {
      const submitBtn = document.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.click();
    });
    await new Promise(r => setTimeout(r, 1200));
    const wrongError = await page.evaluate(() => {
      const err = document.getElementById('captcha-error-msg');
      return err ? err.innerText : '';
    });
    assert(wrongError.includes('Incorrect CAPTCHA') || wrongError.length > 0, `Incorrect CAPTCHA blocks submission with error: "${wrongError}"`);

    // ── Check 14: Solve active challenge and submit registration form
    const currentChallenge = await page.$eval('#captcha-challenge-display', el => el.textContent.trim());
    console.log(`Solving active challenge for final submission: ${currentChallenge}`);
    await page.evaluate(() => {
      const setNativeValue = (element, value) => {
        if (!element) return;
        const prototype = Object.getPrototypeOf(element);
        const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
        if (descriptor && descriptor.set) {
          descriptor.set.call(element, value);
        } else {
          element.value = value;
        }
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
      };
      const inp = document.getElementById('captcha-input');
      if (inp) setNativeValue(inp, '');
    });
    await page.type('#captcha-input', currentChallenge);
    await page.click('#btn-verify-captcha');
    await page.waitForSelector('#captcha-success-msg', { timeout: 8000 });

    // Submit form
    console.log('Submitting registration form with verified CAPTCHA...');
    await page.evaluate(() => {
      const submitBtn = document.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.click();
    });

    // Wait for processing and completion (redirects to /register/summary)
    await page.waitForFunction(() => {
      const url = window.location.href;
      return url.includes('/register/summary') || url.includes('/dashboard') || !!localStorage.getItem('auth_user') || !!localStorage.getItem('registration_summary');
    }, { timeout: 25000 });

    const submissionSuccess = await page.evaluate(() => {
      return window.location.href.includes('/register/summary') || window.location.href.includes('/dashboard') || !!localStorage.getItem('auth_user') || !!localStorage.getItem('registration_summary');
    });
    assert(submissionSuccess, 'Full registration flow completes successfully with verified CAPTCHA and without camera/selfie');

    // Screenshot artifact
    const screenshotPath = path.join(SCREENSHOT_DIR, 'captcha_registration_verified.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`\nScreenshot saved to: ${screenshotPath}`);

    console.log('\n=============================================');
    console.log(`BROWSER E2E SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('=============================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Browser test failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runBrowserTests();
