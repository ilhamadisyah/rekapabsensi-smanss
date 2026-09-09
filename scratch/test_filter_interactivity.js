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
  await new Promise(r => setTimeout(r, 1500));

  // Check initial count
  let countText = await page.$eval('div:has(> span.font-bold)', el => el.innerText).catch(() => 'N/A');
  console.log('Initial text:', countText);

  // Click on "Guru" pill
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await (await b.getProperty('innerText')).jsonValue();
    if (text === 'Guru') {
      await b.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 500));
  let guruRows = await page.$$eval('tbody tr', rows => rows.length);
  console.log('Guru rows count:', guruRows);

  // Click on "Tata Usaha" pill
  for (const b of buttons) {
    const text = await (await b.getProperty('innerText')).jsonValue();
    if (text === 'Tata Usaha') {
      await b.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 500));
  let tuRows = await page.$$eval('tbody tr', rows => rows.length);
  console.log('Tata Usaha rows count:', tuRows);

  // Search for an employee name
  await page.type('input[placeholder*="Cari nama pegawai"]', 'ISWAN');
  await new Promise(r => setTimeout(r, 500));
  let searchRows = await page.$$eval('tbody tr', rows => rows.length);
  console.log('Search "ISWAN" count:', searchRows);

  await browser.close();
}

main().catch(console.error);
