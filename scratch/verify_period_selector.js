const puppeteer = require('puppeteer-core');
const path = require('path');

async function main() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const artifactDir = 'C:\\Users\\user\\.gemini\\antigravity-ide\\brain\\c5a40c93-2b6f-40f5-90c1-beffd82cdd90';

  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('Navigating to http://localhost:3000/?tab=schedules...');
  await page.goto('http://localhost:3000/?tab=schedules', { waitUntil: 'networkidle0' });
  await page.waitForSelector('table', { timeout: 10000 });

  // Initial screenshot
  await page.screenshot({ path: path.join(artifactDir, 'schedules_initial_september.png') });
  console.log('1. Saved schedules_initial_september.png');

  // Find the button with text "Periode:"
  const periodButton = await page.$('button[title="Tampilkan dan pilih periode bulan"]');
  if (!periodButton) {
    throw new Error('Periode button not found!');
  }

  const initialButtonText = await page.evaluate(el => el.textContent.trim(), periodButton);
  console.log('Initial button text:', initialButtonText);

  // Click the period button to open dropdown
  console.log('Clicking period button...');
  await periodButton.click();
  await new Promise(r => setTimeout(r, 400));

  // Capture screenshot of the open dropdown
  await page.screenshot({ path: path.join(artifactDir, 'schedules_month_dropdown_open.png') });
  console.log('2. Saved schedules_month_dropdown_open.png');

  // Click "Oktober" button inside the dropdown
  console.log('Selecting Oktober...');
  const buttons = await page.$$('button');
  let oktoberBtn = null;
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent.trim(), btn);
    if (text === 'Oktober') {
      oktoberBtn = btn;
      break;
    }
  }

  if (!oktoberBtn) {
    throw new Error('Oktober button not found in dropdown!');
  }

  await oktoberBtn.click();
  await new Promise(r => setTimeout(r, 1200));

  // Check updated button text and header
  const updatedButton = await page.$('button[title="Tampilkan dan pilih periode bulan"]');
  const updatedButtonText = await page.evaluate(el => el.textContent.trim(), updatedButton);
  console.log('Updated button text:', updatedButtonText);

  // Check if day 31 exists in table header
  const hasDay31 = await page.evaluate(() => {
    const ths = Array.from(document.querySelectorAll('th'));
    return ths.some(th => th.textContent.includes('31'));
  });
  console.log('Table has day 31 for Oktober:', hasDay31);

  // Screenshot after selecting Oktober
  await page.screenshot({ path: path.join(artifactDir, 'schedules_month_selected_oktober.png') });
  console.log('3. Saved schedules_month_selected_oktober.png');

  // Switch to Matriks tab to check sync
  console.log('Checking Matriks tab synchronization...');
  const allButtons = await page.$$('button');
  for (const btn of allButtons) {
    const text = await page.evaluate(el => el.textContent.trim(), btn);
    if (text.includes('Matriks Presensi')) {
      await btn.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(artifactDir, 'matriks_synced_to_oktober.png') });
  console.log('4. Saved matriks_synced_to_oktober.png');

  await browser.close();
  console.log('Verification completed successfully!');
}

main().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
