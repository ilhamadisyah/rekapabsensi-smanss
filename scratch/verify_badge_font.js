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
  await new Promise(r => setTimeout(r, 2000));

  // Find the first row of schedule cells
  const firstCell = await page.$('td[title*="Ubah shift"]');
  if (firstCell) {
    const parentRow = await firstCell.evaluateHandle(el => el.closest('tr'));
    if (parentRow) {
      await parentRow.asElement().screenshot({
        path: path.join(artifactDir, 'close_up_roster_row.png')
      });
      console.log('Saved close_up_roster_row.png');
    }
  }

  await browser.close();
}

main().catch(console.error);
