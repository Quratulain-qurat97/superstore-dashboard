// Guard: src/core must stay free of React, the DOM and browser-only APIs, so the same logic
// can run unchanged in a browser, Electron, Tauri or React Native.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const coreDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const files = readdirSync(coreDir).filter((f) => f.endsWith('.js'));
const stripComments = (code) => code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

test('core has files to check', () => assert.ok(files.length >= 6));

for (const file of files) {
  const code = stripComments(readFileSync(resolve(coreDir, file), 'utf8'));

  test(`core/${file} only imports other core files`, () => {
    for (const match of code.matchAll(/(?:import|export)[^'"]*from\s*['"]([^'"]+)['"]/g)) {
      assert.match(match[1], /^\.\/[\w-]+\.js$/, `unexpected import "${match[1]}"`);
    }
  });

  test(`core/${file} uses no browser or React APIs`, () => {
    const banned = /\b(window|document|localStorage|sessionStorage|navigator|XMLHttpRequest|fetch|React|useState|useEffect|Intl)\b/;
    assert.doesNotMatch(code, banned);
  });
}
