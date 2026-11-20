import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextIndex } from '../src/lib/chart-keys.js';

test('setas avançam e voltam, dando a volta nas pontas', () => {
  assert.equal(nextIndex('ArrowRight', 0, 9), 1);
  assert.equal(nextIndex('ArrowDown', 3, 9), 4);
  assert.equal(nextIndex('ArrowRight', 9, 9), 0, '→ na última volta à primeira');
  assert.equal(nextIndex('ArrowLeft', 4, 9), 3);
  assert.equal(nextIndex('ArrowUp', 1, 9), 0);
  assert.equal(nextIndex('ArrowLeft', 0, 9), 9, '← na primeira vai à última');
});

test('Home e End vão aos extremos', () => {
  assert.equal(nextIndex('Home', 5, 9), 0);
  assert.equal(nextIndex('End', 5, 9), 9);
});

test('outras teclas não têm efeito (o Tab é do navegador)', () => {
  for (const key of ['Tab', 'Enter', ' ', 'Escape', 'a', 'PageDown']) assert.equal(nextIndex(key, 2, 9), -1, key);
});

test('um único item: as setas ficam nele', () => {
  assert.equal(nextIndex('ArrowRight', 0, 0), 0);
  assert.equal(nextIndex('ArrowLeft', 0, 0), 0);
});
