import { chromium } from 'playwright';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

export function readMenu() {
  const sandbox = { window: {} };
  vm.runInNewContext(readFileSync(resolve(root, 'js/poster-menu.generated.js'), 'utf8'), sandbox, { timeout: 1000 });
  return JSON.parse(JSON.stringify(sandbox.window.POSTER_MENU));
}

export function option(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index < 0) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`${name} requires a value`);
  return value;
}

export async function launchChrome() {
  const configured = option('--chrome', process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH);
  const candidates = configured ? [configured] : [
    process.env.PROGRAMFILES && resolve(process.env.PROGRAMFILES, 'Google/Chrome/Application/chrome.exe'),
    process.env['PROGRAMFILES(X86)'] && resolve(process.env['PROGRAMFILES(X86)'], 'Google/Chrome/Application/chrome.exe'),
    process.env.LOCALAPPDATA && resolve(process.env.LOCALAPPDATA, 'Google/Chrome/Application/chrome.exe'),
    '/usr/bin/google-chrome', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  ];
  const executablePath = candidates.find(path => path && existsSync(path));
  if (!executablePath) throw new Error('Chrome not found. Set --chrome or PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH.');
  return chromium.launch({ executablePath, headless: true });
}

export function imageSize(bytes) {
  if (bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) {
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  }
  if (bytes[0] === 255 && bytes[1] === 216) {
    let offset = 2;
    while (offset + 8 < bytes.length) {
      if (bytes[offset++] !== 255) continue;
      while (bytes[offset] === 255) offset++;
      const marker = bytes[offset++];
      if (marker === 217 || marker === 218) break;
      if (marker === 1 || (marker >= 208 && marker <= 215)) continue;
      const length = bytes.readUInt16BE(offset);
      if ([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker)) {
        return { width: bytes.readUInt16BE(offset + 5), height: bytes.readUInt16BE(offset + 3) };
      }
      if (length < 2) break;
      offset += length;
    }
  }
  if (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') {
    const type = bytes.toString('ascii', 12, 16);
    if (type === 'VP8X') return { width: bytes.readUIntLE(24, 3) + 1, height: bytes.readUIntLE(27, 3) + 1 };
    if (type === 'VP8 ') return { width: bytes.readUInt16LE(26) & 0x3fff, height: bytes.readUInt16LE(28) & 0x3fff };
    if (type === 'VP8L') {
      const packed = bytes.readUInt32LE(21);
      return { width: (packed & 0x3fff) + 1, height: ((packed >>> 14) & 0x3fff) + 1 };
    }
  }
  throw new Error('Unsupported or invalid image bytes');
}

export async function waitForImage(page, selector) {
  await page.waitForFunction(selector => {
    const image = document.querySelector(selector);
    return image && image.complete && image.naturalWidth > 0;
  }, selector, { timeout: 20000 });
  await page.locator(selector).evaluate(async image => {
    if (image.decode) await image.decode();
  });
  return page.locator(selector).evaluate(image => ({
    url: image.currentSrc || image.src, width: image.naturalWidth, height: image.naturalHeight, alt: image.alt
  }));
}
