import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState, updateCase, mergeCases, geojson } from '../src/store.js';
test('dataset supports the five queue counts in the reference', () => {
  const { cases } = initialState();
  assert.equal(cases.length, 37);
  assert.equal(cases.filter((c) => c.isNew).length, 23);
  assert.equal(cases.filter((c) => c.status === 'Menunggu verifikasi').length, 14);
  assert.equal(cases.filter((c) => c.sla === 'Melewati SLA' && c.status !== 'Selesai').length, 6);
  assert.equal(cases.filter((c) => c.score >= 80).length, 9);
  assert.equal(cases.filter((c) => c.assessment === 'Kualitas Media Rendah').length, 11);
});
test('override requires a reason and records the previous score', () => {
  const s = initialState();
  assert.throws(() => updateCase(s, 'CB-1790', { score: 90 }, 'Override', ''));
  assert.equal(s.cases[0].score, 82);
  updateCase(s, 'CB-1790', { score: 90 }, 'Override', 'Risiko keselamatan meningkat');
  assert.equal(s.cases[0].score, 90);
  assert.equal(s.cases[0].baseScore, 82);
  assert.throws(() =>
    updateCase(s, 'CB-1790', { score: 101 }, 'Override', 'Nilai di luar rentang'),
  );
  assert.match(s.logs[0].before, /82/);
  assert.match(s.logs[0].after, /90/);
});
test('merge conserves report counts and moves task and citizen references', () => {
  const s = initialState(),
    sum = s.cases.reduce((n, c) => n + c.reports, 0);
  s.mobile = { reports: [{ caseId: 'CB-1791' }], outbox: [] };
  mergeCases(s, 'CB-1790', 'CB-1791', 'Objek fasilitas yang sama');
  assert.equal(s.cases.length, 36);
  assert.equal(
    s.cases.reduce((n, c) => n + c.reports, 0),
    sum,
  );
  assert.equal(s.tasks[0].caseId, 'CB-1790');
  assert.equal(s.mobile.reports[0].caseId, 'CB-1790');
  assert.throws(() => mergeCases(s, 'CB-1790', 'CB-1790', 'Alasan'));
});
test('GeoJSON uses longitude before latitude and excludes private input', () => {
  const s = initialState();
  s.cases[0].photo = 'private-photo';
  const g = geojson(s.cases);
  assert.equal(g.type, 'FeatureCollection');
  assert.deepEqual(g.features[0].geometry.coordinates, [107.5401, -6.8698]);
  assert.equal(g.features[0].properties.photo, undefined);
});
