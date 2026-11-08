// Shared paths for the end-to-end tests. Everything is relative to the repo, and the throwaway
// files (isolated settings folders, screenshots) go to scratch/pdf-diva/test-work next to the
// folder that holds the repo (D:\repos\pdf-diva -> D:\scratch\pdf-diva\test-work).
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const TESTS = path.dirname(fileURLToPath(import.meta.url));
export const REPO = path.resolve(TESTS, '..');
export const FIXTURES = path.join(TESTS, 'fixtures');
export const LAUNCHERS = path.join(TESTS, 'launchers');
export const ELECTRON = path.join(REPO, 'node_modules', 'electron', 'dist', 'electron.exe');
export const WORK = process.env.PDF_DIVA_TEST_WORK ?? path.resolve(REPO, '..', '..', 'scratch', 'pdf-diva', 'test-work');
mkdirSync(WORK, { recursive: true });
