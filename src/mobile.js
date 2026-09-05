import { categories, villages, log as appendLog } from './store.js';
function log(state, caseId, action, before, after, reason) {
  const actor = /Survei|Surveyor/.test(action)
    ? 'Dedi Darmawan · Surveyor'
    : 'Warga · Pelapor (privat)';
  appendLog(state, caseId, action, before, after, reason, actor);
}
let ctx,
  screen = 'warga',
  sub = '',
  itemId = '',
  step = 1,
  taskView = 'Semua',
  reportView = 'Semua',
  busy = false;
const $ = (s) => document.querySelector(s),
  escape = (v) =>
    String(v ?? '').replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
const state = () => ctx.getState(),
  mobile = () => {
    const s = state();
    if (!s.mobile)
      s.mobile = {
        offline: false,
        reports: [
          {
            id: 'LPR-260701',
            caseId: 'CB-1791',
            status: 'Terkirim',
            title: 'Jalan berlubang dekat Pasar Ciburuy',
            date: '17 Jul 2026',
          },
          {
            id: 'LPR-260702',
            caseId: 'CB-1790',
            status: 'Terkirim',
            title: 'Jembatan penghubung Dusun Kaler retak',
            date: '16 Jul 2026',
          },
        ],
        outbox: [],
        downloaded: ['TGS-3391'],
        draft: {
          category: 'Jalan',
          village: 'Ciburuy',
          title: '',
          description: '',
          severity: 'Berat',
          lat: '-6.8721',
          lng: '107.5314',
        },
        surveys: {},
      };
    return s.mobile;
  };
const b = (label, action, value = '', cls = '') =>
  `<button type="button" class="${cls}" data-mobile="${action}" data-value="${escape(value)}">${label}</button>`;
const opts = (arr, value) =>
  arr.map((v) => `<option ${v === value ? 'selected' : ''}>${escape(v)}</option>`).join('');
