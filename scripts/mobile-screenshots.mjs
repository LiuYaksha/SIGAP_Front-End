import { chromium } from '@playwright/test';
const browser = await chromium.launch({ headless: true, channel: 'chromium' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const base = 'http://localhost:5173/#';
async function capture(name) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((i) => i.decode().catch(() => {})));
  });
  await page.screenshot({
    path: `artifacts/screenshots/${name}.png`,
    style: '#toast { visibility: hidden !important; }',
  });
  console.log(
    name,
    await page.evaluate(() => ({
      width: innerWidth,
      scroll: document.documentElement.scrollWidth,
    })),
  );
}
await page.goto(base + 'warga/buat');
await page.locator('[name=title]').fill('Jalan berlubang dekat Pasar Ciburuy');
await capture('mobile-report-category');
await page.getByRole('button', { name: 'Lanjutkan' }).click();
await page.getByRole('button', { name: 'Gunakan foto simulasi' }).click();
await capture('mobile-report-photo');
await page.getByRole('button', { name: 'Lanjutkan' }).click();
await capture('mobile-report-location');
await page.getByRole('button', { name: 'Lanjutkan' }).click();
await page
  .locator('[name=description]')
  .fill('Lubang besar membahayakan pengendara motor dan mengganggu akses warga menuju pasar.');
await page.getByRole('button', { name: 'Lanjutkan' }).click();
await capture('mobile-report-review');
await page.locator('[name=truth]').check();
await capture('mobile-report-review-bottom');
await page.goto(base + 'warga/laporan/LPR-260701');
await capture('mobile-report-detail');
await page.goto(base + 'surveyor/tugas/TGS-3391');
await capture('mobile-task-detail');
await page.getByRole('link', { name: 'Terima & mulai survei' }).click();
await page.getByRole('button', { name: 'Isi foto demo' }).click();
await page.locator('[name=dimensions]').fill('Panjang 2 m, lebar 1 m');
await page
  .locator('[name=notes]')
  .fill('Lubang melebar sejak laporan warga. Tanda darurat telah dipasang oleh RW.');
await page.locator('.m-screen').evaluate((e) => (e.scrollTop = 0));
await capture('mobile-survey-form');
await page.locator('[name=recommendation]').scrollIntoViewIfNeeded();
await capture('mobile-survey-form-bottom');
await page.goto(base + 'warga/sinkron');
await capture('mobile-sync');
await browser.close();
