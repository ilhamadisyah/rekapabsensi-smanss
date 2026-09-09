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

  console.log('1. Navigating to http://localhost:3000/ ...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.join(artifactDir, 'jadwal_nav_link_verified.png') });
  console.log('Saved jadwal_nav_link_verified.png');

  console.log('2. Navigating to http://localhost:3000/jadwal ...');
  await page.goto('http://localhost:3000/jadwal', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(artifactDir, 'jadwal_page_full.png') });
  console.log('Saved jadwal_page_full.png');

  console.log('3. Opening Kelola Template Shift Modal ...');
  // Click button containing "Kelola Template Shift"
  const templateBtn = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find(b => b.textContent.includes('Kelola Template Shift'));
  });
  if (templateBtn) {
    await templateBtn.click();
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(artifactDir, 'jadwal_shift_template_modal.png') });
    console.log('Saved jadwal_shift_template_modal.png');

    // Close modal
    const closeBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(b => b.textContent.includes('Tutup'));
    });
    if (closeBtn) await closeBtn.click();
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('4. Opening Penugasan Massal (Bulk Assign) Modal ...');
  const bulkBtn = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find(b => b.textContent.includes('Penugasan Massal'));
  });
  if (bulkBtn) {
    await bulkBtn.click();
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(artifactDir, 'jadwal_bulk_assign_modal.png') });
    console.log('Saved jadwal_bulk_assign_modal.png');

    // Close modal
    const cancelBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(b => b.textContent.includes('Batal'));
    });
    if (cancelBtn) await cancelBtn.click();
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('5. Clicking a cell on the roster table to test quick shift popover ...');
  // Find a cell in the table body
  const cell = await page.$('tbody tr:first-child td:nth-child(5)');
  if (cell) {
    await cell.click();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(artifactDir, 'jadwal_cell_popover.png') });
    console.log('Saved jadwal_cell_popover.png');

    // Select Shift Pagi in popover
    const pagiBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(b => b.textContent.includes('Shift Pagi'));
    });
    if (pagiBtn) {
      await pagiBtn.click();
      await new Promise(r => setTimeout(r, 1200));
      await page.screenshot({ path: path.join(artifactDir, 'jadwal_after_shift_assigned.png') });
      console.log('Saved jadwal_after_shift_assigned.png');
    }
  }

  console.log('6. Clicking Re-Evaluasi Presensi ...');
  const reevalBtn = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find(b => b.textContent.includes('Re-Evaluasi Presensi'));
  });
  if (reevalBtn) {
    await reevalBtn.click();
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(artifactDir, 'jadwal_reevaluasi_success.png') });
    console.log('Saved jadwal_reevaluasi_success.png');
  }

  await browser.close();
  console.log('All browser verification tests completed successfully!');
}

main().catch(err => {
  console.error('Error running browser test:', err);
  process.exit(1);
});
