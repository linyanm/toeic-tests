import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Script } from 'node:vm';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = name => readFile(path.join(root, name), 'utf8');

// Intentionally small, guarded bundler for this project's three flat local modules.
// Fail on new module syntax rather than silently emitting a broken offline app.
export async function offlineScripts() {
  const files = ['engine.js', 'vocabulary.js', 'data-loader.js'];
  const modules = await Promise.all(files.map(async name =>
    (await read(`web/${name}`)).replace(/^export (?=(?:async )?function |const )/gm, '')));
  const imported = [];
  const application = (await read('web/application.js')).replace(
    /^import \{[^}]+\} from "\.\/([^"\n]+)";\r?\n/gm,
    (_, name) => { imported.push(name); return ''; },
  );
  if (JSON.stringify(imported.slice().sort()) !== JSON.stringify(files.slice().sort()))
    throw Error('Offline build: unexpected application imports; update the bundler.');
  const bundle = `(() => {\n"use strict";\n${modules.join('\n')}\n${application}\n})();\n`;
  new Script(bundle, { filename: 'offline-app.js' });
  const data = await Promise.all(['test1', 'test2', 'test3', 'test4', 'vocabulary', 'audio']
    .map(async name => JSON.parse(await read(`web/data/${name}.json`))));
  const dataScript = `globalThis.TOEIC_OFFLINE_DATA = ${JSON.stringify(data)};\n`;
  new Script(dataScript, { filename: 'offline-data.js' });
  return { bundle, dataScript };
}

export async function buildOffline(output = path.join(root, 'dist/offline/toeic-offline')) {
  const { bundle, dataScript } = await offlineScripts();
  const source = await read('web/index.html');
  const entry = '<script type="module" src="application.js"></script>';
  if (!source.includes(entry)) throw Error('Offline build: HTML entry point changed.');
  const html = source.replace(entry,
    '<script defer src="offline-data.js"></script>\n    <script defer src="offline-app.js"></script>')
    .replace('<meta charset="UTF-8" />', '<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="default-src \'self\' file: data: blob:; connect-src \'none\'; style-src \'self\' file: \'unsafe-inline\'" />')
    .replace('<title>托业全真练习 · TOEIC 女踢腿四套题</title>', '<title>托业全真练习 · 电脑离线版</title>')
    .replace('<small>TOEIC · 女踢腿四套题</small>', '<small>TOEIC · 电脑离线版</small>')
    .replace('个人练习</span>', '离线练习</span>');
  await mkdir(output, { recursive: true });
  await Promise.all([
    writeFile(path.join(output, '开始练习.html'), html),
    writeFile(path.join(output, 'offline-app.js'), bundle),
    writeFile(path.join(output, 'offline-data.js'), dataScript),
    cp(path.join(root, 'tools/offline-readme.txt'), path.join(output, '使用说明.txt')),
    ...['styles.css', 'images', 'media'].map(name =>
      cp(path.join(root, 'web', name), path.join(output, name), { recursive: true })),
  ]);
  return output;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  console.log(`Offline package ready: ${await buildOffline()}`);
