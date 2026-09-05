import { test, expect } from '@playwright/test';
const readState = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('sigap-demo-v1')));
const go = async (page, route) => {
  await page.goto('/#' + route);
  await page.locator('#app').waitFor();
};
test('public filter, detail privacy, reset, and map/list toggle', async ({ page }) => {
  await go(page, 'publik');
  await expect(page.getByText('37 kasus ditemukan')).toBeVisible();
  await page.locator('[data-filter=village]').selectOption('Ciburuy');
  await expect(page.locator('.case-card')).toHaveCount(6);
  await page.locator('.case-card').first().click();
  await expect(page.getByRole('dialog')).toContainText(
    'Identitas warga dan koordinat presisi tidak ditampilkan',
  );
  await page.keyboard.press('Escape');
  await page.locator('[data-action=view][data-value=daftar]').click();
  await expect(page.locator('.list-mode')).toBeVisible();
  await page.locator('[data-action=reset-filters]').click();
  await expect(page.locator('.case-card')).toHaveCount(37);
});
test('public report enters verification and survives reload', async ({ page }) => {
  await go(page, 'publik');
  await page.getByRole('button', { name: '+ Lapor Masalah' }).click();
  await page.locator('[name=title]').fill('Jalan rusak depan balai desa');
  await page
    .locator('[name=description]')
    .fill('Lubang besar mengganggu akses kendaraan warga menuju balai desa.');
  await page.getByRole('button', { name: 'Kirim laporan', exact: true }).click();
  await expect(page.locator('#toast')).toContainText('berhasil dikirim');
  await go(page, 'verifikasi');
  await expect(page.locator('.card h2').first()).toContainText('Jalan rusak depan balai desa');
  await page.reload();
  await expect(page.locator('.card h2').first()).toContainText('Jalan rusak depan balai desa');
});
test('override, verification and assignment produce linked audit and task', async ({ page }) => {
  await go(page, 'kasus/CB-1790');
  await page.getByRole('button', { name: 'Override beralasan' }).click();
  await page.locator('[name=score]').fill('93');
  await page.locator('[name=reason]').fill('Retakan melebar dan membahayakan akses anak sekolah.');
  await page.getByRole('button', { name: 'Simpan keputusan', exact: true }).click();
  await expect(page.locator('.score-number')).toContainText('93');
  await page.getByRole('button', { name: 'Verifikasi Kasus', exact: true }).click();
  await page.locator('[name=reason]').fill('Bukti dan lokasi telah dikonfirmasi oleh operator.');
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Verifikasi & Prioritaskan', exact: true })
    .click();
  await page.getByRole('button', { name: 'Tugaskan Unit', exact: true }).click();
  await page.locator('[name=unit]').selectOption('Dinas PUPR Wilayah II');
  await page.locator('[name=reason]').fill('Perbaikan struktur perlu segera dimulai.');
  await page.getByRole('button', { name: 'Simpan keputusan', exact: true }).click();
  const s = await readState(page);
  expect(s.cases.find((c) => c.id === 'CB-1790').status).toBe('Sedang Ditangani');
  expect(s.tasks[0].caseId).toBe('CB-1790');
  await go(page, 'audit');
  await expect(page.locator('table')).toContainText('Override Skor Prioritas');
  await expect(page.locator('table')).toContainText('Retakan melebar');
});
test('duplicate comparison changes with selection and merge removes candidate', async ({
  page,
}) => {
  await go(page, 'kasus/CB-1790');
  await page.getByRole('button', { name: 'Gabungkan Kasus', exact: true }).click();
  const source = await page.locator('#merge-source').inputValue();
  await expect(page.locator('#comparison')).toContainText(source);
  await page
    .locator('[name=reason]')
    .fill('Pemeriksaan manual memastikan objek fasilitas yang sama.');
  await page.getByRole('button', { name: 'Konfirmasi Penggabungan' }).click();
  const s = await readState(page);
  expect(s.cases.some((c) => c.id === source)).toBe(false);
  expect(s.cases).toHaveLength(36);
});
test('queue AI, request evidence and reject all update state', async ({ page }) => {
  await go(page, 'verifikasi');
  await page.getByRole('button', { name: 'Jalankan simulasi AI', exact: false }).click();
  await expect(page.locator('#toast')).toContainText('Analisis AI selesai');
  await expect(page.locator('.card').filter({ hasText: 'AI selesai' }).first()).toBeVisible();
  await page.locator('[data-action=request-photo]').first().click();
  await page.locator('[name=reason]').fill('Foto dari sisi struktur belum terlihat jelas.');
  await page.getByRole('button', { name: 'Simpan keputusan', exact: true }).click();
  expect((await readState(page)).cases[0].status).toBe('Perlu Kelengkapan');
  await page.locator('[data-action=reject]').first().click();
  await page.locator('[name=reason]').fill('Bukti tidak sesuai dengan fasilitas yang dilaporkan.');
  await page.getByRole('button', { name: 'Simpan keputusan', exact: true }).click();
  expect((await readState(page)).cases[0].status).toBe('Ditolak');
});
test('GIS filters, marker drawer, layers and zoom respond', async ({ page }) => {
  await go(page, 'peta');
  await page.locator('[data-filter=category]').selectOption('Jembatan');
  await page.locator('.marker').first().click();
  await expect(page.locator('.drawer')).toBeVisible();
  await page.locator('[data-action=close-drawer]').click();
  await page.locator('[data-control=map-mode]').selectOption('Heatmap');
  await expect(page.locator('.map')).toHaveClass(/heat/);
  await page.locator('[data-control=layer]').selectOption('Citra satelit');
  await expect(page.locator('.map')).toHaveClass(/satellite/);
  await page.getByRole('button', { name: 'Perbesar peta' }).click();
  await expect(page.locator('.map-art')).toHaveAttribute('style', /1.25/);
});
test('CSV, GeoJSON, PDF preview and outbox synchronization', async ({ page }) => {
  await go(page, 'ekspor');
  for (const format of ['CSV', 'GeoJSON']) {
    const download = page.waitForEvent('download');
    await page.locator(`[data-action=export][data-value="${format}"]`).click();
    expect((await download).suggestedFilename()).toMatch(
      format === 'CSV' ? /\.csv$/ : /\.geojson$/,
    );
  }
  await page.locator('[data-value=PDF]').click();
  await expect(page.getByRole('dialog')).toContainText('Simpan sebagai PDF');
  await expect(page.getByRole('dialog').locator('tbody tr')).toHaveCount(37);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Jalankan Sinkronisasi Manual' }).click();
  await expect(page.locator('#toast')).toContainText('Simulasi sinkronisasi berhasil.');
  expect((await readState(page)).sync).toBeTruthy();
});
test('task progress can be submitted and closed after verification', async ({ page }) => {
  await go(page, 'tugas');
  await page.locator('[data-action=task-detail]').first().click();
  await page.locator('[name=progress]').fill('100');
  await page.locator('[name=reason]').fill('Pekerjaan perbaikan telah diselesaikan di lapangan.');
  await page.getByRole('button', { name: 'Simpan progres' }).click();
  await page.locator('[data-action=task-close]').first().click();
  await page.locator('[name=reason]').fill('Dokumentasi hasil pekerjaan telah diperiksa lengkap.');
  await page.getByRole('button', { name: 'Verifikasi & tutup kasus' }).click();
  const s = await readState(page);
  expect(s.tasks[0].closed).toBe(true);
  expect(s.cases.find((c) => c.id === s.tasks[0].caseId).status).toBe('Selesai');
});
test('mobile citizen offline report, review, synchronization and operator queue', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await go(page, 'warga');
  await page.locator('[data-mobile=toggle-offline]').click();
  await page.getByRole('link', { name: 'Buat laporan', exact: false }).click();
  await page.locator('[name=title]').fill('Jalan desa rusak dekat sekolah');
  await page.getByRole('button', { name: 'Lanjutkan' }).click();
  await page.getByRole('button', { name: 'Gunakan foto simulasi' }).click();
  await page.getByRole('button', { name: 'Lanjutkan' }).click();
  await page.getByRole('button', { name: 'Lanjutkan' }).click();
  await page
    .locator('[name=description]')
    .fill('Lubang besar menyebabkan akses siswa menuju sekolah terganggu.');
  await page.getByRole('button', { name: 'Lanjutkan' }).click();
  await expect(page.getByRole('heading', { name: 'Review laporan' })).toBeVisible();
  await page.locator('[name=truth]').check();
  await page.getByRole('button', { name: 'Simpan ke antrean', exact: true }).click();
  await expect(page.locator('.m-screen .notice')).toContainText('Menunggu sinkronisasi');
  expect((await readState(page)).mobile.outbox).toHaveLength(1);
  await page.getByRole('link', { name: 'Sinkron', exact: false }).click();
  await page.locator('[data-mobile=toggle-offline]').first().click();
  await page.getByRole('button', { name: 'Sinkronkan sekarang' }).click();
  await expect(page.locator('#toast')).toContainText('Sinkronisasi berhasil');
  expect((await readState(page)).mobile.outbox).toHaveLength(0);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await go(page, 'verifikasi');
  await expect(page.locator('.card h2').first()).toContainText('Jalan desa rusak dekat sekolah');
});
test('surveyor draft survives reload and three-photo result reaches operator', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await go(page, 'surveyor/tugas/TGS-3391');
  await page.locator('[data-survey-check="0"]').check();
  await page.getByRole('link', { name: 'Terima & mulai survei' }).click();
  await page.getByRole('button', { name: 'Isi foto demo' }).click();
  await page.locator('[name=dimensions]').fill('Panjang 2 m, lebar 1 m');
  await page
    .locator('[name=notes]')
    .fill('Lubang telah diukur dan dipasang tanda pengaman sementara.');
  await page.getByRole('button', { name: 'Simpan draft', exact: true }).click();
  await page.reload();
  await expect(page.locator('[name=dimensions]')).toHaveValue('Panjang 2 m, lebar 1 m');
  await page.getByRole('button', { name: 'Kirim hasil survei' }).click();
  await expect(page.getByRole('heading', { name: 'Tugas hari ini' })).toBeVisible();
  const s = await readState(page);
  expect(s.tasks[0].progress).toBe(100);
  expect(s.tasks[0].survey.photos).toHaveLength(3);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await go(page, 'audit');
  await expect(page.locator('table')).toContainText('Hasil Survei Lapangan');
  await expect(page.locator('table')).toContainText('Dedi Darmawan');
});
test('responsive routes render without overflow or runtime errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  for (const size of [
    { width: 1440, height: 1000 },
    { width: 820, height: 1180 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(size);
    for (const route of [
      'publik',
      'ringkasan',
      'kasus/CB-1790',
      'verifikasi',
      'peta',
      'tugas',
      'analitik',
      'ekspor',
      'audit',
      'administrasi',
      'warga',
      'surveyor',
    ]) {
      await go(page, route);
      await expect(page.locator('#app')).not.toBeEmpty();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        route + ' @ ' + size.width,
      ).toBe(true);
    }
  }
  expect(errors).toEqual([]);
});
