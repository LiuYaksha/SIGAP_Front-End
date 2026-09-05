import './style.css';
import './mobile.css';
import { renderMobile } from './mobile.js';
const asset = (category) =>
  '/assets/' +
  ({
    Jalan: 'road',
    Jembatan: 'bridge',
    'Air Bersih': 'water',
    Irigasi: 'irrigation',
    'Fasilitas Umum': 'lighting',
  }[category] || 'road') +
  '.png';
import {
  initialState,
  categories,
  villages,
  statuses,
  updateCase,
  mergeCases,
  log,
  geojson,
} from './store.js';
const KEY = 'sigap-demo-v1';
let state;
try {
  state = JSON.parse(localStorage.getItem(KEY)) || initialState();
  if (!Array.isArray(state.cases) || !Array.isArray(state.logs) || !Array.isArray(state.tasks))
    state = initialState();
} catch {
  state = initialState();
}
let page = '',
  tab = 'Ringkasan',
  selected = 'CB-1790',
  filters = {
    village: '',
    category: '',
    status: '',
    severity: '',
    sla: '',
    search: '',
    priority: '',
    isNew: '',
  },
  view = 'peta',
  queueFilter = 'Semua',
  taskFilter = 'Semua Tugas',
  mapMode = 'Titik Kasus',
  mapLayer = 'Standar',
  zoom = 1,
  drawer = null,
  auditSearch = '',
  auditDate = '',
  syncing = false,
  modalFocus = null;
const $ = (s) => document.querySelector(s),
  esc = (v) =>
    String(v ?? '').replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
const save = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    toast('Penyimpanan browser penuh. Perubahan sesi ini belum tersimpan.');
  }
};
const color = (s) =>
  /Selesai|Terverifikasi|Online|Asli|Demo aktif|Normal/.test(s)
    ? 'teal'
    : /Ditangani/.test(s)
      ? 'blue'
      : /Kritis|tinggi|lewati|terlewat|Ditolak/.test(s)
        ? 'red'
        : /Menunggu|SLA|Survei|Kelengkapan|Duplikat|Rendah|Verifikasi Manusia/.test(s)
          ? 'amber'
          : 'neutral';
const badge = (s) => `<span class="badge ${color(s)}">${esc(s)}</span>`;
const btn = (label, action, extra = '', cls = '') =>
  `<button type="button" class="${cls}" data-action="${action}" ${extra}>${label}</button>`;
const options = (values, current, all) =>
  `${all !== undefined ? `<option value="">${all}</option>` : ''}${values.map((v) => `<option ${v === current ? 'selected' : ''} value="${esc(v)}">${esc(v)}</option>`).join('')}`;
const select = (key, values, all) =>
  `<select aria-label="Filter ${key}" data-filter="${key}">${options(values, filters[key], all)}</select>`;
const current = () => state.cases.find((c) => c.id === selected) || state.cases[0];
const filtered = () =>
  state.cases.filter(
    (c) =>
      (!filters.village || c.village === filters.village) &&
      (!filters.category || c.category === filters.category) &&
      (!filters.status || c.status === filters.status) &&
      (!filters.severity || c.severity === filters.severity) &&
      (!filters.sla || c.sla === filters.sla) &&
      (!filters.priority || c.score >= 80) &&
      (!filters.isNew || c.isNew) &&
      `${c.title} ${c.village} ${c.id}`.toLowerCase().includes(filters.search.toLowerCase()),
  );
const date = (t) =>
  new Date(t).toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'medium',
    timeStyle: 'short',
  }) + ' WIB';
const brand = () =>
  `<div class="brand"><span class="logo">S</span><div><b>SIGAP</b><small>PantauDesa</small></div></div>`;
const head = (title, subtitle, actions = '') =>
  `<div class="page-head"><div><div class="eyebrow">SISTEM INFORMASI GEOSPASIAL DESA</div><h1>${title}</h1><p>${subtitle}</p></div><div class="row">${actions}</div></div>`;
