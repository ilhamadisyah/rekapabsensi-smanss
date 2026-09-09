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
  await page.setViewport({ width: 1440, height: 960 });

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 30000 });

  // 1. Scroll down to bottom of table and capture bottom right button
  const exportBtn = await page.$('#btn-export-rekap-bottom');
  console.log('Found export button at bottom-right:', !!exportBtn);

  if (exportBtn) {
    await page.evaluate((el) => el.scrollIntoView({ behavior: 'instant', block: 'center' }), exportBtn);
    await page.screenshot({
      path: path.join(artifactDir, 'export_button_bottom_right.png'),
    });
    console.log('Saved export_button_bottom_right.png');

    // 2. Click the export button to open ExportModal
    await exportBtn.click();
    await new Promise((r) => setTimeout(r, 600));

    // Capture modal default view (Log Tersedia)
    await page.screenshot({
      path: path.join(artifactDir, 'export_modal_log_tersedia.png'),
    });
    console.log('Saved export_modal_log_tersedia.png');

    // 3. Click option 2: Custom Rentang Tanggal
    await page.evaluate(() => {
      const labels = Array.from(document.querySelectorAll('label'));
      const customLabel = labels.find(l => l.innerText.includes('2. Custom Rentang Tanggal'));
      if (customLabel) customLabel.click();
    });
    await new Promise((r) => setTimeout(r, 500));

    // Capture modal with custom range open
    await page.screenshot({
      path: path.join(artifactDir, 'export_modal_custom_range.png'),
    });
    console.log('Saved export_modal_custom_range.png');
  }

  await browser.close();
  console.log('Verification completed successfully!');
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
