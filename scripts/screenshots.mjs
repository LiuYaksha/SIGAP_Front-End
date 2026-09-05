import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
const browser = await chromium.launch({ headless: true, channel: 'chromium' });
await mkdir('artifacts/screenshots', { recursive: true });
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
});
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
for (const [name, route, width, height] of [
  ['desktop-public', 'publik', 1440, 1000],
  ['desktop-dashboard', 'ringkasan', 1440, 1000],
  ['desktop-detail', 'kasus/CB-1790', 1440, 1100],
  ['desktop-queue', 'verifikasi', 1440, 1000],
  ['mobile-preview', 'warga', 1440, 1000],
  ['mobile-home', 'warga', 390, 844],
  ['mobile-surveyor', 'surveyor', 390, 844],
  ['tablet-dashboard', 'ringkasan', 820, 1180],
]) {
  await page.setViewportSize({ width, height });
  await page.goto('http://localhost:5173/#' + route);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      [...document.images].map((i) => {
        i.loading = 'eager';
        return i.decode().catch(() => {});
      }),
    );
  });
  await page.screenshot({
    path: `artifacts/screenshots/${name}.png`,
    fullPage: !name.includes('queue'),
  });
  console.log(
    name,
    await page.evaluate(() => ({
      width: innerWidth,
      scroll: document.documentElement.scrollWidth,
      brokenImages: [...document.images].filter((i) => !i.complete || !i.naturalWidth).length,
    })),
  );
}
console.log('Browser errors:', errors);
await browser.close();