function toast(message) {
  $('#toast').textContent = message;
  $('#toast').classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => $('#toast').classList.remove('show'), 4000);
}
function evidence(c, variant = 0) {
  const src = c.photos?.[variant] || c.photo || asset(c.category),
    demo = src.startsWith('/assets/');
  return `<figure class="photo-evidence"><img class="evidence" src="${esc(src)}" alt="${demo ? 'Foto simulasi' : 'Foto unggahan'} ${esc(c.title || c.category)}" loading="lazy"><span>${demo ? 'FOTO SIMULASI' : 'BUKTI UNGGAHAN'}</span></figure>`;
}
function map(cases = filtered(), large = false, publicMap = false) {
  const groups =
    mapMode === 'Klaster Spasial'
      ? villages
          .map((v) => {
            const list = cases.filter((c) => c.village === v);
            return list.length ? { ...list[0], cluster: list.length } : null;
          })
          .filter(Boolean)
      : cases;
  return `<div class="map ${cases.length === 1 ? 'single' : ''} ${large ? 'large' : ''} ${mapMode === 'Heatmap' ? 'heat' : ''} ${mapLayer === 'Citra satelit' ? 'satellite' : ''} ${mapLayer === 'Tanpa batas desa' ? 'labels-off' : ''}"><div class="map-art" style="transform:scale(${zoom})"><svg viewBox="0 0 800 560" preserveAspectRatio="none"><path d="M0 70Q180 130 220 10L490 0 430 190 200 240 0 200Z" fill="#dbe5d2"/><path d="M480 250L800 190V490L560 530 430 420Z" fill="#dae4cf"/><path d="M0 425Q180 350 260 430T590 340T850 370" fill="none" stroke="#aacbc9" stroke-width="16"/><path d="M-20 175L200 235 385 120 830 200M185 -20L200 235 335 385 265 580M335 385L580 320 820 455" fill="none" stroke="#cdd1c2" stroke-width="18"/><path d="M-20 175L200 235 385 120 830 200M185 -20L200 235 335 385 265 580M335 385L580 320 820 455" fill="none" stroke="#fffdf2" stroke-width="12"/><path d="M55 0L120 280 0 390M430 0L450 230 610 560M800 95L550 200 430 540" fill="none" stroke="#aebba8" stroke-dasharray="6 5"/>${mapLayer === 'Fasilitas publik' ? '<g fill="#597364" font-size="14"><text x="220" y="200">▣ Sekolah</text><text x="520" y="420">✚ Puskesmas</text><text x="430" y="80">▣ Balai desa</text></g>' : ''}</svg>${villages
    .slice(0, 6)
    .map(
      (v, i) =>
        `<span class="village-label" style="left:${14 + (i % 3) * 30}%;top:${24 + Math.floor(i / 3) * 40}%">DESA ${v.toUpperCase()}</span>`,
    )
    .join(
      '',
    )}${groups.map((c) => `<button class="marker ${c.cluster ? 'cluster' : ''}" style="left:${c.x}%;top:${c.y}%;--pin:${c.status === 'Sedang Ditangani' ? '#2563eb' : /Selesai|Terverifikasi/.test(c.status) ? '#0f7a6b' : '#b8730a'}" data-action="${publicMap ? 'public-detail' : 'marker'}" data-id="${c.id}" aria-label="${esc(c.title)}${c.cluster ? `, ${c.cluster} kasus di ${c.village}` : ''}">${c.cluster || ''}</button>`).join('')}</div><div class="map-caption">◈ KECAMATAN CISARUA <span class="muted"> · Peta simulasi${mapLayer === 'Citra satelit' ? ' · citra ilustratif' : ''}</span></div><div class="map-tools">${btn('+', 'zoom-in', 'aria-label="Perbesar peta"')}${btn('−', 'zoom-out', 'aria-label="Perkecil peta"')}${btn('⌖', 'zoom-reset', 'aria-label="Atur ulang peta"')}</div><div class="legend"><b>Status kasus</b><span><i style="background:#0f7a6b"></i>Terverifikasi / selesai</span><span><i style="background:#b8730a"></i>Menunggu tindak lanjut</span><span><i style="background:#2563eb"></i>Sedang ditangani</span></div><div class="privacy">${publicMap ? 'Lokasi digeneralisasi untuk melindungi privasi pelapor (UU PDP No. 27/2022).' : 'Dataset simulasi · bukan peta navigasi<br>━━ 500 m (ilustratif)'}</div>${drawer && !publicMap ? drawerHtml() : ''}</div>`;
}
function caseCard(c, pub = false) {
  return `<button class="case-card" data-action="${pub ? 'public-detail' : 'detail'}" data-id="${c.id}"><span class="category-icon">${{ Jalan: 'JL', Jembatan: 'JB', 'Air Bersih': 'AR', 'Fasilitas Umum': 'LP', Irigasi: 'IR' }[c.category]}</span><div><h3>${esc(c.title)}</h3><p>Desa ${esc(c.village)} · diperbarui ${c.date === '2026-07-17' ? '17 Jul 2026' : esc(c.date)}</p><div class="row">${badge(c.status)}<small>${c.reports} laporan</small></div></div></button>`;
}
function chart() {
  return `<div class="chart-legend"><span><i></i>Laporan masuk</span><span><i></i>Kasus selesai</span></div><div class="chart">${Array.from({ length: 20 }, (_, i) => `<div class="bar-group" title="Hari ${i + 1}: ${12 + (i % 8)} masuk, ${8 + (i % 6)} selesai"><i style="height:${30 + ((i * 13) % 65)}%"></i><i style="height:${20 + ((i * 9) % 49)}%"></i></div>`).join('')}</div><div class="axis"><span>18 Jun</span><span>25 Jun</span><span>02 Jul</span><span>09 Jul</span><span>17 Jul</span></div>`;
}
function dashboard() {
  const all = state.cases,
    cases = filtered(),
    metrics = [
      ['Kasus baru', all.filter((c) => c.isNew).length, '#2563eb', 'Peta & Kasus'],
      [
        'Perlu verifikasi',
        all.filter((c) => c.status === 'Menunggu verifikasi').length,
        '#b8730a',
        'Verifikasi',
      ],
      [
        'SLA terlewat',
        all.filter((c) => c.sla === 'Melewati SLA' && c.status !== 'Selesai').length,
        '#c0392b',
        'SLA',
      ],
      ['Prioritas tinggi', all.filter((c) => c.score >= 80).length, '#0f7a6b', 'Prioritas'],
      [
        'Perlu kelengkapan',
        all.filter(
          (c) => c.assessment === 'Kualitas Media Rendah' || c.status === 'Perlu Kelengkapan',
        ).length,
        '#8a9099',
        'Kelengkapan',
      ],
    ];
  return (
    head(
      'Apa yang harus ditangani hari ini?',
      'Data demo per 17 Jul 2026 08:40 WIB · cakupan 8 desa',
      badge('Demo aktif'),
    ) +
    `<div class="metrics">${metrics.map(([label, n, col, target]) => `<button class="card metric" style="--accent:${col}" data-action="metric" data-value="${target}"><strong class="mono">${n}</strong><span>${label}</span><small>Lihat kasus terkait ↗</small></button>`).join('')}</div><div class="grid two"><div class="stack"><section class="card"><div class="card-head"><div><h2>Umur backlog kasus</h2><p>Arus laporan dan penyelesaian · 30 hari terakhir</p></div><small>Data ilustratif</small></div>${chart()}</section><section class="card"><div class="card-head"><h2>Sebaran kasus di wilayah Anda</h2><a href="#peta">Buka Peta & Kasus Penuh ↗</a></div>${map(cases.slice(0, 15))}</section></div><div class="stack"><section class="card"><div class="card-head"><h2>Kasus perlu perhatian</h2><span class="badge red">Prioritas tinggi</span></div>${
      cases
        .filter((c) => c.score >= 80 && c.status !== 'Selesai')
        .slice(0, 4)
        .map(
          (c) =>
            `<a href="#kasus/${c.id}" class="critical"><div class="row between"><span class="mono">${c.id} · ${c.category.toUpperCase()}</span>${badge(c.sla === 'Melewati SLA' ? 'SLA terlewat 1j' : 'SLA 2j')}</div><h3>${esc(c.title)}</h3><div class="row between"><small>Desa ${c.village} · ${c.reports} laporan</small><b style="color:var(--teal);font-size:12px">${c.score} ↗</b></div></a>`,
        )
        .join('') || '<p>Tidak ada kasus kritis pada cakupan ini.</p>'
    }</section><section class="card"><div class="card-head"><h2>Kualitas & sinkronisasi data</h2><span class="badge teal">Online</span></div><div class="row between"><strong class="stat-number mono">98<span style="font-size:17px">%</span></strong><small>Laporan tersinkron</small></div><div class="progress"><i style="width:98%"></i></div><p>2 laporan menunggu koneksi surveyor.</p><div class="notice" style="margin-top:15px">Data warga terlindungi. Setiap keputusan operator dicatat dalam riwayat audit.</div></section></div></div><div class="footer-line"><span>SIGAP · Infrastruktur terpantau, pembangunan terarah.</span><span>KMIPN 2026 / DEMO</span></div>`
  );
}
function filterBar(pub = false) {
  return `<div class="filters">${select('village', villages, 'Semua desa · Kec. Cisarua')}${select('category', categories, 'Semua kategori')}${select('status', statuses, 'Semua status')}${btn('Juli 2026', 'period', '', 'active')}${btn('Reset', 'reset-filters')}<span class="spacer"></span><small><b>${filtered().length}</b> kasus ditemukan</small>${btn('◈ Peta', 'view', 'data-value="peta"', view === 'peta' ? 'primary' : '')}${btn('☷ Daftar', 'view', 'data-value="daftar"', view === 'daftar' ? 'primary' : '')}</div>`;
}
function publicPage() {
  if (page === 'metodologi')
    return `<div class="content">${head('Transparan dalam data, jelas dalam keputusan.', 'Metodologi pemantauan pembangunan desa')}<div class="grid equal">${[
      [
        '01 · Laporan warga',
        'Foto, deskripsi, dan lokasi menjadi bukti awal. Identitas pelapor tidak ditampilkan pada portal publik.',
      ],
      [
        '02 · Pra-verifikasi AI',
        'Simulasi MiniMax M3 memeriksa metadata, kondisi visual, dan kesamaan objek. Keputusan akhir dilakukan petugas.',
      ],
      [
        '03 · Konsolidasi spasial',
        'Laporan berdekatan dalam radius 50–100 meter dibandingkan; pengecualian fasilitas memanjang ditinjau petugas.',
      ],
      [
        '04 · Prioritas yang dapat dijelaskan',
        'Keselamatan, dampak warga, dukungan laporan, dan SLA menyusun skor. Override memerlukan alasan dan tercatat di audit.',
      ],
    ]
      .map(
        ([a, b]) =>
          `<section class="card"><h2>${a}</h2><p style="margin-top:12px">${b}</p></section>`,
      )
      .join(
        '',
      )}</div><div class="notice" style="margin-top:20px">Demo KMIPN 2026: seluruh kasus merupakan data tiruan. Peta dan ilustrasi bukti bukan dokumentasi kejadian nyata.</div></div>`;
  if (page === 'statistik' || page === 'publik-ringkasan')
    return `<div class="content">${head(page === 'statistik' ? 'Statistik pembangunan desa' : 'Bersama, pantau pembangunan desa.', 'Informasi terbuka mengenai kondisi fasilitas dan progres penanganan.', `<a class="primary" style="padding:10px;border-radius:8px" href="#publik">Jelajahi peta ↗</a>`)}<div class="grid equal">${['Sedang Ditangani', 'Selesai', 'Menunggu verifikasi', 'Terverifikasi'].map((s) => `<div class="card"><span class="stat-number mono">${state.cases.filter((c) => c.status === s).length}</span><h2>${s}</h2><p>Kasus pada dataset demo Kecamatan Cisarua</p></div>`).join('')}</div><section class="card" style="margin-top:20px"><div class="card-head"><h2>Perkembangan penanganan</h2><small>Tren ilustratif · Juli 2026</small></div>${chart()}</section></div>`;
  return `<div class="public-body">${head('Pembangunan desa, terbuka untuk semua.', 'Pantau kondisi infrastruktur dan progres penanganan di sekitar Anda.', `<span class="badge teal">Data publik · identitas terlindungi</span>`)}${filterBar(true)}${
    view === 'peta'
      ? `<div class="public-split">${map(filtered(), true, true)}<aside class="case-list"><input aria-label="Cari wilayah atau fasilitas" data-search="public" placeholder="⌕  Cari wilayah atau fasilitas…" value="${esc(filters.search)}">${
          filtered()
            .map((c) => caseCard(c, true))
            .join('') || '<div class="empty">Tidak ada kasus sesuai filter.</div>'
        }</aside></div>`
      : `<input aria-label="Cari fasilitas" data-search="public" placeholder="Cari wilayah atau fasilitas…" value="${esc(filters.search)}" style="margin-bottom:16px"><div class="list-mode">${
          filtered()
            .map((c) => caseCard(c, true))
            .join('') || '<div class="empty">Tidak ada kasus sesuai filter.</div>'
        }</div>`
  }<div class="footer-line"><span>◈ Lokasi publik digeneralisasi · Data pribadi pelapor tidak ditampilkan</span><span>Data simulasi / Juli 2026</span></div></div>`;
}
function drawerHtml() {
  const c = state.cases.find((c) => c.id === drawer);
  if (!c) return '';
  return `<aside class="drawer"><div class="row between"><span class="mono muted">${c.id}</span>${btn('×', 'close-drawer', 'aria-label="Tutup detail cepat"')}</div><h2>${esc(c.title)}</h2>${evidence(c)}<p style="margin:15px 0">Desa ${esc(c.village)} · ${c.reports} laporan pendukung</p>${badge(c.status)}<div class="score-number mono">${c.score}<small> / 100</small></div><p>${esc(c.description)}</p>${btn('Buka detail kasus ↗', 'detail', `data-id="${c.id}"`, 'primary')}</aside>`;
}
function gis() {
  return (
    head(
      'Peta & sebaran kasus',
      'Jelajahi kondisi infrastruktur, prioritas, dan batas layanan desa.',
    ) +
    filterBar() +
    `<div class="filters">${filters.priority ? badge('Prioritas tinggi') : ''}${filters.isNew ? badge('Kasus baru') : ''}${select('severity', ['Kritis', 'Berat', 'Ringan'], 'Semua tingkat keparahan')}${select('sla', ['Normal', 'Mendekati SLA', 'Melewati SLA'], 'Semua status SLA')}<select aria-label="Layer peta" data-control="layer">${options(['Standar', 'Citra satelit', 'Tanpa batas desa', 'Fasilitas publik'], mapLayer)}</select><select aria-label="Visualisasi peta" data-control="map-mode">${options(['Titik Kasus', 'Klaster Spasial', 'Heatmap'], mapMode)}</select></div>${
      view === 'peta'
        ? map(filtered(), true)
        : `<div class="list-mode">${
            filtered()
              .map((c) => caseCard(c))
              .join('') || '<p class="empty">Tidak ada kasus sesuai filter.</p>'
          }</div>`
    }`
  );
}
function timeline(id) {
  const logs = state.logs.filter((l) => l.caseId === id);
  return `<div class="timeline">${logs.map((l) => `<div class="event"><h3>${esc(l.action)}</h3><small>${date(l.time)}</small><p>${esc(l.actor)} · ${esc(l.reason)}</p></div>`).join('')}<div class="event"><h3>Menunggu verifikasi manual</h3><small>17 Jul 2026 · 08:15 WIB</small><p>Sistem menandai risiko untuk tinjauan petugas.</p></div><div class="event"><h3>Kasus dikonsolidasikan oleh AI</h3><small>16 Jul 2026 · 14:32 WIB</small><p>Laporan dikelompokkan berdasarkan objek dan lokasi.</p></div><div class="event"><h3>Laporan pertama diterima</h3><small>12 Jul 2026 · 09:12 WIB</small><p>Laporan warga masuk ke antrean.</p></div></div>`;
}
function gallery(c) {
  return `<div class="gallery">${[0, 1, 2].map((i) => `<figure>${evidence(c, i)}<figcaption>Bukti ${i + 1} · identitas disamarkan</figcaption></figure>`).join('')}</div>`;
}
function scorePanel(c) {
  const base = c.baseScore ?? c.score;
  const total = state.weights.reduce((a, b) => a + b, 0) || 1;
  const parts = state.weights.map((w) => Math.floor((w / total) * base));
  parts[0] += base - parts.reduce((a, b) => a + b, 0);
  return `<section class="card"><div class="card-head"><div><h2>Skor prioritas cerdas</h2><div class="row"><span class="score-number mono">${c.score}</span><small>/ 100</small><span class="badge teal">Confidence tinggi</span></div></div><div style="text-align:right"><p class="mono">model v2.3 · simulasi</p>${btn('Override beralasan', 'override')}</div></div>${['Keselamatan', 'Warga terdampak', 'Laporan pendukung', 'Batas waktu SLA'].map((s, i) => `<div class="score-line"><span>${s}</span><div class="progress"><i style="width:${Math.min(100, (parts[i] / 40) * 100)}%"></i></div><b class="mono">+${parts[i]}</b></div>`).join('')}<p style="margin-top:12px;font-size:10px">Skor dasar ${base}; skor aktif ${c.score}. Penyesuaian manual tercatat dalam audit.</p></section>`;
}
function detail() {
  const c = current();
  if (!c) return '<div class="empty">Kasus tidak ditemukan.</div>';
  return `<div class="row" style="margin-bottom:15px"><a href="#peta">Peta & Kasus /</a><span class="mono muted">${c.id}</span></div>${head(esc(c.title), `Desa ${esc(c.village)} · ${c.reports} laporan pendukung`, btn('Gabungkan Kasus', 'merge') + btn('Verifikasi Kasus', 'verify', '', 'primary'))}<div class="row" style="margin-bottom:18px">${badge(c.category)}${badge(c.status)}${c.score >= 80 ? badge('Prioritas tinggi') : ''}${badge(c.sla)}</div><div class="tabs">${['Ringkasan', 'Bukti & Laporan', 'Verifikasi', 'Tugas & Progres', 'Riwayat Audit'].map((t) => btn(t, 'tab', `data-value="${t}"`, tab === t ? 'active' : '')).join('')}</div>${tab === 'Ringkasan' ? `<div class="grid two"><div class="stack"><div class="grid equal"><section class="card compact-map" style="padding:10px">${map([{ ...c, x: 50, y: 47 }])}<div class="row between" style="padding:10px 3px 0"><span class="mono muted">${c.lat.toFixed(4)}, ${c.lng.toFixed(4)}</span><a href="#peta">Buka peta ↗</a></div></section><section class="card"><div class="eyebrow">DAMPAK MASALAH</div><h2 style="margin:15px 0">${c.category === 'Jembatan' ? 'Akses dua dusun terganggu' : 'Aktivitas warga terdampak'}</h2><p>${esc(c.description)}</p><div class="notice amber" style="margin-top:20px">Risiko keselamatan ${c.severity.toLowerCase()}. ${c.reports} laporan dikonsolidasikan dalam radius ${c.id === 'CB-1790' ? 120 : 80} meter.</div></section></div>${scorePanel(c)}<section class="card"><div class="card-head"><h2>Laporan pendukung</h2>${btn('Bandingkan kandidat duplikat', 'merge')}</div>${gallery(c)}</section></div><aside class="stack"><section class="card"><h2>Linimasa & jejak keputusan</h2>${timeline(c.id)}</section><div class="notice">◈ Perlindungan data warga<br>Identitas pelapor tidak disertakan dalam portal publik. Bukti pada demo menggunakan foto simulasi bertema infrastruktur.</div></aside></div>` : tab === 'Bukti & Laporan' ? `<section class="card"><div class="card-head"><h2>${c.reports} laporan pendukung terkonsolidasi</h2>${btn('Bandingkan kandidat duplikat', 'merge')}</div>${gallery(c)}<p style="margin-top:20px">${esc(c.description)}</p></section>` : tab === 'Verifikasi' ? `<div class="grid equal">${scorePanel(c)}<section class="card"><h2>Hasil pra-verifikasi AI</h2><p style="margin:15px 0">Simulasi MiniMax M3 · 94% keaslian bukti · GPS dan timestamp konsisten. Kerusakan teridentifikasi pada ${esc(c.category.toLowerCase())}. Hasil ini membutuhkan keputusan petugas.</p><div class="notice amber">${esc(c.assessment)}</div><div class="row" style="margin-top:20px">${btn('Verifikasi & Prioritaskan', 'verify', '', 'primary')}${btn('Kirim Tugas Survei', 'assign')}</div></section></div>` : tab === 'Tugas & Progres' ? tasks(c.id) : audit(c.id)}<div class="actionbar"><span>Aksi kasus: <b class="mono">${c.id}</b></span>${btn('Ubah Status', 'status')}${btn('Ekspor Kasus', 'case-export')}${btn('Tugaskan Unit', 'assign')}${btn('Verifikasi & Prioritaskan', 'verify', '', 'primary')}</div>`;
}
function queue() {
  const list = filtered().filter(
    (c) =>
      ['Menunggu verifikasi', 'Perlu Kelengkapan', 'Perlu Survei Cepat'].includes(c.status) &&
      (queueFilter === 'Semua' || c.assessment === queueFilter),
  );
  return (
    head(
      'Antrean Pra-Verifikasi AI & Konsolidasi',
      'Pemeriksaan metadata, validasi foto, dan pengelompokan laporan dalam radius 50–100 meter.',
      btn('✧ Jalankan simulasi AI', 'ai', '', 'primary'),
    ) +
    `<div class="notice" style="margin-bottom:18px">✧ MiniMax M3 · Mode simulasi — hasil analisis menggunakan data demo; keputusan akhir berada pada verifikator.</div><div class="tabs">${['Semua', 'Perlu Verifikasi Manusia', 'Terindikasi Duplikat', 'Kualitas Media Rendah'].map((t) => btn(t, 'queue-filter', `data-value="${t}"`, queueFilter === t ? 'active' : '')).join('')}</div><div class="grid equal">${list.map((c) => `<section class="card"><div class="card-head"><div><span class="mono muted">${c.id} · radius ${c.id === 'CB-1790' ? 120 : 80} m${c.aiProcessed ? ' · AI selesai' : ''}</span><h2 style="margin-top:7px">${esc(c.title)}</h2></div>${badge(c.status)}</div>${gallery(c)}<div class="row" style="margin:16px 0">${badge(c.assessment === 'Kualitas Media Rendah' ? '62% · tinjau media' : '94% Asli')}${badge(c.assessment)}</div><p>Kerusakan teridentifikasi: ${c.category === 'Jembatan' ? 'retak struktural' : c.category === 'Jalan' ? 'lubang jalan' : 'gangguan fungsi fasilitas'}. ${Math.min(3, c.reports)} laporan mengarah pada objek yang sama.</p><div class="row" style="margin-top:17px">${btn('Setujui Sebagai Kasus Baru', 'verify', `data-id="${c.id}"`, 'primary')}${btn('Gabungkan ke Kasus Eksisting', 'merge', `data-id="${c.id}"`)}${btn('Kirim Tugas Survei Lapangan', 'assign', `data-id="${c.id}"`)}${btn('Minta Foto Tambahan', 'request-photo', `data-id="${c.id}"`)}${btn('Tolak Laporan', 'reject', `data-id="${c.id}"`, 'danger')}${btn('Detail ↗', 'detail', `data-id="${c.id}"`)}</div></section>`).join('') || '<div class="card empty">Tidak ada laporan dalam antrean ini.</div>'}</div>`
  );
}
function tasks(caseId) {
  const list = state.tasks.filter(
    (t) =>
      (!caseId || t.caseId === caseId) && (taskFilter === 'Semua Tugas' || t.type === taskFilter),
  );
  return `${!caseId ? head('Tugas & progres lapangan', 'Pantau petugas, batas layanan, dan hasil pekerjaan lapangan.') : ''}<div class="tabs">${['Semua Tugas', 'Survei Verifikasi', 'Perbaikan Fisik'].map((t) => btn(t, 'task-filter', `data-value="${t}"`, taskFilter === t ? 'active' : '')).join('')}</div><section class="card table-wrap"><table><thead><tr><th>KODE TUGAS / KASUS</th><th>PENANGGUNG JAWAB</th><th>BATAS SLA</th><th>PROGRES</th><th>BUKTI & AKSI</th></tr></thead><tbody>${list
    .map((t) => {
      const c = state.cases.find((c) => c.id === t.caseId);
      return `<tr><td><span class="mono">${t.id}</span><p>${esc(c?.title)}</p><a href="#kasus/${t.caseId}">${t.caseId} · ${esc(c?.village)}</a></td><td>${esc(t.unit)}<p>${t.type}</p></td><td><span class="mono">${t.deadline}</span><p>${t.progress === 100 ? 'Menunggu verifikasi hasil' : 'Normal · kalender demo Juli 2026'}</p></td><td><b class="mono">${t.progress}%</b><div class="progress"><i style="width:${t.progress}%"></i></div>${t.closed ? badge('Selesai') : ''}</td><td>${btn('Lihat / Perbarui', 'task-detail', `data-id="${t.id}"`)}${t.progress === 100 && !t.closed ? btn('Verifikasi Hasil', 'task-close', `data-id="${t.id}"`, 'primary') : ''}</td></tr>`;
    })
    .join(
      '',
    )}</tbody></table>${!list.length ? '<div class="empty">Belum ada tugas. Gunakan “Tugaskan Unit” pada detail kasus.</div>' : ''}</section>`;
}
function audit(caseId) {
  const list = state.logs.filter(
    (l) =>
      (!caseId || l.caseId === caseId) &&
      JSON.stringify(l).toLowerCase().includes(auditSearch.toLowerCase()) &&
      (!auditDate ||
        new Date(l.time).toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }) === auditDate),
  );
  return `${!caseId ? head('Audit log & tata kelola', 'Rekam jejak keputusan operator, alasan, dan perubahan data.') : ''}<div class="filters"><input data-search="audit" aria-label="Cari log" placeholder="Cari aktor, tindakan, atau ID kasus…" value="${esc(auditSearch)}" style="width:330px"><input type="date" aria-label="Tanggal audit" data-control="audit-date" value="${auditDate}"><small>${list.length} aktivitas ditemukan</small></div><section class="card table-wrap"><table><thead><tr><th>WAKTU / KORELASI</th><th>AKTOR</th><th>TINDAKAN</th><th>SEBELUM → SESUDAH</th><th>ALASAN</th></tr></thead><tbody>${list.map((l) => `<tr><td class="mono">${date(l.time)}<p>${esc(l.caseId)}</p></td><td>${esc(l.actor)}</td><td>${esc(l.action)}</td><td>${esc(l.before)}<br>→ ${esc(l.after)}</td><td><p>${esc(l.reason)}</p></td></tr>`).join('')}</tbody></table>${!list.length ? '<div class="empty">Tidak ada aktivitas sesuai pencarian.</div>' : ''}</section><p style="margin-top:15px;font-size:11px">Audit demo tersimpan lokal pada browser ini, belum menggunakan penyimpanan server yang tahan manipulasi.</p>`;
}
function exportsPage() {
  return (
    head(
      'Ekspor & integrasi pemerintah',
      'Data siap digunakan untuk perencanaan, pelaporan, dan koordinasi lintas instansi.',
    ) +
    `<div class="grid two"><section class="card"><h2>Ekspor dokumen standar</h2><p style="margin-top:7px">${state.cases.length} kasus · seluruh desa · dataset demo</p>${[
      ['GeoJSON', 'Geometri titik dan atribut kasus untuk aplikasi GIS.'],
      ['CSV', 'Rekapitulasi status, wilayah, dan skor prioritas.'],
      ['PDF', 'Preview laporan siap cetak / simpan sebagai PDF.'],
    ]
      .map(
        ([format, desc]) =>
          `<div class="integration"><div><h3>${format}</h3><p>${desc}</p></div>${btn('↓ ' + format, 'export', `data-value="${format}"`)}</div>`,
      )
      .join(
        '',
      )}</section><section class="card"><div class="card-head"><h2>Outbox monitoring</h2>${badge('Simulasi')}</div>${['Portal Satu Data Indonesia', 'SIPD Kemendagri', 'Sistem BPS'].map((s) => `<div class="integration"><div><h3>${s}</h3><p>${state.sync ? date(state.sync) : 'Belum disinkronkan pada sesi demo'}</p><small>${state.sync ? state.cases.length : 0} data terkirim (simulasi)</small></div><span class="badge teal">Tersambung</span></div>`).join('')}${btn(syncing ? '<span class="spinner"></span> Menyinkronkan…' : 'Jalankan Sinkronisasi Manual', 'sync', syncing ? 'disabled' : '', 'primary')}<p style="margin-top:15px;font-size:10px">Konektor disimulasikan; tidak ada data dikirim ke sistem pemerintah.</p></section></div>`
  );
}
function analytics() {
  return (
    head(
      'Analitik & heatmap',
      'Distribusi prioritas dan kondisi infrastruktur pada dataset aktif.',
    ) +
    `<div class="grid equal"><section class="card"><div class="card-head"><h2>Kasus per kategori infrastruktur</h2><small>${state.cases.length} kasus</small></div>${categories
      .map((k) => {
        const n = state.cases.filter((c) => c.category === k).length;
        return `<div class="score-line"><span>${k}</span><div class="progress"><i style="width:${(n / state.cases.length) * 100}%"></i></div><b>${n}</b></div>`;
      })
      .join(
        '',
      )}</section><section class="card"><div class="card-head"><h2>Tren penyelesaian kasus</h2><small>Tren ilustratif</small></div>${chart()}</section></div><section class="card" style="margin-top:18px"><div class="card-head"><h2>Heatmap tingkat kerusakan</h2><a href="#peta">Buka GIS penuh ↗</a></div>${map(
      state.cases.filter((c) => c.score >= 70),
      true,
    )}</section>`
  );
}
function admin() {
  return (
    head('Administrasi demo', 'Konfigurasi formula prioritas dan penyimpanan lokal.') +
    `<div class="grid equal"><section class="card"><h2>Komponen skor model v2.3</h2><p style="margin:12px 0">Konfigurasi digunakan sebagai rincian skor dasar. Skor aktif kasus dapat disesuaikan melalui override beralasan.</p><form id="weights-form" class="stack">${['Keselamatan', 'Warga terdampak', 'Laporan pendukung', 'SLA'].map((s, i) => `<label class="row between">${s}<input name="w${i}" type="number" min="0" max="40" required value="${state.weights[i]}"></label>`).join('')}<input name="reason" required placeholder="Alasan perubahan formula" aria-label="Alasan perubahan formula"><button class="primary">Simpan konfigurasi</button></form></section><section class="card"><h2>Konteks petugas</h2><p style="margin:15px 0">Budi Maulana · Operator Kecamatan Cisarua<br>Mode demo tanpa autentikasi server.</p><div class="notice">Perubahan tersimpan pada browser ini. Gunakan reset untuk mengulang skenario presentasi dari dataset awal.</div><div style="margin-top:20px">${btn('Reset seluruh data demo', 'reset-data', '', 'danger')}</div></section></div>`
  );
}
function render() {
  if (page === 'warga' || page === 'surveyor') {
    renderMobile({
      getState: () => state,
      save,
      toast,
      badge,
      evidence,
      map,
      timeline,
      gallery,
      readPhoto,
      showModal,
      closeModal,
      asset,
    });
    return;
  }
  const pub = ['publik', 'publik-ringkasan', 'statistik', 'metodologi'].includes(page);
  const nav = [
    ['ringkasan', '▦', 'Ringkasan'],
    ['peta', '◇', 'Peta & Kasus'],
    ['verifikasi', '◎', 'Antrean Verifikasi'],
    ['tugas', '▤', 'Tugas & Progres'],
    ['analitik', '⌁', 'Analitik & Heatmap'],
    ['ekspor', '⇩', 'Ekspor Laporan'],
  ];
  const content = pub
    ? publicPage()
    : page === 'ringkasan'
      ? dashboard()
      : page === 'peta'
        ? gis()
        : page === 'kasus'
          ? detail()
          : page === 'verifikasi'
            ? queue()
            : page === 'tugas'
              ? tasks()
              : page === 'audit'
                ? audit()
                : page === 'ekspor'
                  ? exportsPage()
                  : page === 'analitik'
                    ? analytics()
                    : admin();
  $('#app').innerHTML =
    `<div class="browser"><i></i><i></i><i></i><span class="mono">${pub ? 'pantaudesa.id' : 'app.pantaudesa.id'}/${page}${page === 'kasus' ? '/' + selected : ''}</span><em>SIGAP · DEMO KMIPN 2026</em></div>${
      pub
        ? `<header class="public-header">${brand()}<span class="badge">Portal Publik</span><nav>${[
            ['publik-ringkasan', 'Ringkasan'],
            ['publik', 'Peta & Daftar'],
            ['statistik', 'Statistik Publik'],
            ['metodologi', 'Metodologi'],
          ]
            .map(([p, t]) => `<a href="#${p}" class="${page === p ? 'active' : ''}">${t}</a>`)
            .join(
              '',
            )}</nav><div class="actions">${btn('Mobile ↗', 'mobile-menu')}${btn('Masuk Petugas', 'login')}${btn('+ Lapor Masalah', 'report', '', 'primary')}</div></header>${content}`
        : `<div class="shell"><aside class="sidebar">${brand()}<div class="nav-label">RUANG KERJA</div><nav>${nav.map(([p, i, t]) => `<a href="#${p}" class="${page === p || (page === 'kasus' && p === 'peta') ? 'active' : ''}"><span class="nav-icon">${i}</span>${t}${p === 'verifikasi' ? `<span class="count">${state.cases.filter((c) => c.status === 'Menunggu verifikasi').length}</span>` : ''}</a>`).join('')}</nav><div class="sidebar-bottom"><div class="nav-label">TATA KELOLA</div><nav><a href="#administrasi" class="${page === 'administrasi' ? 'active' : ''}"><span class="nav-icon">⚙</span>Administrasi</a><a href="#audit" class="${page === 'audit' ? 'active' : ''}"><span class="nav-icon">≡</span>Audit Log</a><a href="#publik"><span class="nav-icon">↗</span>Portal Publik</a><a href="#warga"><span class="nav-icon">▯</span>Mobile Warga</a><a href="#surveyor"><span class="nav-icon">▯</span>Mobile Surveyor</a></nav><div class="sidebar-note"><b>DEMO KMIPN 2026</b><br>Data lokal · perubahan tersimpan<br>◉ Mode simulasi aktif</div></div></aside><div class="workspace"><header class="topbar"><input data-search="global" aria-label="Cari kasus, desa, atau ID" placeholder="⌕  Cari kasus, desa, atau ID…" value="${esc(filters.search)}">${select('village', villages, 'Kec. Cisarua · Jul 2026')}<div class="profile"><span class="avatar">BM</span><div class="profile-name">Budi Maulana<small>Operator Kecamatan</small></div></div></header><main class="content">${content}</main></div></div>`
    }`;
}
function route() {
  const parts = location.hash.slice(1).split('/');
  page = parts[0] || 'publik';
  if (
    ![
      'publik',
      'publik-ringkasan',
      'statistik',
      'metodologi',
      'ringkasan',
      'peta',
      'kasus',
      'verifikasi',
      'tugas',
      'audit',
      'ekspor',
      'analitik',
      'administrasi',
      'warga',
      'surveyor',
    ].includes(page)
  )
    page = 'publik';
  if (parts[1]) selected = parts[1];
  if (page === 'kasus' && !state.cases.some((c) => c.id === selected)) {
    page = 'peta';
    toast('Kasus tidak ditemukan atau telah digabung.');
  }
  tab = 'Ringkasan';
  drawer = null;
  if (page === 'ringkasan') {
    filters.sla = '';
    filters.priority = '';
    filters.isNew = '';
    filters.severity = '';
    filters.status = '';
  }
  if (page === 'analitik') mapMode = 'Heatmap';
  render();
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route);
function showModal(title, body, wide = false) {
  modalFocus = document.activeElement;
  $('#modal-root').innerHTML =
    `<div class="modal-backdrop"><section class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="card-head"><h2 id="modal-title">${title}</h2>${btn('×', 'close-modal', 'aria-label="Tutup dialog"')}</div>${body}</section></div>`;
  $('#modal-root input, #modal-root select, #modal-root textarea, #modal-root button')?.focus();
}
function closeModal() {
  $('#modal-root').innerHTML = '';
  modalFocus?.focus();
}
const reasonField = () =>
  '<label>Alasan keputusan<textarea name="reason" required minlength="5" placeholder="Jelaskan dasar keputusan agar dapat ditelusuri…"></textarea></label>';
