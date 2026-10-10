// A DOM adapter exercises the shipped classic scripts without any network or server.
// This verifies application execution, not actual browser rendering/media decoding.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createContext, Script } from 'node:vm';
import { webcrypto } from 'node:crypto';

const base = new URL('../dist/offline/toeic-offline/', import.meta.url);
const settle = () => new Promise(resolve => setImmediate(resolve));

async function app(storage = new Map()) {
  const elements = new Map(), handlers = {}, windowHandlers = {}, downloads = [];
  const element = selector => {
    if (!elements.has(selector)) elements.set(selector, {
      dataset: {}, innerHTML: '', textContent: '', value: '', paused: true,
      classList: { toggle() {}, add() {}, remove() {}, contains() { return false; } },
      pause() { this.paused = true; }, play() { this.paused = false; return Promise.resolve(); },
      getAttribute(name) { return this[name] ?? null; },
      removeAttribute(name) { delete this[name]; },
      showModal() { this.open = true; }, close() { this.open = false; },
      click() {}, focus() {},
    });
    return elements.get(selector);
  };
  const context = createContext({
    document: {
      querySelector: selector => selector.startsWith('#') ? element(selector) : null,
      querySelectorAll: () => [], body: element('body'),
      addEventListener: (event, handler) => { handlers[event] = handler; },
      createElement: () => element('download'),
    },
    window: { addEventListener: (event, handler) => { windowHandlers[event] = handler; } },
    navigator: {}, location: { protocol: 'file:', hash: '' },
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
    crypto: webcrypto, structuredClone, Blob, console,
    URL: { createObjectURL: blob => { downloads.push(blob); return 'blob:backup'; }, revokeObjectURL() {} },
    fetch: () => { throw Error('Offline app attempted a network request'); },
    setTimeout: () => 1, clearTimeout() {}, setInterval() {},
  });
  for (const name of ['offline-data.js', 'offline-app.js'])
    new Script(await readFile(new URL(name, base), 'utf8'), { filename: name }).runInContext(context);
  await settle();
  const click = async dataset => {
    await handlers.click({ target: { closest: () => ({ dataset }) } });
    await windowHandlers.hashchange();
  };
  return { context, elements, element, handlers, storage, downloads, click,
    navigate: async hash => { context.location.hash = hash; await windowHandlers.hashchange(); },
    save: () => element('#save-status').onclick(),
  };
}

test('offline scripts render four tests, answer/reveal, select local audio and preserve answers on reload', async () => {
  const run = await app();
  assert.match(run.element('#main').innerHTML, /第 4 套/);
  await run.click({ action: 'setup', test: '1', section: 'listening' });
  run.element('#begin-session').onclick();
  await run.navigate('#practice');
  assert.equal(run.element('#player').src, 'media/clips/test1/q001.mp3');
  assert.match(run.element('#main').innerHTML, /QUESTION 1/);
  const q = run.context.TOEIC_OFFLINE_DATA[0].questions[0];
  assert(!run.element('#main').innerHTML.includes(q.options[0].text));
  await run.click({ answer: q.answer });
  await run.click({ action: 'reveal' });
  assert.match(run.element('#main').innerHTML, /回答正确/);
  assert(run.element('#main').innerHTML.includes(q.options[0].text));
  await run.element('#play-group').onclick();
  assert.equal(run.element('#player').paused, false); // Dispatch only; not codec playback proof.
  await run.save();
  const state = JSON.parse(run.storage.get('toeic-four-tests-v1'));
  assert.equal(state.active.answers['t1-q1'], q.answer);
  const reload = await app(run.storage);
  assert.match(reload.element('#main').innerHTML, /继续第 1 套/);
  await reload.click({ action: 'resume' });
  assert.match(reload.element('#main').innerHTML, /回答正确/);
});

test('offline backup exports and restores vocabulary mastery across independent browser storage', async () => {
  const run = await app();
  await run.navigate('#vocabulary');
  await run.click({ action: 'reveal-word' });
  assert.match(run.element('#main').innerHTML, /word-pos-label/);
  await run.click({ action: 'master-word' });
  await run.save();
  await run.click({ action: 'export' });
  const text = await run.downloads[0].text();
  const backup = JSON.parse(text);
  assert.equal(backup.format, 'toeic-four-tests');
  assert.equal(Object.values(backup.state.words).filter(Boolean).length, 1);
  const fresh = await app();
  fresh.handlers.change({ target: { id: 'restore-file', files: [{ size: text.length, text: async () => text }] } });
  await settle();
  assert.equal(fresh.element('#confirm-dialog').open, true);
  assert.equal(fresh.element('#confirm-ok').textContent, '恢复备份');
  fresh.element('#confirm-ok').onclick();
  await fresh.save();
  const restored = JSON.parse(fresh.storage.get('toeic-four-tests-v1'));
  assert.deepEqual(restored.words, backup.state.words);
  await fresh.navigate('#vocabulary');
  assert.match(fresh.element('#main').innerHTML, /已掌握 · 撤销/);
});
