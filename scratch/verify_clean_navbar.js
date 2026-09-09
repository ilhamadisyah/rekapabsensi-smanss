 const puppeteer = require('puppeteer-core');
const path = require('path');

async function main() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const artifactDir = 'C:\\Users\\user\\.gemini\\antigravity-ide\\brain\\0647c268-2254-46bc-8758-cf30223ffe50';

  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 800 });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

  await page.screenshot({ path: path.join(artifactDir, 'navbar_clean_no_duplicate_month.png') });
  console.log('Saved navbar_clean_no_duplicate_month.png');

  await browser.close();
}

main().catch(console.error);
