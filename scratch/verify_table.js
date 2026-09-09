const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

async function main() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  console.log('Launching Edge from:', edgePath);

  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 30000 });

  // Evaluate column positions
  const results = await page.evaluate(() => {
    const thCol1 = document.querySelector('.header-row-1 .sticky-col-1');
    const thCol2 = document.querySelector('.header-row-1 .sticky-col-2');
    const thCol3 = document.querySelector('.header-row-1 .sticky-col-3');
    
    // Header Row 1 day 1
    const thDay1Row1 = document.querySelectorAll('.header-row-1 th')[3];
    // Header Row 2 day 1
    const thDay1Row2 = document.querySelectorAll('.header-row-2 th')[3];

    // First employee row
    const firstRow = document.querySelector('tbody tr');
    const tdCol1 = firstRow ? firstRow.querySelector('.sticky-col-1') : null;
    const tdCol2 = firstRow ? firstRow.querySelector('.sticky-col-2') : null;
    const tdCol3 = firstRow ? firstRow.querySelector('.sticky-col-3') : null;
    const tdDay1 = firstRow ? firstRow.querySelectorAll('td')[3] : null;

    const getRect = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        text: el.innerText.replace(/\n/g, ' '),
        left: r.left,
        right: r.right,
        width: r.width,
        top: r.top,
        bottom: r.bottom,
        height: r.height
      };
    };

    return {
      thCol1: getRect(thCol1),
      thCol2: getRect(thCol2),
      thCol3: getRect(thCol3),
      thDay1Row1: getRect(thDay1Row1),
      thDay1Row2: getRect(thDay1Row2),
      tdCol1: getRect(tdCol1),
      tdCol2: getRect(tdCol2),
      tdCol3: getRect(tdCol3),
      tdDay1: getRect(tdDay1)
    };
  });

  console.log('Results:', JSON.stringify(results, null, 2));

  // 1. Zoomed screenshot of Column 1 (#) and Column 2 to verify R17 is gone
  const col1ScreenshotPath = path.join(__dirname, 'col1_clean_verified.png');
  await page.screenshot({ 
    path: col1ScreenshotPath,
    clip: { x: 80, y: 500, width: 450, height: 320 }
  });
  console.log('Saved col1 clean screenshot to:', col1ScreenshotPath);

  // 2. Full table view
  const fullScreenshotPath = path.join(__dirname, 'table_final_verified.png');
  await page.screenshot({ 
    path: fullScreenshotPath,
    clip: { x: 80, y: 350, width: 1240, height: 500 }
  });
  console.log('Saved final table screenshot to:', fullScreenshotPath);

  await browser.close();
}

main().catch(err => {
  console.error('Error running verification:', err);
  process.exit(1);
});
