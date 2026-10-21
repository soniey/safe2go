import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { cameras, detections } = await server.ssrLoadModule('/src/data/roadVision.js');
  const { default: CameraFeed } = await server.ssrLoadModule('/src/components/road-vision/CameraFeed.jsx');
  const paths = new Set();
  for (const camera of cameras) {
    const visible = camera.status === 'Online' ? detections.filter(item => item.cameraId === camera.id) : [];
    const markup = renderToStaticMarkup(createElement(CameraFeed, { camera, detections: visible, selectedId: visible[0]?.id, onSelect: () => {} }));
    if (camera.image) {
      const bytes = readFileSync(`public${camera.image}`);
      assert.equal(bytes.readUInt16BE(0), 0xffd8, 'Local image must be a JPEG');
      paths.add(camera.image);
      assert.ok(markup.includes(camera.image));
      assert.ok(markup.includes(camera.id));
      assert.ok(markup.includes(camera.location));
      assert.ok(markup.includes(camera.status.toUpperCase()));
      assert.equal((markup.match(/aria-pressed=/g) ?? []).length, visible.length);
    } else assert.ok(markup.includes('No active feed'));
  }
  assert.equal(paths.size, 7, 'Seven online cameras have existing images assigned');
  const { createRoadVisionIncident: create, readRoadVisionIncidents: read, findIncident, INCIDENT_STORAGE_KEY: key } = await server.ssrLoadModule('/src/utils/roadVisionIncidents.js');
  const values = new Map();
  const storage = { getItem: name => values.get(name) ?? null, setItem: (name, value) => values.set(name, value) };
  assert.equal(new Set(cameras.map(camera => camera.id)).size, cameras.length);
  assert.equal(cameras.filter(camera => camera.status === 'Online').length, 7);
  assert.equal(create('DET-002', storage).incident.id, 'RG-003');
  assert.equal(create('DET-001', storage).incident.id, 'RG-001');
  assert.equal(read(storage).length, 0);
  const first = create('DET-003', storage);
  assert.equal(first.created, true);
  assert.equal(first.incident.status, 'Detected');
  assert.equal(first.incident.source, 'Road Vision');
  assert.equal(create('DET-003', storage).created, false);
  assert.equal(read(storage).length, 1);
  assert.equal(findIncident(detections.find(item => item.id === 'DET-003'), read(storage)).id, first.incident.id);
  const second = create('DET-004', storage);
  assert.notEqual(second.incident.id, first.incident.id);
  assert.equal(read(storage).length, 2);
  assert.throws(() => create('missing', storage));
  for (const detection of detections) {
    const { x, y, width, height } = detection.box;
    assert.ok(x >= 0 && y >= 0 && width > 0 && height > 0 && x + width <= 100 && y + height <= 100);
    assert.ok(cameras.some(camera => camera.id === detection.cameraId && camera.status === 'Online'));
    assert.ok(['SAFE', 'WATCH', 'HIGH', 'CRITICAL'].includes(detection.risk));
  }
  assert.ok(cameras.some(camera => camera.status === 'Online' && !detections.some(item => item.cameraId === camera.id)));
  for (const invalid of ['invalid json', '{}', '[{}]', JSON.stringify([first.incident, first.incident])]) {
    storage.setItem(key, invalid);
    assert.throws(() => create('DET-004', storage));
    assert.equal(storage.getItem(key), invalid, 'Invalid data must not be overwritten');
  }
  assert.throws(() => create('DET-003', { getItem: () => null, setItem: () => { throw new Error('quota exceeded'); } }), /quota exceeded/);
  console.log('Road Vision checks passed: data, existing links, creation, deduplication, persistence, boxes, empty camera, invalid storage, write failure.');
} finally { await server.close(); }
