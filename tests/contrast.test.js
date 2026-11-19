import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PALETTE } from '../src/lib/pie.js';
import { contrast, read } from './helpers.js';

const css = read('src/styles.css');

/** Lê os temas (--bg, --fg…) direto do CSS: se alguém mudar uma cor, o teste mede de novo. */
function themes() {
  const result = {};
  for (const match of css.matchAll(/\.theme-(\w+)\s*\{([^}]*)\}/g)) {
    const tokens = {};
    for (const token of match[2].matchAll(/--(\w+):\s*(#[0-9a-fA-F]{3,6})/g)) tokens[token[1]] = token[2];
    result[match[1]] = tokens;
  }
  return result;
}

test('cada tema de seção atende ao contraste WCAG AA nos pares que usa', () => {
  const all = themes();
  assert.deepEqual(Object.keys(all).sort(), ['grape', 'ink', 'moss', 'night', 'paper']);
  for (const [name, t] of Object.entries(all)) {
    const textPairs = [
      ['fg/bg', t.fg, t.bg],
      ['dim/bg', t.dim, t.bg],
      ['accent/bg', t.accent, t.bg],
      ['link/bg', t.link, t.bg],
      ['fg/surface', t.fg, t.surface],
      ['dim/surface', t.dim, t.surface],
      ['accent/surface', t.accent, t.surface],
    ];
    for (const [label, a, b] of textPairs) {
      assert.ok(contrast(a, b) >= 4.5, `${name} ${label} (${a} sobre ${b}) = ${contrast(a, b).toFixed(2)}:1, mínimo 4.5:1`);
    }
    const uiPairs = [
      ['focus/bg', t.focus, t.bg],
      ['focus/surface', t.focus, t.surface],
      ['line/bg', t.line, t.bg],
      ['line/surface', t.line, t.surface],
    ];
    for (const [label, a, b] of uiPairs) {
      assert.ok(contrast(a, b) >= 3, `${name} ${label} (${a} sobre ${b}) = ${contrast(a, b).toFixed(2)}:1, mínimo 3:1`);
    }
  }
});

test('fatias do gráfico: 3:1 contra o fundo do atlas e 4.5:1 com o texto branco', () => {
  const { moss } = themes();
  for (const color of PALETTE) {
    assert.ok(contrast(color, moss.surface) >= 3, `${color} sobre a superfície do gráfico`);
    assert.ok(contrast(color, moss.bg) >= 3, `${color} sobre o fundo do atlas`);
    assert.ok(contrast(color, '#ffffff') >= 4.5, `texto branco sobre ${color}`);
  }
});

test('componentes com cores próprias (botões, citação, chips, select)', () => {
  const pairs = [
    ['botão escuro', '#f5f1e8', '#17160f'],
    ['botão rosa', '#2b0f45', '#ffa6dd'],
    ['citação', '#0e0f12', '#d4ff4f'],
    ['chip', '#f5f1e8', '#17160f'],
    ['select', '#10281a', '#ffffff'],
    ['link de salto', '#0e0f12', '#d4ff4f'],
    ['rosa sobre grape (hover do botão)', '#ffa6dd', '#2b0f45'],
  ];
  for (const [label, fg, bg] of pairs) {
    assert.ok(contrast(fg, bg) >= 4.5, `${label}: ${contrast(fg, bg).toFixed(2)}:1`);
  }
});

test('legenda focada pelo teclado: contorno pontilhado usa a cor de foco, 3:1 sobre o cartão com o realce', () => {
  const { moss } = themes();
  assert.match(css, /\.legend-item\[data-focused\]\s*\{[^}]*outline:\s*3px dashed var\(--focus\)/);
  // O realce é rgb(16 40 26 / 0.07) sobre a superfície do cartão.
  const blend = (channel, tint) => Math.round(channel * 0.93 + tint * 0.07);
  const surface = moss.surface.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(surface.slice(i, i + 2), 16));
  const hex = (n) => n.toString(16).padStart(2, '0');
  const highlighted = `#${hex(blend(r, 16))}${hex(blend(g, 40))}${hex(blend(b, 26))}`;
  assert.ok(contrast(moss.focus, highlighted) >= 3, `foco ${moss.focus} sobre ${highlighted} = ${contrast(moss.focus, highlighted).toFixed(2)}:1`);
  assert.ok(contrast(moss.fg, highlighted) >= 4.5, 'texto da legenda sobre o realce');
});
