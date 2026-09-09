const puppeteer = require('puppeteer-core');

async function main() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto('http://localhost:3000/?tab=schedules', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  // Open modal
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await (await b.getProperty('innerText')).jsonValue();
    if (text.includes('Penugasan Massal')) {
      await b.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 500));

  // Type inside the modal dialog's search input
  const modalInput = await page.$('.fixed.inset-0 input[placeholder*="Cari nama pegawai"]');
  if (modalInput) {
    await modalInput.type('KURNIAWATI');
    await new Promise(r => setTimeout(r, 400));

    // Get items inside the modal's list container
    const items = await page.$$eval('.fixed.inset-0 .max-h-52 > div', els => els.map(e => e.innerText.trim()));
    console.log('SUCCESS! Filtered items in modal for KURNIAWATI:', items);
  } else {
    console.log('Modal input not found!');
  }

  await browser.close();
}

main().catch(console.error);
