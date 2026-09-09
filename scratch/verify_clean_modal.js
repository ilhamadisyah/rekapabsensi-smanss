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
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

  // Find and click the bottom export button
  const exportBtn = await page.$('#btn-export-rekap-bottom');
  if (exportBtn) {
    await exportBtn.click();
    await new Promise((r) => setTimeout(r, 600));

    // 1. Screenshot default clean modal
    await page.screenshot({ path: path.join(artifactDir, 'export_modal_clean_default.png') });
    console.log('Saved export_modal_clean_default.png');

    // 2. Click option 2: Custom Rentang Tanggal
    await page.evaluate(() => {
      const labels = Array.from(document.querySelectorAll('span'));
      const customSpan = labels.find((s) => s.innerText.includes('2. Custom Rentang Tanggal'));
      if (customSpan) {
        customSpan.closest('div').click();
      }
    });
    await new Promise((r) => setTimeout(r, 500));

    // Screenshot custom clean modal
    await page.screenshot({ path: path.join(artifactDir, 'export_modal_clean_custom.png') });
    console.log('Saved export_modal_clean_custom.png');
  }

  await browser.close();
}

main().catch(console.error);