const formEnd = (label = 'Simpan keputusan') =>
  `<div class="actions">${btn('Batal', 'close-modal')}<button class="primary" type="submit">${label}</button></div></form>`;
function actionModal(action) {
  const c = current();
  if (!c) return;
  let body = `<p style="margin-bottom:18px">${c.id} · ${esc(c.title)}</p><form id="decision-form" data-kind="${action}" data-case="${c.id}">`;
  if (action === 'override')
    body += `<label>Skor prioritas baru (0–100)<input name="score" type="number" min="0" max="100" value="${c.score}" step="1" required></label>`;
  if (action === 'status')
    body += `<label>Status baru<select name="status">${options(statuses, c.status)}</select></label>`;
  if (action === 'assign')
    body += `<label>Jenis tugas<select name="type">${options(['Survei Verifikasi', 'Perbaikan Fisik'], page === 'verifikasi' ? 'Survei Verifikasi' : 'Perbaikan Fisik')}</select></label><label>Unit / petugas<select name="unit">${options(['Dinas PUPR Wilayah II', 'Surveyor Dedi', 'Tim Teknis Desa', 'Dinas Perhubungan'], 'Dinas PUPR Wilayah II')}</select></label><label>Batas penyelesaian<input type="date" name="deadline" value="2026-07-20" required></label>`;
  if (action === 'merge') {
    const candidates = state.cases.filter((x) => x.id !== c.id && x.category === c.category);
    if (!candidates.length) {
      showModal('Kandidat duplikat', '<p>Tidak ada kasus lain dalam kategori yang sama.</p>');
      return;
    }
    body += `<label>Gabungkan kandidat berikut ke ${c.id}<select name="source" id="merge-source">${candidates.map((x) => `<option value="${x.id}">${x.id} · ${esc(x.title)}</option>`).join('')}</select></label><div id="comparison">${comparison(c, candidates[0])}</div>`;
  }
  body +=
    reasonField() +
    formEnd(
      action === 'verify'
        ? 'Verifikasi & Prioritaskan'
        : action === 'merge'
          ? 'Konfirmasi Penggabungan'
          : 'Simpan keputusan',
    );
  showModal(
    {
      override: 'Override skor prioritas',
      status: 'Ubah status kasus',
      assign: 'Tugaskan unit lapangan',
      merge: 'Bandingkan & gabungkan kasus',
      verify: 'Verifikasi kasus',
      reject: 'Tolak laporan',
      'request-photo': 'Minta foto tambahan',
    }[action],
    body,
    action === 'merge',
  );
}
function comparison(a, b) {
  const distance = Math.round(Math.hypot((a.lat - b.lat) * 111320, (a.lng - b.lng) * 110520));
  return `<div class="grid equal">${[a, b].map((c, i) => `<div>${evidence(c, i)}<h3 style="margin-top:9px">${c.id} · Desa ${c.village}</h3><p>${esc(c.description)}</p><small class="mono">${c.lat.toFixed(4)}, ${c.lng.toFixed(4)}<br>17 Jul 2026 · ${i ? '08:20' : '08:10'} WIB</small></div>`).join('')}</div><div class="notice amber" style="margin-top:12px">Jarak GPS ${distance} m · ${distance > 120 ? 'Di luar radius otomatis; pastikan objek sama dan jelaskan alasan pengecualian.' : 'Lokasi berdekatan; konfirmasi objek yang sama sebelum menggabungkan.'}</div>`;
}
function download(content, type, name) {
  const url = URL.createObjectURL(new Blob([content], { type })),
    a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast(`${name} berhasil dibuat.`);
}
function exportData(format, cases = state.cases) {
  if (format === 'GeoJSON')
    download(
      JSON.stringify(geojson(cases), null, 2),
      'application/geo+json',
      'sigap-kasus.geojson',
    );
  else if (format === 'CSV') {
    const quote = (v) =>
      '"' +
      String(v)
        .replace(/^[=+@-]/, "'$&")
        .replaceAll('"', '""') +
      '"';
    download(
      '\ufeff' +
        [
          ['ID', 'Judul', 'Desa', 'Kategori', 'Status', 'Skor'],
          ...cases.map((c) => [c.id, c.title, c.village, c.category, c.status, c.score]),
        ]
          .map((r) => r.map(quote).join(','))
          .join('\r\n'),
      'text/csv;charset=utf-8',
      'sigap-rekap.csv',
    );
  } else {
    const report = `<h1>SIGAP · Laporan pembangunan desa</h1><p>Dataset simulasi KMIPN 2026 · ${cases.length} kasus · ${date(new Date())}</p><table><thead><tr><th>ID</th><th>Kasus / Wilayah</th><th>Status</th><th>Skor</th></tr></thead><tbody>${cases.map((c) => `<tr><td>${c.id}</td><td>${esc(c.title)}<br>Desa ${esc(c.village)}</td><td>${esc(c.status)}</td><td>${c.score}</td></tr>`).join('')}</tbody></table>`;
    document.querySelector('.report-print')?.remove();
    const el = document.createElement('article');
    el.className = 'report-print';
    el.innerHTML = report;
    document.body.append(el);
    showModal(
      'Preview laporan siap cetak',
      `<p style="margin-bottom:15px">Pilih “Simpan sebagai PDF” pada dialog cetak browser.</p><div style="max-height:50vh;overflow:auto">${report}</div><div class="actions">${btn('Cetak / Simpan PDF', 'print', '', 'primary')}</div>`,
      true,
    );
  }
}
document.addEventListener('click', async (e) => {
  const b = e.target.closest('[data-action]');
  if (!b) return;
  if (b.closest('#m-location-map')) return;
  const a = b.dataset.action,
    v = b.dataset.value,
    id = b.dataset.id;
  if (id && !['task-detail', 'task-close'].includes(a)) selected = id;
  if (a === 'close-modal') return closeModal();
  if (a === 'mobile-menu') {
    showModal(
      'Pilih aplikasi mobile',
      `<p style="margin-bottom:18px">Demo antarmuka warga dan surveyor. Data terhubung dengan dashboard pada browser yang sama.</p><div class="grid equal"><a href="#warga" data-action="close-modal" class="m-wide-button primary">Aplikasi Warga ↗</a><a href="#surveyor" data-action="close-modal" class="m-wide-button">Aplikasi Surveyor ↗</a></div>`,
    );
    return;
  }
  if (a === 'login') {
    filters = {
      village: '',
      category: '',
      status: '',
      severity: '',
      sla: '',
      search: '',
      priority: '',
      isNew: '',
    };
    location.hash = 'ringkasan';
    return;
  }
  if (a === 'detail') {
    location.hash = 'kasus/' + selected;
    return;
  }
  if (a === 'public-detail') {
    const c = current();
    showModal(
      'Progres penanganan fasilitas',
      `<span class="badge">${esc(c.category)} · Desa ${esc(c.village)}</span><h2 style="margin:15px 0">${esc(c.title)}</h2>${evidence(c)}<div class="row" style="margin:15px 0">${badge(c.status)}<small>${c.reports} laporan pendukung</small></div><p>${esc(c.description)}</p><div class="notice" style="margin-top:16px">${c.status === 'Selesai' ? 'Pekerjaan selesai dan hasil telah diverifikasi.' : c.status === 'Sedang Ditangani' ? 'Unit teknis sedang menangani fasilitas. Estimasi demo selesai 24 Juli 2026.' : 'Laporan menunggu tindak lanjut petugas. Estimasi selesai ditetapkan setelah pemeriksaan lapangan.'}<br>Identitas warga dan koordinat presisi tidak ditampilkan.</div>`,
    );
    return;
  }
  if (['override', 'status', 'assign', 'merge', 'verify', 'reject', 'request-photo'].includes(a))
    return actionModal(a);
  if (a === 'marker') {
    drawer = id;
    render();
    return;
  }
  if (a === 'close-drawer') drawer = null;
  if (a === 'zoom-in') zoom = Math.min(2.5, zoom + 0.25);
  if (a === 'zoom-out') zoom = Math.max(0.75, zoom - 0.25);
  if (a === 'zoom-reset') zoom = 1;
  if (a === 'view') view = v;
  if (a === 'tab') tab = v;
  if (a === 'queue-filter') queueFilter = v;
  if (a === 'task-filter') taskFilter = v;
  if (a === 'reset-filters') {
    Object.keys(filters).forEach((k) => (filters[k] = ''));
    zoom = 1;
  }
  if (a === 'period') {
    toast('Dataset demo menggunakan periode Juli 2026.');
    return;
  }
  if (a === 'metric') {
    filters.status = '';
    filters.severity = '';
    filters.sla = '';
    filters.priority = '';
    filters.isNew = '';
    if (v === 'Verifikasi' || v === 'Kelengkapan') {
      queueFilter = v === 'Kelengkapan' ? 'Kualitas Media Rendah' : 'Semua';
      location.hash = 'verifikasi';
    } else {
      if (v === 'SLA') filters.sla = 'Melewati SLA';
      if (v === 'Prioritas') filters.priority = 'high';
      if (v === 'Peta & Kasus') filters.isNew = 'true';
      location.hash = 'peta';
    }
    return;
  }
  if (a === 'report') {
    showModal(
      'Buat laporan cepat',
      `<p style="margin-bottom:18px">Coba kirim laporan. Data masuk ke antrean verifikasi demo.</p><form id="report-form"><div class="grid equal"><label>Kategori<select name="category">${options(categories, 'Jalan')}</select></label><label>Desa<select name="village">${options(villages, 'Ciburuy')}</select></label></div><label>Judul masalah<input name="title" required minlength="8" maxlength="120" placeholder="Contoh: Jalan berlubang dekat balai desa"></label><label>Deskripsi kondisi<textarea name="description" required minlength="15" placeholder="Jelaskan kerusakan dan dampaknya bagi warga"></textarea></label><label>Foto bukti demo (opsional, maks. 1 MB)<input type="file" name="photo" accept="image/png,image/jpeg,image/webp"></label><small>Tanpa unggahan, laporan menggunakan ilustrasi infrastruktur.</small><label>Pilih lokasi pada peta simulasi<div id="coordinate-picker">${map([], false, true)}</div></label><div class="grid equal"><label>Lintang<input name="lat" type="number" step="any" min="-90" max="90" value="-6.8698" required></label><label>Bujur<input name="lng" type="number" step="any" min="-180" max="180" value="107.5401" required></label></div>${formEnd('Kirim laporan')}`,
    );
    return;
  }
  if (a === 'case-export') {
    exportData('GeoJSON', [current()]);
    return;
  }
  if (a === 'export') {
    exportData(v);
    return;
  }
  if (a === 'print') {
    window.print();
    return;
  }
  if (a === 'sync' || a === 'ai') {
    if (syncing) return;
    syncing = true;
    b.disabled = true;
    b.innerHTML = '<span class="spinner"></span> Memproses simulasi…';
    await new Promise((r) => setTimeout(r, 1400));
    if (a === 'sync') {
      state.sync = new Date().toISOString();
      log(
        state,
        'OUTBOX',
        'Sinkronisasi simulasi',
        'Antrean lokal',
        `${state.cases.length} data terkirim`,
        'Simulasi konektor Satu Data, SIPD, dan BPS.',
      );
    } else {
      state.cases
        .filter((c) => c.status === 'Menunggu verifikasi')
        .forEach((c) => (c.aiProcessed = true));
      log(
        state,
        'AI-DEMO',
        'Pra-verifikasi AI',
        'Belum dianalisis',
        'Analisis simulasi selesai',
        'Metadata, media, dan kandidat duplikat ditinjau dengan skenario demo.',
      );
    }
    syncing = false;
    save();
    render();
    toast(
      a === 'sync'
        ? 'Simulasi sinkronisasi berhasil.'
        : 'Analisis AI selesai: skor keaslian dan kandidat konsolidasi siap ditinjau.',
    );
    return;
  }
  if (a === 'task-detail') {
    const t = state.tasks.find((t) => t.id === id),
      c = state.cases.find((c) => c.id === t.caseId);
    showModal(
      'Laporan lapangan · ' + t.id,
      `<p style="margin-bottom:15px">${esc(t.unit)} · ${esc(c.title)}</p><div class="grid equal"><div>${evidence(c)}<small>Sebelum · foto simulasi kondisi awal</small></div><div>${t.photo ? `<img class="evidence" src="${esc(t.photo)}" alt="Bukti progres pekerjaan">` : evidence(c, 1)}<small>Sesudah / progres · ${t.photo ? 'foto unggahan' : 'foto simulasi'}</small></div></div><form id="task-form" data-id="${id}" style="margin-top:18px"><label>Progres pekerjaan (%)<input name="progress" type="number" min="0" max="100" required value="${t.progress}" ${t.closed ? 'readonly' : ''}></label><label>Foto progres (opsional, maks. 1 MB)<input type="file" name="photo" accept="image/png,image/jpeg,image/webp" ${t.closed ? 'disabled' : ''}></label>${reasonField()}${t.closed ? '<p>Tugas telah ditutup dan tidak dapat diperbarui.</p></form>' : formEnd('Simpan progres')}`,
      true,
    );
    return;
  }
  if (a === 'task-close') {
    showModal(
      'Verifikasi hasil pekerjaan',
      `<form id="close-task-form" data-id="${id}"><p>Konfirmasi bahwa bukti pekerjaan ${id} sudah diperiksa. Kasus terkait akan ditandai selesai.</p>${reasonField()}${formEnd('Verifikasi & tutup kasus')}`,
    );
    return;
  }
  if (a === 'reset-data') {
    showModal(
      'Reset data demo',
      `<p>Seluruh laporan, tugas, dan perubahan lokal akan diganti dengan dataset awal. Tindakan ini tidak dapat dibatalkan.</p><div class="actions" style="margin-top:20px">${btn('Batal', 'close-modal')}${btn('Reset sekarang', 'confirm-reset', '', 'danger')}</div>`,
    );
    return;
  }
  if (a === 'confirm-reset') {
    state = initialState();
    save();
    closeModal();
    toast('Dataset demo dikembalikan ke kondisi awal.');
  }
  render();
});
document.addEventListener('change', (e) => {
  const el = e.target;
  if (el.dataset.filter) {
    filters[el.dataset.filter] = el.value;
    render();
  }
  if (el.dataset.control) {
    if (el.dataset.control === 'layer') mapLayer = el.value;
    if (el.dataset.control === 'map-mode') mapMode = el.value;
    if (el.dataset.control === 'audit-date') auditDate = el.value;
    render();
  }
  if (el.id === 'merge-source')
    $('#comparison').innerHTML = comparison(
      current(),
      state.cases.find((c) => c.id === el.value),
    );
});
document.addEventListener('input', (e) => {
  const kind = e.target.dataset.search;
  if (!kind) return;
  const start = e.target.selectionStart;
  if (kind === 'audit') auditSearch = e.target.value;
  else filters.search = e.target.value;
  if (kind === 'global' && page !== 'peta') {
    page = 'peta';
    history.replaceState(null, '', '#peta');
  }
  render();
  const el = document.querySelector(`[data-search="${kind}"]`);
  el?.focus();
  el?.setSelectionRange(start, start);
});
document.addEventListener('click', (e) => {
  const picker = e.target.closest('#coordinate-picker');
  if (!picker) return;
  const rect = picker.getBoundingClientRect(),
    x = (e.clientX - rect.left) / rect.width,
    y = (e.clientY - rect.top) / rect.height;
  $('#report-form [name=lat]').value = (-6.9 + y * 0.06).toFixed(4);
  $('#report-form [name=lng]').value = (107.5 + x * 0.08).toFixed(4);
  picker.querySelector('.picked')?.remove();
  const p = document.createElement('span');
  p.className = 'marker picked';
  p.style.cssText = `left:${x * 100}%;top:${y * 100}%;--pin:#c0392b`;
  picker.querySelector('.map').append(p);
});
async function readPhoto(file) {
  if (!file?.size) return null;
  if (file.size > 1024 * 1024) throw Error('Foto maksimal 1 MB. Pilih berkas yang lebih kecil.');
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    throw Error('Gunakan foto PNG, JPEG, atau WebP.');
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(Error('Foto tidak dapat dibaca.'));
    r.readAsDataURL(file);
  });
}
document.addEventListener('submit', async (e) => {
  if (e.target.id.startsWith('mobile-')) return;
  e.preventDefault();
  const form = e.target,
    data = new FormData(form),
    get = (k) => String(data.get(k) || '').trim();
  try {
    if (form.id === 'decision-form') {
      const id = form.dataset.case,
        c = state.cases.find((c) => c.id === id),
        kind = form.dataset.kind,
        reason = get('reason');
      if (kind === 'merge') mergeCases(state, id, get('source'), reason);
      else if (kind === 'override')
        updateCase(state, id, { score: Number(get('score')) }, 'Override Skor Prioritas', reason);
      else if (kind === 'assign') {
        const task = {
          id: `TGS-${Date.now().toString().slice(-7)}`,
          caseId: id,
          unit: get('unit'),
          type: get('type'),
          progress: 0,
          deadline: get('deadline'),
        };
        state.tasks.unshift(task);
        updateCase(
          state,
          id,
          { status: task.type === 'Survei Verifikasi' ? 'Perlu Survei Cepat' : 'Sedang Ditangani' },
          'Penugasan Unit',
          reason,
        );
        log(state, id, 'Tugas dibuat', 'Belum ditugaskan', `${task.id} · ${task.unit}`, reason);
      } else
        updateCase(
          state,
          id,
          {
            status:
              kind === 'verify'
                ? 'Terverifikasi'
                : kind === 'reject'
                  ? 'Ditolak'
                  : kind === 'request-photo'
                    ? 'Perlu Kelengkapan'
                    : get('status'),
          },
          kind === 'verify'
            ? 'Verifikasi Kasus'
            : kind === 'request-photo'
              ? 'Permintaan Foto Tambahan'
              : 'Perubahan Status',
          reason,
        );
    }
    if (form.id === 'report-form') {
      const photo = await readPhoto(data.get('photo'));
      const id = `CB-${Math.max(1790, ...state.cases.map((c) => Number(c.id.slice(3)))) + 1}`;
      state.cases.unshift({
        id,
        title: get('title'),
        description: get('description'),
        category: get('category'),
        village: get('village'),
        lat: Number(get('lat')),
        lng: Number(get('lng')),
        status: 'Menunggu verifikasi',
        score: 50,
        reports: 1,
        severity: 'Berat',
        sla: 'Normal',
        x: 30,
        y: 45,
        isNew: true,
        date: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }),
        assessment: photo ? 'Perlu Verifikasi Manusia' : 'Kualitas Media Rendah',
        photo,
      });
      log(
        state,
        id,
        'Laporan publik diterima',
        'Belum ada laporan',
        'Menunggu verifikasi',
        'Laporan baru melalui formulir demo portal publik.',
        'Warga · Pelapor (privat)',
      );
      save();
      closeModal();
      render();
      toast(`Laporan ${id} berhasil dikirim ke antrean verifikasi.`);
      return;
    }
    if (form.id === 'task-form') {
      const t = state.tasks.find((t) => t.id === form.dataset.id);
      if (t.closed) throw Error('Tugas telah ditutup.');
      const photo = await readPhoto(data.get('photo'));
      log(
        state,
        t.caseId,
        'Pembaruan Progres',
        t.progress + '%',
        get('progress') + '%',
        get('reason'),
      );
      t.progress = Number(get('progress'));
      if (photo) t.photo = photo;
    }
    if (form.id === 'close-task-form') {
      const t = state.tasks.find((t) => t.id === form.dataset.id);
      if (t.progress !== 100) throw Error('Progres harus 100% sebelum penutupan.');
      updateCase(
        state,
        t.caseId,
        { status: 'Selesai' },
        'Verifikasi Hasil Pekerjaan',
        get('reason'),
      );
      t.closed = true;
    }
    if (form.id === 'weights-form') {
      const weights = [0, 1, 2, 3].map((i) => Number(get('w' + i)));
      const total = weights.reduce((a, b) => a + b, 0);
      if (total <= 0 || total > 100) throw Error('Jumlah bobot komponen harus antara 1 dan 100.');
      log(
        state,
        'MODEL-v2.3',
        'Perubahan Formula',
        state.weights.join('/'),
        weights.join('/'),
        get('reason'),
      );
      state.weights = weights;
    }
    save();
    closeModal();
    render();
    toast('Perubahan tersimpan dan tercatat di audit log.');
  } catch (error) {
    toast(error.message);
  }
});
document.addEventListener('keydown', (e) => {
  const modal = $('.modal');
  if (!modal) return;
  if (e.key === 'Escape') closeModal();
  if (e.key === 'Tab') {
    const els = [...modal.querySelectorAll('button,input,select,textarea,a[href]')].filter(
        (x) => !x.disabled,
      ),
      first = els[0],
      last = els.at(-1);
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
});
route();

window.addEventListener('storage', (e) => {
  if (e.key === KEY && e.newValue) {
    try {
      state = JSON.parse(e.newValue);
      render();
    } catch {
      toast('Perubahan dari tab lain tidak dapat dimuat.');
    }
  }
});
