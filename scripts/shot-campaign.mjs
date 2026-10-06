#!/usr/bin/env node
/*
  Zero-dependency screenshot helper for pages/devai-campaign.html.
  Drives headless Chrome over the DevTools protocol using Node 22's
  built-in WebSocket, so the playground keeps its "no build step" rule.

  CLI:
    node scripts/shot-campaign.mjs <phase> [--wait ms] [--reduced-motion] [--page path]
      -> shots/campaign/phase-<phase>/{1440,390}.png   (full page)
         shots/campaign/phase-<phase>/{1440,390}-viewport.png

  Module:
    import { openPage } from './shot-campaign.mjs';
    const page = await openPage({ width: 1440, height: 900 });
    await page.goto(url); await page.eval('1 + 1'); await page.shot('out.png');
    await page.close();
*/
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = process.env.CHROME_PATH
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function launch() {
  const profile = mkdtempSync(join(tmpdir(), 'shot-campaign-'));
  const proc = spawn(CHROME, [
    '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`,
    '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
    '--disable-gpu', '--force-color-profile=srgb', 'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'] });

  const wsUrl = await new Promise((res, rej) => {
    let buf = '';
    const t = setTimeout(() => rej(new Error('Chrome did not start')), 15000);
    proc.stderr.on('data', (d) => {
      buf += d;
      const m = buf.match(/DevTools listening on (ws:\/\/\S+)/);
      if (m) { clearTimeout(t); res(m[1]); }
    });
  });

  const ws = new WebSocket(wsUrl);
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  let id = 0;
  const pending = new Map();
  const listeners = new Set();
  ws.addEventListener('message', (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id && pending.has(msg.id)) {
      const { res, rej } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? rej(new Error(msg.error.message)) : res(msg.result);
    } else if (msg.method) {
      listeners.forEach((fn) => fn(msg));
    }
  });
  const send = (method, params = {}, sessionId) => new Promise((res, rej) => {
    const msgId = ++id;
    pending.set(msgId, { res, rej });
    ws.send(JSON.stringify({ id: msgId, method, params, sessionId }));
  });
  const close = async () => {
    const exited = new Promise((r) => (proc.exitCode !== null ? r() : proc.once('exit', r)));
    try { await send('Browser.close'); } catch { /* already gone */ }
    ws.close();
    await Promise.race([exited, sleep(3000)]);
    proc.kill();
    try { rmSync(profile, { recursive: true, force: true, maxRetries: 5 }); } catch { /* temp dir, harmless */ }
  };
  return { send, listeners, close };
}

export async function openPage({ width = 1440, height = 900, reducedMotion = false } = {}) {
  const browser = await launch();
  const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await browser.send('Target.attachToTarget', { targetId, flatten: true });
  const send = (m, p) => browser.send(m, p, sessionId);
  const logs = [];
  browser.listeners.add((msg) => {
    if (msg.sessionId !== sessionId) return;
    if (msg.method === 'Runtime.consoleAPICalled') {
      logs.push(`[${msg.params.type}] ${msg.params.args.map((a) => a.value ?? a.description ?? '').join(' ')}`);
    } else if (msg.method === 'Runtime.exceptionThrown') {
      const d = msg.params.exceptionDetails;
      logs.push(`[exception] ${d.exception?.description || d.text}`);
    }
  });
  await send('Page.enable');
  await send('Runtime.enable');
  const mobile = width < 600;
  await send('Emulation.setDeviceMetricsOverride', {
    width, height, deviceScaleFactor: mobile ? 2 : 1, mobile,
  });
  if (mobile) await send('Emulation.setTouchEmulationEnabled', { enabled: true });
  await send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: reducedMotion ? 'reduce' : 'no-preference' }],
  });

  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
  };

  return {
    logs,
    send,
    eval: evaluate,
    async goto(url) {
      const loaded = new Promise((res) => {
        const fn = (msg) => {
          if (msg.sessionId === sessionId && msg.method === 'Page.loadEventFired') {
            browser.listeners.delete(fn); res();
          }
        };
        browser.listeners.add(fn);
      });
      await send('Page.navigate', { url });
      await loaded;
      await evaluate('document.fonts.ready.then(() => true)');
    },
    wait: sleep,
    /* fullPage captures the whole document without resizing the viewport,
       so 100vh-based layout (the sticky hero) keeps its real height. */
    async shot(file, { fullPage = false } = {}) {
      const params = { format: 'png' };
      if (fullPage) {
        const { cssContentSize } = await send('Page.getLayoutMetrics');
        params.captureBeyondViewport = true;
        params.clip = { x: 0, y: 0, width, height: Math.ceil(cssContentSize.height), scale: 1 };
      }
      const { data } = await send('Page.captureScreenshot', params);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, Buffer.from(data, 'base64'));
      return file;
    },
    async mouse(type, x, y) {
      await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 });
    },
    async key(key, code = key, keyCode = 0) {
      await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: keyCode });
      await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: keyCode });
    },
    close: browser.close,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const phase = args.find((a) => !a.startsWith('--')) ?? 'dev';
  const opt = (name, fallback) => {
    const i = args.indexOf(`--${name}`);
    return i >= 0 ? args[i + 1] : fallback;
  };
  const wait = Number(opt('wait', 6000));
  const reducedMotion = args.includes('--reduced-motion');
  const pagePath = resolve(ROOT, opt('page', 'pages/devai-campaign.html'));
  const outDir = join(ROOT, 'shots', 'campaign', `phase-${phase}`);
  const suffix = reducedMotion ? '-reduced' : '';

  for (const [width, height] of [[1440, 900], [390, 844]]) {
    const page = await openPage({ width, height, reducedMotion });
    try {
      await page.goto(pathToFileURL(pagePath).href);
      await page.wait(wait);
      console.log(await page.shot(join(outDir, `${width}${suffix}.png`), { fullPage: true }));
      console.log(await page.shot(join(outDir, `${width}${suffix}-viewport.png`)));
      if (page.logs.length) console.log(page.logs.join('\n'));
    } finally {
      await page.close();
    }
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
