// Test helper: read the same superstore.json the dashboard uses (tests run in plain Node).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
export const dataFile = resolve(here, '../../../../data/superstore.json');
const parsed = JSON.parse(readFileSync(dataFile, 'utf8'));

export const rows = parsed.transactions;
export const meta = parsed.meta;