const link = (route, label, cls = '') => `<a class="${cls}" href="#${route}">${label}</a>`;
const icons = {
  home: '<path d="M3 10L12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
  report: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3h6v3H9zM9 11h6m-6 4h6"/>',
  map: '<path d="M3 5l6-2 6 2 6-2v16l-6 2-6-2-6 2zm6-2v16m6-14v16"/>',
  sync: '<path d="M20 8a8 8 0 0 0-14-3L3 8m0-5v5h5m-4 8a8 8 0 0 0 14 3l3-3m0 5v-5h-5"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  arrow: '<path d="M19 12H5m6-6l-6 6 6 6"/>',
  pin: '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0z"/><circle cx="12" cy="10" r="2"/>',
};
const icon = (n) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[n] || icons.report}</svg>`;
const badge = (s) => ctx.badge(s),
  photo = (c, i) => ctx.evidence(c, i),
  cBy = (id) => state().cases.find((c) => c.id === id),
  tBy = (id) => state().tasks.find((t) => t.id === id);
function statusPill() {
  return b(
    `<i></i>${mobile().offline ? 'Offline' : 'Online'}`,
    'toggle-offline',
    '',
    `connection ${mobile().offline ? 'offline' : ''}`,
  );
}
function top(title, subtitle = '', back = '') {
  return `<div class="m-titlebar">${back ? link(back, icon('arrow'), 'back') : ''}<div><h1>${title}</h1>${subtitle ? `<p>${subtitle}</p>` : ''}</div>${statusPill()}</div>`;
}
function caseTile(c) {
  return `<a class="m-case" href="#warga/kasus/${c.id}"><div class="m-case-photo">${photo(c)}</div><div class="m-case-body"><div class="row between"><span class="m-category">${c.category}</span><span class="muted">${c.reports} laporan</span></div><h3>${escape(c.title)}</h3><p>${icon('pin')} Desa ${escape(c.village)}</p>${badge(c.status)}</div></a>`;
}
function home() {
  const m = mobile();
  return (
    top('Desa Ciburuy', 'Wilayah aktif · Kecamatan Cisarua') +
    `<div class="m-main"><div class="m-greeting"><span>Halo, Sari 👋</span><h2>Desa lebih baik,<br>dimulai dari kepedulian kita.</h2></div><a class="m-report-cta" href="#warga/buat"><span>${icon('plus')}</span><div><b>Buat laporan</b><small>Foto, lokasi, dan kondisi lapangan</small></div><b>↗</b></a>${m.outbox.length ? `<div class="notice amber"><b>${m.outbox.length} kiriman belum tersinkron</b><p>Aman di perangkat. Kirim saat koneksi tersedia.</p>${link('warga/sinkron', 'Buka Pusat Sinkronisasi →')}</div>` : `<div class="m-sync-ok">${icon('sync')} Semua laporan tersinkron <span>✓</span></div>`}<section><div class="m-section-head"><h2>Laporan saya</h2>${link('warga/laporan', 'Lihat semua →')}</div><div class="m-stats">${[
      [
        'Perlu tindakan',
        m.reports.filter(
          (r) => r.status === 'Antrean' || cBy(r.caseId)?.status === 'Perlu Kelengkapan',
        ).length,
        '#b8730a',
      ],
      [
        'Diproses',
        m.reports.filter((r) => r.status === 'Terkirim' && cBy(r.caseId)?.status !== 'Selesai')
          .length,
        '#2563eb',
      ],
      ['Selesai', m.reports.filter((r) => cBy(r.caseId)?.status === 'Selesai').length, '#0f7a6b'],
    ]
      .map(
        ([s, n, col]) =>
          `<a href="#warga/laporan" class="card"><strong style="color:${col}">${n}</strong><span>${s}</span></a>`,
      )
      .join(
        '',
      )}</div></section><section><div class="m-section-head"><h2>Kasus di sekitar Anda</h2>${link('warga/peta', 'Buka peta ↗')}</div><div class="m-case-stack">${state().cases.slice(0, 3).map(caseTile).join('')}</div></section><div class="m-privacy">${icon('user')} Identitas Anda aman. Laporan publik ditampilkan tanpa data pribadi.</div></div>`
  );
}
function reportForm() {
  const d = mobile().draft;
  const names = ['Kategori', 'Bukti foto', 'Lokasi', 'Kondisi', 'Review'];
  return (
    top(
      step === 5 ? 'Review laporan' : 'Buat laporan',
      `Langkah ${step} dari 5 · ${names[step - 1]}`,
      'warga',
    ) +
    `<div class="m-stepper">${names.map((n, i) => `<i class="${i < step ? 'done' : ''}" title="${n}"></i>`).join('')}</div><form id="mobile-report" class="m-main" data-step="${step}">${step === 1 ? `<div><h2>Apa yang ingin Anda laporkan?</h2><p>Pilih jenis fasilitas yang mengalami kerusakan.</p></div><div class="m-category-grid">${categories.map((c, i) => `<label class="m-option ${d.category === c ? 'selected' : ''}"><input type="radio" name="category" value="${c}" ${d.category === c ? 'checked' : ''}>${['▰', '╫', '◉', '☼', '≈'][i]}<span>${c}</span></label>`).join('')}</div><label>Judul laporan<input name="title" required minlength="8" maxlength="120" placeholder="Contoh: Jalan berlubang dekat pasar" value="${escape(d.title)}"></label>` : step === 2 ? `<div><h2>Tunjukkan kondisi di lapangan</h2><p>Ambil foto yang jelas tanpa wajah atau identitas warga.</p></div><div class="m-photo-preview">${photo({ category: d.category, id: 'BUKTI DEMO', photo: d.photo })}</div><label class="m-upload">${icon('plus')} Pilih foto dari perangkat<input type="file" name="photo" accept="image/png,image/jpeg,image/webp" capture="environment"></label><small>PNG, JPG, WebP · maks. 1 MB. Anda juga dapat menggunakan foto simulasi yang tersedia.</small>${b('Gunakan foto simulasi', 'demo-photo', '', 'secondary')}` : step === 3 ? `<div><h2>Di mana lokasinya?</h2><p>Pilih desa dan titik lokasi fasilitas pada peta simulasi.</p></div><label>Desa<select name="village">${opts(villages, d.village)}</select></label><div id="m-location-map">${ctx.map([{ ...state().cases[0], x: 48, y: 45 }], false, true)}</div><div class="grid equal"><label>Lintang<input name="lat" type="number" step="any" min="-90" max="90" required value="${d.lat}"></label><label>Bujur<input name="lng" type="number" step="any" min="-180" max="180" required value="${d.lng}"></label></div><div class="notice">⌖ Titik simulasi dapat digeser dengan mengetuk peta. Koordinat publik akan digeneralisasi.</div>` : step === 4 ? `<div><h2>Ceritakan kondisi yang Anda lihat</h2><p>Detail membantu petugas memprioritaskan penanganan.</p></div><label>Tingkat kerusakan<select name="severity">${opts(['Ringan', 'Berat', 'Kritis'], d.severity)}</select></label><label>Deskripsi & dampak<textarea name="description" required minlength="15" maxlength="1000" placeholder="Jelaskan ukuran kerusakan, risiko, dan warga yang terdampak…">${escape(d.description)}</textarea></label><div class="notice">Sampaikan kondisi sesuai pengamatan. Hindari mencantumkan nama, nomor telepon, atau data pribadi.</div>` : review(d)}<div class="m-form-actions">${step > 1 ? b('← Kembali', 'report-back') : ''}<button class="primary" type="submit">${step === 5 ? (mobile().offline ? 'Simpan ke antrean' : 'Kirim laporan') : 'Lanjutkan →'}</button></div></form>`
  );
}
function review(d) {
  const candidate = state().cases.find((c) => c.category === d.category && c.village === d.village);
  return `${candidate ? `<div class="m-duplicate"><b>✧ Kasus serupa ditemukan di desa ini</b><p>${escape(candidate.title)}</p><small>${candidate.reports} laporan · kandidat simulasi</small><div class="m-radio-row"><label><input type="radio" name="merge" value="${candidate.id}" ${d.merge === candidate.id ? 'checked' : ''}>Tambahkan bukti</label><label><input type="radio" name="merge" value="" ${d.merge !== candidate.id ? 'checked' : ''}>Buat terpisah</label></div></div>` : ''}<div class="eyebrow">RINGKASAN LAPORAN</div><section class="card m-review-card">${photo({ id: 'DEMO', category: d.category, photo: d.photo })}<div class="row between" style="margin-top:12px">${badge(d.category)}<small>Kondisi: ${d.severity}</small></div><h2 style="margin:12px 0">${escape(d.title)}</h2><p>${escape(d.description)}</p><div class="m-detail-row"><span>Lokasi</span><b>Desa ${escape(d.village)}</b></div><div class="m-detail-row"><span>Koordinat</span><small class="mono">${d.lat}, ${d.lng}</small></div></section><section class="card"><div class="row between"><div><h3>Identitas saya di publik</h3><p>Privat · hanya petugas yang melihat</p></div><span class="privacy-lock">◈</span></div><label class="m-check" style="margin-top:15px"><input type="checkbox" name="truth" required>Saya menyatakan informasi ini benar sesuai kondisi yang saya lihat.</label></section>${mobile().offline ? '<div class="notice amber">Tidak ada koneksi (simulasi). Laporan akan tersimpan dalam antrean lokal.</div>' : ''}`;
}
function myReports() {
  const reports = mobile().reports.filter(
    (r) =>
      reportView === 'Semua' ||
      (reportView === 'Antrean' ? r.status === 'Antrean' : cBy(r.caseId)?.status === 'Selesai'),
  );
  return (
    top('Laporan saya', `${mobile().reports.length} laporan · identitas terlindungi`) +
    `<div class="m-main"><div class="m-pills">${['Semua', 'Antrean', 'Selesai'].map((v) => b(v, 'report-filter', v, reportView === v ? 'selected' : '')).join('')}</div>${reports.map((r) => `<a href="#warga/laporan/${r.id}" class="card m-report-row"><div class="row between"><small class="mono">${r.id}</small>${badge(r.status === 'Antrean' ? 'Menunggu sinkronisasi' : cBy(r.caseId)?.status || 'Terkirim')}</div><h3>${escape(r.title)}</h3><p>${r.date} · Desa ${escape(cBy(r.caseId)?.village || 'Ciburuy')}</p><span class="m-link">Lihat perkembangan →</span></a>`).join('') || '<div class="empty">Belum ada laporan di kategori ini.</div>'}${link('warga/buat', '+ Buat laporan baru', 'm-wide-button primary')}</div>`
  );
}
function reportDetail() {
  const r = mobile().reports.find((r) => r.id === itemId),
    c = cBy(r?.caseId || itemId);
  if (!r && !c) return top('Laporan tidak ditemukan', '', 'warga/laporan');
  return (
    top(r ? 'Detail laporan' : 'Detail kasus', r?.id || c.id, 'warga/laporan') +
    `<div class="m-main"><div class="notice ${r?.status === 'Antrean' ? 'amber' : ''}"><b>${r?.status === 'Antrean' ? 'Menunggu sinkronisasi' : escape(c?.status || 'Laporan diterima')}</b><p>${r?.status === 'Antrean' ? 'Laporan aman di perangkat. Buka Sinkron saat online.' : 'Laporan Anda membantu petugas memahami kondisi fasilitas.'}</p></div><h2>${escape(r?.title || c.title)}</h2>${photo(c || { category: 'Jalan', id: r.id })}<section class="card"><div class="eyebrow">KASUS TERKAIT</div><h3>${escape(c?.title || 'Menunggu pengiriman laporan')}</h3><p>${c?.id || 'Belum mendapat ID kasus'} · ${c?.reports || 1} laporan pendukung</p></section><section class="card"><h2>Perkembangan laporan</h2>${c ? ctx.timeline(c.id) : '<div class="timeline"><div class="event"><h3>Disimpan di perangkat</h3><p>Menunggu koneksi untuk mengirim laporan.</p></div></div>'}</section>${c?.status === 'Perlu Kelengkapan' ? `<form id="mobile-add-evidence" data-case="${c.id}" class="card"><h2>Petugas meminta foto tambahan</h2><label>Foto baru<input type="file" name="photo" accept="image/png,image/jpeg,image/webp" required></label><button class="primary" type="submit">Kirim bukti tambahan</button></form>` : ''}<div class="m-privacy">${icon('user')} Hanya petugas berwenang dapat mengakses detail pelapor.</div></div>`
  );
}
function syncPage() {
  const m = mobile();
  return (
    top('Pusat sinkronisasi', `${m.outbox.length} kiriman menunggu`) +
    `<div class="m-main"><section class="card m-sync-card"><span class="m-sync-symbol">${icon('sync')}</span><h2>${m.offline ? 'Anda sedang offline' : 'Siap menyinkronkan data'}</h2><p>${m.offline ? 'Mode offline simulasi aktif. Aktifkan Online untuk mengirim antrean.' : 'Kirim laporan dan hasil survei ke ruang kerja petugas.'}</p>${b(m.offline ? 'Aktifkan Online' : 'Simulasikan Offline', 'toggle-offline', '', 'secondary')}</section>${m.outbox.map((o) => `<section class="card"><div class="row between"><b>${o.kind === 'report' ? 'Laporan warga' : 'Hasil survei'}</b>${badge('Menunggu')}</div><p style="margin-top:10px">${escape(o.title)}</p><small class="mono">${o.id}</small></section>`).join('') || '<div class="notice">✓ Tidak ada kiriman tertunda. Semua data pada perangkat telah tersinkron.</div>'}${b(busy ? 'Menyinkronkan…' : 'Sinkronkan sekarang', 'sync-mobile', '', 'primary m-wide-button')}<p class="m-caption">Simulasi frontend · antrean disimpan di browser ini.</p></div>`
  );
}
function taskCard(t) {
  const c = cBy(t.caseId),
    ready = mobile().downloaded.includes(t.id);
  return `<section class="card m-task-card ${c?.severity === 'Kritis' ? 'urgent' : ''}"><a href="#surveyor/tugas/${t.id}"><div class="row between"><small class="mono">${t.id}</small>${badge(t.closed ? 'Selesai' : c?.sla || 'Normal')}</div><h2>${escape(c?.title)}</h2><p>${icon('pin')} Desa ${escape(c?.village)} · ${t.type}</p><div class="row between"><span class="muted">${escape(t.unit)}</span><b class="mono">${t.progress}%</b></div><div class="progress"><i style="width:${t.progress}%"></i></div></a><div class="row between"><small>Batas: ${t.deadline}</small>${ready ? '<span class="m-link">✓ Data tersedia lokal</span>' : b('↓ Simpan tugas', 'download-task', t.id)}</div></section>`;
}
function taskHome() {
  const tasks = state().tasks.filter(
    (t) =>
      taskView === 'Semua' ||
      (taskView === 'Belum disimpan'
        ? !mobile().downloaded.includes(t.id)
        : taskView === 'Selesai'
          ? t.closed
          : !t.closed),
  );
  return (
    top(
      'Tugas hari ini',
      `${state().tasks.length} tugas · ${mobile().downloaded.length} tersimpan lokal`,
    ) +
    `<div class="m-main"><div class="m-pills">${['Semua', 'Aktif', 'Belum disimpan', 'Selesai'].map((v) => b(v, 'task-filter', v, taskView === v ? 'selected' : '')).join('')}</div><div class="row between"><small>Urutkan: <b>SLA terdekat</b></small>${b('↓ Simpan semua', 'download-all')}</div>${tasks.map(taskCard).join('') || '<div class="empty">Tidak ada tugas dalam kategori ini.</div>'}<div class="notice">Tugas baru dari dashboard operator langsung muncul di sini pada browser yang sama.</div></div>`
  );
}
function taskDetail() {
  const t = tBy(itemId),
    c = cBy(t?.caseId);
  if (!t || !c) return top('Tugas tidak ditemukan', '', 'surveyor');
  const checks = mobile().surveys[t.id]?.checks || [];
  return (
    top('Detail tugas', t.id, 'surveyor') +
    `<div class="m-main"><div class="row between">${badge(c.category)}${badge(c.sla)}</div><h2 class="m-case-title">${escape(c.title)}</h2><section class="card"><div class="eyebrow">INSTRUKSI PETUGAS</div><p>Konfirmasi kondisi ${c.category.toLowerCase()}, ukur perkiraan dimensi kerusakan, ambil foto dari 3 sudut, dan periksa perbaikan sementara.</p></section><section><div class="eyebrow">CHECKLIST WAJIB</div><div class="card m-checklist">${['Foto kondisi dari 3 sudut', 'Ukur perkiraan dimensi', 'Tandai koordinat presisi'].map((s, i) => `<label class="m-check"><input type="checkbox" data-survey-check="${i}" ${checks.includes(i) ? 'checked' : ''}>${s}</label>`).join('')}</div></section><section><div class="m-section-head"><h2>Bukti warga</h2><small>3 foto simulasi</small></div>${ctx.gallery(c)}</section><div class="notice">↓ ${mobile().downloaded.includes(t.id) ? 'Data tugas tersedia pada perangkat' : 'Simpan tugas untuk persiapan survei'}<p>Mode lokal · data dan foto demo pada aplikasi.</p></div><div class="m-task-actions">${t.closed ? '<div class="notice">Tugas selesai dan telah diverifikasi operator.</div>' : link(`surveyor/form/${t.id}`, 'Terima & mulai survei', 'primary m-wide-button')}<div class="row">${b('Minta klarifikasi', 'task-message', 'Klarifikasi')}${b('Tolak tugas', 'task-message', 'Penolakan', 'danger')}</div></div></div>`
  );
}
function surveyForm() {
  const t = tBy(itemId),
    c = cBy(t?.caseId);
  if (!t || !c) return top('Tugas tidak ditemukan', '', 'surveyor');
  if (t.closed) return top('Tugas sudah selesai', '', 'surveyor');
  const d = mobile().surveys[t.id] || {};
  const n = (d.photos || []).filter(Boolean).length;
  return (
    top(
      'Form survei',
      `${t.id} · ${d.saved ? 'draft tersimpan' : 'draft baru'}`,
      `surveyor/tugas/${t.id}`,
    ) +
    `<form id="mobile-survey" class="m-main" data-id="${t.id}"><div class="row"><div class="progress" style="flex:1"><i style="width:${Math.round((n / 3) * 100)}%"></i></div><small>${n} dari 3 foto</small></div><section><div class="m-section-head"><h2>Foto per sudut <span style="color:#c0392b">*</span></h2>${b('Isi foto demo', 'survey-demo-photos')}</div><div class="m-survey-photos">${['Depan', 'Samping', 'Atas'].map((s, i) => `<label>${d.photos?.[i] ? `<img class="evidence" src="${escape(d.photos[i])}" alt="Bukti ${s}">` : '<span class="m-photo-empty">＋</span>'}<small>${s} ${d.photos?.[i] ? '✓' : ''}</small><input type="file" data-survey-photo="${i}" accept="image/png,image/jpeg,image/webp" capture="environment"></label>`).join('')}</div><small>Ketuk foto untuk mengganti. Maksimal 1 MB per foto.</small></section><label>Kondisi aktual<select name="severity">${opts(['Ringan', 'Berat', 'Kritis'], d.severity || c.severity)}</select></label><div class="notice"><b class="mono">${c.lat.toFixed(4)}, ${c.lng.toFixed(4)}</b><p>Koordinat tugas · lokasi simulasi</p></div><label>Dimensi kerusakan<input name="dimensions" required placeholder="Contoh: panjang 2 m, lebar 1 m" value="${escape(d.dimensions)}"></label><label>Catatan lapangan<textarea name="notes" required minlength="10" placeholder="Tuliskan hasil pemeriksaan dan dampaknya…">${escape(d.notes)}</textarea></label><label>Rekomendasi hasil<select name="recommendation">${opts(['Valid — perlu tindak lanjut', 'Tidak ditemukan di lokasi', 'Sudah ditangani'], d.recommendation || 'Valid — perlu tindak lanjut')}</select></label><div class="notice ${mobile().offline ? 'amber' : ''}">${mobile().offline ? 'Hasil akan masuk antrean dan dikirim saat Anda online.' : 'Hasil masuk ke dashboard operator untuk verifikasi.'}</div><div class="m-form-actions">${b('Simpan draft', 'save-survey')}<button type="submit" class="primary">${mobile().offline ? 'Simpan ke antrean' : 'Kirim hasil survei'}</button></div></form>`
  );
}
function account() {
  return (
    top('Akun & perangkat', 'Konteks pengguna demo') +
    `<div class="m-main"><section class="card m-account"><span class="avatar">${screen === 'warga' ? 'SA' : 'DD'}</span><h2>${screen === 'warga' ? 'Sari Anggraini' : 'Dedi Darmawan'}</h2><p>${screen === 'warga' ? 'Warga Desa Ciburuy' : 'Surveyor Kecamatan Cisarua'}</p>${badge('Akun demo')}</section><section class="card"><h3>Mode koneksi</h3><p style="margin:10px 0">Simulasikan penyimpanan laporan saat koneksi terputus.</p>${b(mobile().offline ? 'Aktifkan Online' : 'Aktifkan Offline', 'toggle-offline')}</section><div class="stack">${link(screen === 'warga' ? 'surveyor' : 'warga', screen === 'warga' ? 'Beralih ke Surveyor →' : 'Beralih ke Warga →', 'm-wide-button')}${link('ringkasan', 'Buka Dashboard Petugas ↗', 'm-wide-button')}${link('publik', 'Buka Portal Publik ↗', 'm-wide-button')}</div><p class="m-caption">SIGAP / PantauDesa · KMIPN 2026<br>Frontend demo · tanpa login atau server aktif.</p></div>`
  );
}
function mMap() {
  return (
    top(
      'Peta sekitar',
      screen === 'warga' ? 'Kasus publik · lokasi digeneralisasi' : 'Sebaran lokasi tugas',
    ) +
    `<div class="m-main">${ctx.map(
      screen === 'warga'
        ? state().cases.slice(0, 12)
        : state()
            .tasks.map((t) => cBy(t.caseId))
            .filter(Boolean),
      true,
      true,
    )}<div class="notice">Ketuk titik untuk melihat ringkasan fasilitas. Peta geospasial simulasi.</div></div>`
  );
}
export function renderMobile(context) {
  ctx = context;
  const p = location.hash.slice(1).split('/');
  screen = p[0];
  sub = p[1] || '';
  itemId = p[2] || '';
  mobile();
  let body;
  if (sub === 'akun') body = account();
  else if (sub === 'sinkron') body = syncPage();
  else if (sub === 'peta') body = mMap();
  else if (screen === 'warga') {
    body =
      sub === 'buat'
        ? reportForm()
        : sub === 'laporan'
          ? itemId
            ? reportDetail()
            : myReports()
          : sub === 'kasus'
            ? reportDetail()
            : home();
  } else
    body =
      sub === 'tugas'
        ? taskDetail()
        : sub === 'form'
          ? surveyForm()
          : sub === 'riwayat'
            ? ` ${top('Riwayat survei', 'Hasil pemeriksaan lapangan')}<div class="m-main">${
                state()
                  .tasks.filter((t) => t.progress === 100)
                  .map(taskCard)
                  .join('') || '<div class="empty">Belum ada survei selesai.</div>'
              }</div>`
            : taskHome();
  const nav =
    screen === 'warga'
      ? [
          ['', 'home', 'Beranda'],
          ['laporan', 'report', 'Laporan'],
          ['peta', 'map', 'Peta'],
          ['sinkron', 'sync', 'Sinkron'],
          ['akun', 'user', 'Akun'],
        ]
      : [
          ['', 'report', 'Tugas'],
          ['peta', 'map', 'Peta'],
          ['sinkron', 'sync', 'Sinkron'],
          ['riwayat', 'report', 'Riwayat'],
          ['akun', 'user', 'Akun'],
        ];
  $('#app').innerHTML =
    `<div class="mobile-stage"><aside class="mobile-presenter"><a href="#publik" class="brand"><span class="logo">S</span><div><b>SIGAP</b><small>PantauDesa</small></div></a><div class="eyebrow">MOBILE EXPERIENCE</div><h1>${screen === 'warga' ? 'Dari kepedulian warga,<br>menjadi perubahan nyata.' : 'Bukti lapangan.<br>Keputusan yang tepat.'}</h1><p>${screen === 'warga' ? 'Laporkan kondisi fasilitas, ikuti perkembangan, dan bantu pembangunan desa yang lebih terarah.' : 'Satu ruang kerja untuk tugas survei, dokumentasi kondisi, dan sinkronisasi hasil pemeriksaan.'}</p><div class="presenter-links">${link('warga', '01 · Aplikasi Warga', screen === 'warga' ? 'active' : '')}${link('surveyor', '02 · Aplikasi Surveyor', screen === 'surveyor' ? 'active' : '')}${link('ringkasan', '03 · Dashboard Petugas ↗')}${link('publik', '04 · Portal Publik ↗')}</div><div class="notice">Data terhubung pada browser yang sama.<br>Aktifkan mode Offline untuk mencoba antrean sinkronisasi.</div><small>DEMO KMIPN 2026 · REFERENSI M-05 / S-01</small></aside><div class="mobile-device"><div class="m-status"><span class="mono">09:41</span><span class="m-island"></span><span>▮▮▮  ▰</span></div><div class="m-screen">${body}</div><nav class="m-bottom">${nav.map(([s, i, n]) => `<a href="#${screen}${s ? '/' + s : ''}" class="${sub === s || (s === '' && ['tugas', 'form'].includes(sub)) ? 'active' : ''}">${icon(i)}<span>${n}</span>${s === 'sinkron' && mobile().outbox.length ? '<i>' + mobile().outbox.length + '</i>' : ''}</a>`).join('')}</nav></div></div>`;
}
const rerender = () => renderMobile(ctx),
  persist = () => ctx.save(),
  say = (s) => ctx.toast(s);
function addReport(payload) {
  const s = state(),
    existing = cBy(payload.merge);
  let id;
  if (existing) {
    existing.reports++;
    if (payload.photo) existing.photos = [...(existing.photos || []), payload.photo];
    id = existing.id;
    log(
      s,
      id,
      'Bukti warga ditambahkan',
      existing.reports - 1,
      existing.reports,
      'Laporan pendukung dikirim dari aplikasi warga.',
    );
  } else {
    id = `CB-${Math.max(1790, ...s.cases.map((c) => Number(c.id.slice(3)))) + 1}`;
    s.cases.unshift({
      id,
      title: payload.title,
      description: payload.description,
      category: payload.category,
      village: payload.village,
      severity: payload.severity,
      lat: Number(payload.lat),
      lng: Number(payload.lng),
      photo: payload.photo,
      isNew: true,
      status: 'Menunggu verifikasi',
      score: 50,
      reports: 1,
      sla: 'Normal',
      x: 40,
      y: 42,
      date: '2026-07-17',
      assessment: payload.photo ? 'Perlu Verifikasi Manusia' : 'Kualitas Media Rendah',
    });
    log(
      s,
      id,
      'Laporan warga diterima',
      'Belum ada kasus',
      'Menunggu verifikasi',
      'Laporan dikirim melalui frontend mobile warga.',
    );
  }
  return id;
}
function applySurvey(o) {
  const t = tBy(o.taskId);
  if (!t) throw Error('Tugas tidak ditemukan.');
  const c = cBy(t.caseId);
  t.progress = 100;
  t.photo = o.payload.photos[0];
  t.survey = o.payload;
  c.severity = o.payload.severity;
  log(
    state(),
    t.caseId,
    'Hasil Survei Lapangan',
    'Menunggu pemeriksaan',
    '100% · menunggu verifikasi operator',
    o.payload.notes,
  );
}
function captureSurvey() {
  const f = $('#mobile-survey');
  if (!f) return;
  const data = new FormData(f),
    m = mobile(),
    d = m.surveys[f.dataset.id] || {};
  for (const [k, v] of data) d[k] = v;
  d.saved = true;
  m.surveys[f.dataset.id] = d;
  persist();
  return d;
}
document.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-mobile]');
  if (!el || !ctx) return;
  const action = el.dataset.mobile,
    v = el.dataset.value,
    m = mobile();
  if (action === 'toggle-offline') {
    m.offline = !m.offline;
    persist();
    rerender();
    return;
  }
  if (action === 'report-back') {
    step = Math.max(1, step - 1);
    rerender();
    return;
  }
  if (action === 'demo-photo') {
    m.draft.photo = ctx.asset(m.draft.category);
    persist();
    rerender();
    say('Foto simulasi dipilih.');
    return;
  }
  if (action === 'report-filter') {
    reportView = v;
    rerender();
    return;
  }
  if (action === 'task-filter') {
    taskView = v;
    rerender();
    return;
  }
  if (action === 'download-task') {
    if (!m.downloaded.includes(v)) m.downloaded.push(v);
    persist();
    rerender();
    say('Tugas disimpan pada perangkat demo.');
    return;
  }
  if (action === 'download-all') {
    m.downloaded = state().tasks.map((t) => t.id);
    persist();
    rerender();
    return;
  }
  if (action === 'survey-demo-photos') {
    captureSurvey();
    const t = tBy(itemId),
      d = m.surveys[itemId] || {};
    d.photos = [0, 1, 2].map(() => ctx.asset(cBy(t.caseId).category));
    m.surveys[itemId] = d;
    persist();
    rerender();
    return;
  }
  if (action === 'save-survey') {
    captureSurvey();
    say('Draft survei tersimpan pada perangkat.');
    return;
  }
  if (action === 'task-message') {
    ctx.showModal(
      v === 'Klarifikasi' ? 'Minta klarifikasi tugas' : 'Tolak tugas',
      `<form id="mobile-task-message" data-id="${itemId}" data-kind="${v}"><label>Alasan / pertanyaan<textarea name="reason" required minlength="5"></textarea></label><button type="submit" class="primary">Kirim ke operator demo</button></form>`,
    );
    return;
  }
  if (action === 'sync-mobile') {
    if (busy) return;
    if (m.offline) {
      say('Aktifkan mode Online sebelum sinkronisasi.');
      return;
    }
    if (!m.outbox.length) {
      say('Semua kiriman sudah tersinkron.');
      return;
    }
    busy = true;
    el.disabled = true;
    el.textContent = 'Menyinkronkan…';
    await new Promise((r) => setTimeout(r, 1000));
    for (const o of m.outbox) {
      if (o.kind === 'report') {
        const id = addReport(o.payload),
          r = m.reports.find((r) => r.id === o.id);
        r.caseId = id;
        r.status = 'Terkirim';
      } else applySurvey(o);
    }
    m.outbox = [];
    busy = false;
    persist();
    rerender();
    say('Sinkronisasi berhasil. Data tersedia di dashboard petugas.');
  }
});
document.addEventListener('change', async (e) => {
  if (!ctx || !location.hash.match(/^#(warga|surveyor)/)) return;
  const el = e.target;
  try {
    if (el.matches('#mobile-report input[type=radio]')) {
      if (el.name === 'category') {
        mobile().draft.category = el.value;
        document
          .querySelectorAll('.m-option')
          .forEach((l) => l.classList.toggle('selected', !!l.querySelector('input:checked')));
      }
      if (el.name === 'merge') mobile().draft.merge = el.value;
      persist();
    }
    if (el.matches('#mobile-report input[type=file]')) {
      const photo = await ctx.readPhoto(el.files[0]);
      if (photo) {
        mobile().draft.photo = photo;
        persist();
        rerender();
      }
    }
    if (el.dataset.surveyCheck !== undefined) {
      const d = mobile().surveys[itemId] || {};
      d.checks = d.checks || [];
      const n = Number(el.dataset.surveyCheck);
      d.checks = el.checked ? [...new Set([...d.checks, n])] : d.checks.filter((i) => i !== n);
      mobile().surveys[itemId] = d;
      persist();
    }
    if (el.dataset.surveyPhoto !== undefined) {
      captureSurvey();
      const photo = await ctx.readPhoto(el.files[0]);
      if (photo) {
        const d = mobile().surveys[itemId] || {};
        d.photos = d.photos || [];
        d.photos[Number(el.dataset.surveyPhoto)] = photo;
        mobile().surveys[itemId] = d;
        persist();
        rerender();
      }
    }
  } catch (err) {
    say(err.message);
  }
});
document.addEventListener('input', (e) => {
  if (e.target.closest('#mobile-survey')) captureSurvey();
  if (e.target.closest('#mobile-report') && e.target.name && e.target.type !== 'file') {
    mobile().draft[e.target.name] =
      e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    persist();
  }
});
document.addEventListener(
  'click',
  (e) => {
    const p = e.target.closest('#m-location-map');
    if (!p) return;
    const r = p.getBoundingClientRect(),
      d = mobile().draft;
    d.lat = (-6.9 + ((e.clientY - r.top) / r.height) * 0.06).toFixed(4);
    d.lng = (107.5 + ((e.clientX - r.left) / r.width) * 0.08).toFixed(4);
    $('#mobile-report [name=lat]').value = d.lat;
    $('#mobile-report [name=lng]').value = d.lng;
    const marker = p.querySelector('.marker');
    if (marker) {
      marker.style.left = ((e.clientX - r.left) / r.width) * 100 + '%';
      marker.style.top = ((e.clientY - r.top) / r.height) * 100 + '%';
    }
    persist();
  },
  true,
);
document.addEventListener('submit', async (e) => {
  const f = e.target;
  if (!f.id.startsWith('mobile-')) return;
  e.preventDefault();
  const data = new FormData(f),
    m = mobile();
  try {
    if (f.id === 'mobile-report') {
      for (const [k, v] of data) if (k !== 'photo') m.draft[k] = v;
      persist();
      if (step < 5) {
        step++;
        rerender();
        $('.m-screen').scrollTop = 0;
        return;
      }
      const payload = { ...m.draft },
        id = 'LPR-' + Date.now().toString().slice(-8);
      const r = {
        id,
        title: payload.title,
        date: '17 Jul 2026',
        status: m.offline ? 'Antrean' : 'Terkirim',
      };
      if (m.offline) m.outbox.push({ kind: 'report', id, title: r.title, payload });
      else r.caseId = addReport(payload);
      m.reports.unshift(r);
      m.draft = {
        category: 'Jalan',
        village: 'Ciburuy',
        title: '',
        description: '',
        severity: 'Berat',
        lat: '-6.8721',
        lng: '107.5314',
      };
      step = 1;
      persist();
      location.hash = 'warga/laporan/' + id;
      say(
        m.offline
          ? 'Laporan aman tersimpan dalam antrean.'
          : 'Laporan berhasil dikirim ke petugas.',
      );
      return;
    }
    if (f.id === 'mobile-survey') {
      const d = captureSurvey();
      if ((d.photos || []).filter(Boolean).length < 3)
        throw Error('Lengkapi 3 foto atau gunakan foto demo.');
      const o = {
        kind: 'survey',
        id: 'SRV-' + Date.now(),
        taskId: f.dataset.id,
        title: cBy(tBy(f.dataset.id).caseId).title,
        payload: { ...d },
      };
      if (m.outbox.some((x) => x.kind === 'survey' && x.taskId === o.taskId))
        throw Error('Hasil tugas ini sudah berada dalam antrean sinkronisasi.');
      if (m.offline) m.outbox.push(o);
      else applySurvey(o);
      persist();
      location.hash = m.offline ? 'surveyor/sinkron' : 'surveyor';
      say('Hasil survei tersimpan. Operator dapat meninjau setelah sinkronisasi.');
      return;
    }
    if (f.id === 'mobile-task-message') {
      const t = tBy(f.dataset.id);
      log(
        state(),
        t.caseId,
        `${f.dataset.kind} Tugas Surveyor`,
        t.id,
        'Menunggu tindak lanjut operator',
        String(data.get('reason')),
      );
      t.message = String(data.get('reason'));
      persist();
      ctx.closeModal();
      say('Pesan tugas tercatat pada audit operator.');
      return;
    }
    if (f.id === 'mobile-add-evidence') {
      if (m.offline) throw Error('Aktifkan Online untuk mengirim bukti tambahan.');
      const photo = await ctx.readPhoto(data.get('photo')),
        c = cBy(f.dataset.case);
      if (!photo) throw Error('Pilih foto terlebih dahulu.');
      c.photo = photo;
      c.status = 'Menunggu verifikasi';
      log(
        state(),
        c.id,
        'Bukti Tambahan Warga',
        'Perlu kelengkapan',
        'Menunggu verifikasi',
        'Warga mengirim foto tambahan melalui aplikasi mobile.',
      );
      persist();
      rerender();
      say('Bukti tambahan terkirim.');
    }
  } catch (err) {
    say(err.message);
  }
});
