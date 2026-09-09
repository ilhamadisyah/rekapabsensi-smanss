const puppeteer = require('puppeteer-core');

async function run() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000/?tab=schedules', { waitUntil: 'networkidle0' });
  
  const periodBtn = await page.$('button[title="Tampilkan dan pilih periode bulan"]');
  await periodBtn.click();
  await new Promise(r => setTimeout(r, 400));

  const info = await page.evaluate(() => {
    const popover = document.querySelector('.w-72.bg-white.rounded-xl');
    if (!popover) return 'Popover not found';
    const b = (r) => ({ top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), height: Math.round(r.height) });
    const buttons = Array.from(popover.querySelectorAll('button')).map(btn => ({
      text: btn.innerText,
      ...b(btn.getBoundingClientRect())
    }));
    return { popoverRect: b(popover.getBoundingClientRect()), buttons };
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
}

run().catch(console.error);
