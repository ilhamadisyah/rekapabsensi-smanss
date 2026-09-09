const puppeteer = require('puppeteer-core');
const path = require('path');

async function runVisualVerification() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const artifactDir = 'C:\\Users\\user\\.gemini\\antigravity-ide\\brain\\c5a40c93-2b6f-40f5-90c1-beffd82cdd90';

  console.log('Launching browser with Edge...');
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Visit /jadwal - Tab 1: Matriks Roster Harian
  console.log('1. Navigating to http://localhost:3000/jadwal ...');
  await page.goto('http://localhost:3000/jadwal', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(artifactDir, 'jadwal_tab1_matrix_roster.png') });
  console.log('Saved: jadwal_tab1_matrix_roster.png');

  // 2. Click a cell on the roster to open quick popover with custom hours
  console.log('2. Clicking on matrix cell to show popover ...');
  const cell = await page.$('tbody tr:first-child td:nth-child(6)');
  if (cell) {
    await cell.click();
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(artifactDir, 'jadwal_matrix_quick_cell_popover.png') });
    console.log('Saved: jadwal_matrix_quick_cell_popover.png');

    // Switch popover to "Jam Kustom Bebas"
    const customTabBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(b => b.textContent.includes('Jam Kustom Bebas'));
    });
    if (customTabBtn) {
      await customTabBtn.click();
      await new Promise(r => setTimeout(r, 500));
      await page.screenshot({ path: path.join(artifactDir, 'jadwal_cell_popover_custom_hours.png') });
      console.log('Saved: jadwal_cell_popover_custom_hours.png');
    }

    // Close popover
    const cancelBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(b => b.textContent.includes('Batal'));
    });
    if (cancelBtn) await cancelBtn.click();
    await new Promise(r => setTimeout(r, 400));
  }

  // 3. Switch to Tab 2: Daftar Pegawai & Jam Kerja
  console.log('3. Switching to Tab 2: Daftar Pegawai ...');
  const tab2Btn = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find(b => b.textContent.includes('2. Daftar Pegawai'));
  });
  if (tab2Btn) {
    await tab2Btn.click();
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(artifactDir, 'jadwal_tab2_employee_list.png') });
    console.log('Saved: jadwal_tab2_employee_list.png');

    // Click "Atur Jam Kerja" on first employee to open EmployeeScheduleDrawer
    const aturBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(b => b.textContent.includes('Atur Jam Kerja'));
    });
    if (aturBtn) {
      await aturBtn.click();
      await new Promise(r => setTimeout(r, 1000));
      await page.screenshot({ path: path.join(artifactDir, 'jadwal_employee_schedule_drawer.png') });
      console.log('Saved: jadwal_employee_schedule_drawer.png');

      // Close drawer
      const closeDrawer = await page.$('button[class*="hover:bg-slate-200"]');
      if (closeDrawer) await closeDrawer.click();
      await new Promise(r => setTimeout(r, 500));
    }
  }

  // 4. Switch to Tab 3: Master Template Shift
  console.log('4. Switching to Tab 3: Master Shift ...');
  const tab3Btn = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find(b => b.textContent.includes('3. Master Shift'));
  });
  if (tab3Btn) {
    await tab3Btn.click();
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(artifactDir, 'jadwal_tab3_shift_manager.png') });
    console.log('Saved: jadwal_tab3_shift_manager.png');
  }

  // 5. Switch to Tab 4: Blackout Hari Libur
  console.log('5. Switching to Tab 4: Blackout Hari Libur ...');
  const tab4Btn = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find(b => b.textContent.includes('4. Blackout Hari Libur'));
  });
  if (tab4Btn) {
    await tab4Btn.click();
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(artifactDir, 'jadwal_tab4_holiday_manager.png') });
    console.log('Saved: jadwal_tab4_holiday_manager.png');

    // Open "Tambah Hari Libur" modal
    const addHolidayBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(b => b.textContent.includes('Tambah Hari Libur'));
    });
    if (addHolidayBtn) {
      await addHolidayBtn.click();
      await new Promise(r => setTimeout(r, 600));
      await page.screenshot({ path: path.join(artifactDir, 'jadwal_add_holiday_modal.png') });
      console.log('Saved: jadwal_add_holiday_modal.png');

      const cancelH = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(b => b.textContent.includes('Batal'));
      });
      if (cancelH) await cancelH.click();
      await new Promise(r => setTimeout(r, 400));
    }
  }

  // 6. Open Penugasan Massal (Bulk Assign) Modal
  console.log('6. Opening Bulk Assign Modal ...');
  const bulkBtn = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find(b => b.textContent.includes('Penugasan Massal'));
  });
  if (bulkBtn) {
    await bulkBtn.click();
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(artifactDir, 'jadwal_bulk_assign_modal_with_holiday_options.png') });
    console.log('Saved: jadwal_bulk_assign_modal_with_holiday_options.png');

    const cancelB = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(b => b.textContent.includes('Batal'));
    });
    if (cancelB) await cancelB.click();
    await new Promise(r => setTimeout(r, 400));
  }

  // 7. Open Salin Bulan Lalu Modal
  console.log('7. Opening Salin Bulan Lalu Modal ...');
  const copyBtn = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find(b => b.textContent.includes('Salin Bulan Lalu'));
  });
  if (copyBtn) {
    await copyBtn.click();
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(artifactDir, 'jadwal_copy_month_modal.png') });
    console.log('Saved: jadwal_copy_month_modal.png');

    const cancelC = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(b => b.textContent.includes('Batal'));
    });
    if (cancelC) await cancelC.click();
    await new Promise(r => setTimeout(r, 400));
  }

  await browser.close();
  console.log('--- ALL VISUAL SCREENSHOT VERIFICATIONS COMPLETED! ---');
}

runVisualVerification().catch(err => {
  console.error('Visual verification error:', err);
  process.exit(1);
});
