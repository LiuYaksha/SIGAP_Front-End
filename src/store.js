export const categories = ['Jalan', 'Jembatan', 'Air Bersih', 'Fasilitas Umum', 'Irigasi'];
export const villages = [
  'Ciburuy',
  'Kaler',
  'Girang',
  'Wetan',
  'Babakan',
  'Patrol',
  'Cipada',
  'Jambudipa',
];
export const statuses = [
  'Menunggu verifikasi',
  'Terverifikasi',
  'Menunggu Penugasan',
  'Sedang Ditangani',
  'Perlu Survei Cepat',
  'Perlu Kelengkapan',
  'Selesai',
  'Ditolak',
];
const titles = [
  'Jembatan retak RW 07, Dusun Kaler',
  'Jalan berlubang parah akses Pasar Ciburuy',
  'Pipa distribusi air bersih bocor 3 dusun',
  'Penerangan jalan desa mati sepanjang 500 meter',
  'Longsoran tebing menutup saluran irigasi sawah',
];
export function initialState() {
  const cases = Array.from({ length: 37 }, (_, i) => ({
    id: `CB-${1790 + i}`,
    title:
      i < 5
        ? titles[i]
        : `${['Jalan lingkungan berlubang', 'Jembatan penghubung perlu perbaikan', 'Pipa air mengalami kebocoran', 'Lampu penerangan tidak menyala', 'Saluran irigasi tersumbat'][i % 5]} RW ${String((i % 9) + 1).padStart(2, '0')}`,
    category:
      i < 5
        ? ['Jembatan', 'Jalan', 'Air Bersih', 'Fasilitas Umum', 'Irigasi'][i]
        : categories[i % 5],
    village: i < 5 ? ['Kaler', 'Ciburuy', 'Ciburuy', 'Wetan', 'Girang'][i] : villages[i % 8],
    score:
      i < 5
        ? [82, 74, 89, 45, 91][i]
        : [7, 14, 17, 21, 24, 28].includes(i)
          ? 82 + (i % 10)
          : 35 + ((i * 7) % 44),
    status:
      i === 1
        ? 'Sedang Ditangani'
        : i === 3
          ? 'Menunggu Penugasan'
          : i === 4
            ? 'Perlu Survei Cepat'
            : i < 17
              ? 'Menunggu verifikasi'
              : i < 27
                ? 'Sedang Ditangani'
                : i < 32
                  ? 'Terverifikasi'
                  : 'Selesai',
    reports: i === 0 ? 8 : 2 + (i % 7),
    severity: i === 0 || i === 4 ? 'Kritis' : i % 3 ? 'Berat' : 'Ringan',
    isNew: i < 23,
    sla: i % 6 === 0 ? 'Melewati SLA' : i % 3 === 0 ? 'Mendekati SLA' : 'Normal',
    x: 15 + ((i * 19) % 71),
    y: 17 + ((i * 13) % 61),
    lat: -6.8698 + i * 0.001,
    lng: 107.5401 + i * 0.001,
    description:
      i === 0
        ? 'Retakan pada struktur jembatan mengganggu akses dua dusun dan perjalanan anak sekolah. Diperlukan pemeriksaan teknis untuk memastikan keamanan.'
        : 'Kerusakan fasilitas mengganggu aktivitas warga. Laporan telah dilengkapi dokumentasi kondisi lapangan.',
    date: '2026-07-17',
    assessment:
      i % 3 === 0
        ? 'Terindikasi Duplikat'
        : i % 3 === 1 || i === 35
          ? 'Perlu Verifikasi Manusia'
          : 'Kualitas Media Rendah',
  }));
  return {
    cases,
    tasks: [
      {
        id: 'TGS-3391',
        caseId: 'CB-1791',
        unit: 'Dinas PUPR Wilayah II',
        type: 'Perbaikan Fisik',
        progress: 50,
        deadline: '2026-07-19',
      },
      {
        id: 'TGS-3402',
        caseId: 'CB-1794',
        unit: 'Surveyor Dedi',
        type: 'Survei Verifikasi',
        progress: 100,
        deadline: '2026-07-18',
      },
    ],
    logs: [
      {
        time: '2026-07-17T01:40:00.000Z',
        caseId: 'CB-1790',
        actor: 'Budi Maulana · Operator',
        action: 'Penggabungan laporan',
        before: '5 laporan',
        after: '8 laporan',
        reason: 'Objek jembatan sama dalam radius 120 meter.',
      },
    ],
    sync: null,
    weights: [34, 22, 16, 10],
  };
}
export function log(
  state,
  caseId,
  action,
  before,
  after,
  reason,
  actor = 'Budi Maulana · Operator',
) {
  state.logs.unshift({
    time: new Date().toISOString(),
    caseId,
    actor,
    action,
    before: String(before),
    after: String(after),
    reason,
  });
}
export function updateCase(state, id, patch, action, reason) {
  if (!reason?.trim()) throw Error('Alasan wajib diisi.');
  const c = state.cases.find((c) => c.id === id);
  if (!c) throw Error('Kasus tidak ditemukan.');
  if ('score' in patch) {
    if (!Number.isInteger(patch.score) || patch.score < 0 || patch.score > 100)
      throw Error('Skor harus bilangan bulat antara 0 dan 100.');
    c.baseScore ??= c.score;
  }
  const before = Object.keys(patch)
    .map((k) => `${k}: ${c[k]}`)
    .join(', ');
  Object.assign(c, patch);
  log(
    state,
    id,
    action,
    before,
    Object.entries(patch)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', '),
    reason,
  );
  return c;
}
export function mergeCases(state, targetId, sourceId, reason) {
  if (targetId === sourceId) throw Error('Pilih kasus berbeda.');
  const source = state.cases.find((c) => c.id === sourceId),
    target = state.cases.find((c) => c.id === targetId);
  if (!source || !target) throw Error('Kasus tidak ditemukan.');
  updateCase(
    state,
    targetId,
    { reports: target.reports + source.reports },
    'Penggabungan kasus',
    reason,
  );
  state.tasks.forEach((t) => {
    if (t.caseId === sourceId) t.caseId = targetId;
  });
  state.mobile?.reports.forEach((r) => {
    if (r.caseId === sourceId) r.caseId = targetId;
  });
  state.mobile?.outbox.forEach((o) => {
    if (o.payload?.merge === sourceId) o.payload.merge = targetId;
  });
  target.photos = [
    ...new Set(
      [...(target.photos || []), target.photo, ...(source.photos || []), source.photo].filter(
        Boolean,
      ),
    ),
  ];
  state.cases = state.cases.filter((c) => c.id !== sourceId);
  log(state, targetId, 'Konsolidasi tiket', sourceId, targetId, reason);
}
export function geojson(cases) {
  return {
    type: 'FeatureCollection',
    features: cases.map((c) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [c.lng, c.lat] },
      properties: {
        id: c.id,
        title: c.title,
        village: c.village,
        status: c.status,
        score: c.score,
      },
    })),
  };
}
