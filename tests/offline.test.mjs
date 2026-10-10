import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { Script, createContext } from 'node:vm';
import { loadStudyData } from '../web/data-loader.js';
import { offlineScripts } from '../tools/build-offline.mjs';

test('offline data loads without fetch; missing local data fails with actionable guidance', async () => {
  const originalFetch = globalThis.fetch, originalLocation = globalThis.location;
  let requests = 0;
  globalThis.fetch = () => { requests++; throw Error('Network must not be used'); };
  globalThis.location = { protocol: 'file:' };
  try {
    const { dataScript } = await offlineScripts();
    const context = createContext({});
    new Script(dataScript).runInContext(context);
    globalThis.TOEIC_OFFLINE_DATA = context.TOEIC_OFFLINE_DATA;
    const data = await loadStudyData();
    assert.equal(data.slice(0, 4).reduce((n, b) => n + b.questions.length, 0), 800);
    assert.equal(data[4].length, 1041);
    assert.equal(Object.keys(data[5]).length, 4);
    delete globalThis.TOEIC_OFFLINE_DATA;
    await assert.rejects(loadStudyData(), /开始练习.html/);
    globalThis.TOEIC_OFFLINE_DATA = [];
    await assert.rejects(loadStudyData(), /不完整/);
    assert.equal(requests, 0);
  } finally {
    delete globalThis.TOEIC_OFFLINE_DATA;
    globalThis.fetch = originalFetch;
    if (originalLocation === undefined) delete globalThis.location;
    else globalThis.location = originalLocation;
  }
});

test('online loader still fetches the same six resources and rejects HTTP failures', async () => {
  const originalFetch = globalThis.fetch, originalLocation = globalThis.location;
  const requests = [];
  globalThis.location = { protocol: 'https:' };
  try {
    globalThis.fetch = async url => {
      requests.push(url);
      return { ok: true, json: async () => url };
    };
    assert.deepEqual(await loadStudyData(), [
      'data/test1.json', 'data/test2.json', 'data/test3.json', 'data/test4.json',
      'data/vocabulary.json', 'data/audio.json',
    ]);
    assert.equal(requests.length, 6);
    globalThis.fetch = async () => ({ ok: false });
    await assert.rejects(loadStudyData(), /无法加载/);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalLocation === undefined) delete globalThis.location;
    else globalThis.location = originalLocation;
  }
});

test('classic offline bundle compiles and embedded datasets match original JSON exactly', async () => {
  const { bundle, dataScript } = await offlineScripts();
  new Script(bundle);
  assert.doesNotMatch(bundle, /^\s*(?:import |export )/m);
  const context = createContext({});
  new Script(dataScript).runInContext(context);
  for (const [i, name] of ['test1', 'test2', 'test3', 'test4', 'vocabulary', 'audio'].entries()) {
    const original = JSON.parse(await readFile(new URL(`../web/data/${name}.json`, import.meta.url), 'utf8'));
    assert.deepEqual(JSON.parse(JSON.stringify(context.TOEIC_OFFLINE_DATA[i])), original);
  }
});

test('offline output has classic local scripts, all referenced images/audio and no server fetches', async () => {
  const base = new URL('../dist/offline/toeic-offline/', import.meta.url);
  const html = await readFile(new URL('开始练习.html', base), 'utf8');
  assert.doesNotMatch(html, /type="module"|(?:src|href)="https?:/);
  assert.match(html, /connect-src 'none'/);
  assert.match(html, /<script defer src="offline-data.js"><\/script>\s*<script defer src="offline-app.js">/);
  const context = createContext({});
  new Script(await readFile(new URL('offline-data.js', base), 'utf8')).runInContext(context);
  const data = context.TOEIC_OFFLINE_DATA;
  const resources = new Set(['offline-app.js', 'styles.css', '使用说明.txt']);
  for (const bank of data.slice(0, 4)) {
    for (const group of bank.groups) for (const im of group.images) resources.add(im.src);
    for (const q of bank.questions) resources.add(`images/p${String(q.explanationPage).padStart(3, '0')}.webp`);
    resources.add(`media/test${bank.test}.mp3`);
  }
  for (const audio of Object.values(data[5]))
    for (const cue of Object.values(audio.groups)) resources.add(cue.src);
  await Promise.all([...resources].map(file => access(new URL(file, base))));
});
