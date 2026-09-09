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
  await page.setViewport({ width: 1440, height: 1000 });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

  // Scroll to bottom
  const exportBtn = await page.$('#btn-export-rekap-bottom');
  console.log('Found button outside table:', !!exportBtn);
  if (exportBtn) {
    await page.evaluate((el) => el.scrollIntoView({ behavior: 'instant', block: 'end' }), exportBtn);
  }

  await new Promise((r) => setTimeout(r, 600));

  await page.screenshot({ path: path.join(artifactDir, 'export_button_outside_bottom.png') });
  console.log('Saved export_button_outside_bottom.png');

  if (exportBtn) {
    await exportBtn.click();
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: path.join(artifactDir, 'export_modal_from_outside_btn.png') });
    console.log('Saved export_modal_from_outside_btn.png');
  }

  await browser.close();
}

main().catch(console.error);
