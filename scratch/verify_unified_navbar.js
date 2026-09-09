const puppeteer = require('puppeteer-core');
const path = require('path');

async function testUnifiedNavbar() {
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

  // 1. Visit http://localhost:3000 (Main page default)
  console.log('1. Visiting http://localhost:3000 ...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(artifactDir, 'unified_navbar_matrix_active.png') });
  console.log('Saved: unified_navbar_matrix_active.png');

  // 2. Click "Jadwal & Shift Pegawai" tab
  console.log('2. Clicking "Jadwal & Shift Pegawai" tab ...');
  const scheduleTab = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll('header button'));
    return buttons.find(b => b.textContent.includes('Jadwal & Shift Pegawai'));
  });
  if (scheduleTab) {
    await scheduleTab.click();
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(artifactDir, 'unified_navbar_schedules_active.png') });
    console.log('Saved: unified_navbar_schedules_active.png');
  }

  // 3. Test visiting /jadwal (should redirect to /?tab=schedules)
  console.log('3. Visiting http://localhost:3000/jadwal ...');
  await page.goto('http://localhost:3000/jadwal', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  console.log('Current URL after redirect:', page.url());
  await page.screenshot({ path: path.join(artifactDir, 'unified_navbar_after_redirect.png') });
  console.log('Saved: unified_navbar_after_redirect.png');

  await browser.close();
  console.log('--- ALL UNIFIED NAVBAR TESTS COMPLETE ---');
}

testUnifiedNavbar().catch(err => {
  console.error(err);
  process.exit(1);
});
