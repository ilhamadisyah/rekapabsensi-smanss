const puppeteer = require('puppeteer-core');
const path = require('path');

async function main() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const artifactDir = 'C:\\Users\\user\\.gemini\\antigravity-ide\\brain\\c5a40c93-2b6f-40f5-90c1-beffd82cdd90';

  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

  await page.goto('http://localhost:3000/?tab=schedules', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));

  // Click on "Penugasan Massal" button
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await (await b.getProperty('innerText')).jsonValue();
    if (text.includes('Penugasan Massal')) {
      await b.click();
      break;
    }
  }

  await new Promise(r => setTimeout(r, 1000));

  await page.screenshot({ path: path.join(artifactDir, 'bulk_modal_clean_no_division_pills.png') });
  console.log('Saved bulk_modal_clean_no_division_pills.png');

  await browser.close();
}

main().catch(console.error);
