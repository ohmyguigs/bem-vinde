import { test } from 'node:test';
import assert from 'node:assert/strict';
import { arcPath, computeSlices, polar } from '../src/lib/pie-math.js';
import { escapeHtml, formatInt, formatPercent } from '../src/lib/format.js';

const close = (a, b, epsilon = 1e-6) => Math.abs(a - b) <= epsilon;

test('polar: -90° aponta para o topo e 0° para a direita', () => {
  const top = polar(50, 50, 10, -90);
  assert.ok(close(top.x, 50) && close(top.y, 40));
  const right = polar(50, 50, 10, 0);
  assert.ok(close(right.x, 60) && close(right.y, 50));
});

test('as fatias somam 360° e começam no topo', () => {
  const slices = computeSlices([{ value: 1 }, { value: 2 }, { value: 5 }]);
  assert.equal(slices[0].start, -90);
  assert.ok(close(slices.reduce((acc, slice) => acc + slice.angle, 0), 360));
  assert.ok(close(slices.at(-1).end, 270));
});

test('o ângulo é proporcional ao valor', () => {
  const [a, b] = computeSlices([{ value: 25 }, { value: 75 }]);
  assert.ok(close(a.angle, 90) && close(b.angle, 270));
});

test('itens com valor 0 não geram fatia, mas preservam o índice original', () => {
  const slices = computeSlices([{ value: 0 }, { value: 4 }, { value: 0 }, { value: 4 }]);
  assert.deepEqual(slices.map((slice) => slice.index), [1, 3]);
});

test('lista vazia ou só zeros não gera fatias nem NaN', () => {
  assert.deepEqual(computeSlices([]), []);
  assert.deepEqual(computeSlices([{ value: 0 }]), []);
});

test('fatia única vira um círculo completo, sem arco degenerado', () => {
  const [only] = computeSlices([{ value: 7 }]);
  assert.match(only.d, /^M 8 50 A 42 42 0 1 1 92 50 A 42 42 0 1 1 8 50 Z$/);
});

test('arco maior que 180° usa o flag large-arc', () => {
  assert.match(arcPath(50, 50, 42, -90, 120), / 0 1 1 /);
  assert.match(arcPath(50, 50, 42, -90, 0), / 0 0 1 /);
});

test('o vetor de "explosão" aponta para fora, no meio da fatia', () => {
  const [right, left] = computeSlices([{ value: 1 }, { value: 1 }], { explode: 3 });
  assert.ok(right.ex > 2.9, 'meia fatia da direita sai para a direita');
  assert.ok(left.ex < -2.9, 'meia fatia da esquerda sai para a esquerda');
});

test('formatação em pt-BR', () => {
  assert.equal(formatInt(15974), '15.974');
  assert.equal(formatPercent(79), '79,0%');
  assert.equal(formatPercent(0.4), '0,4%');
});

test('escapeHtml neutraliza marcação e aspas', () => {
  assert.equal(escapeHtml('<b>"a" & \'b\'</b>'), '&lt;b&gt;&quot;a&quot; &amp; &#39;b&#39;&lt;/b&gt;');
});
