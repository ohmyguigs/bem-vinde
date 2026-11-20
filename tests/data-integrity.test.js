import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  BIOMES,
  BIOMES_UNKNOWN,
  CATEGORIES,
  EVALUATED_CATEGORIES,
  EVALUATED_GROUPS,
  SOURCE,
  THREATENED_BY_GROUP,
  TOTALS,
} from '../src/data/salve.js';
import { BIOME_OPTIONS, GROUP_OPTIONS, getChartSpec } from '../src/lib/charts.js';

const sum = (rows) => rows.reduce((total, row) => total + row.total, 0);

/** Os percentuais do portal são total/soma, com uma casa decimal. Recalcular pega erro de transcrição. */
function assertPercentagesMatch(name, rows) {
  const base = sum(rows);
  for (const row of rows) {
    const expected = (row.total / base) * 100;
    assert.ok(
      Math.abs(expected - row.percent) <= 0.051,
      `${name}: ${row.code} tem total ${row.total} de ${base} (${expected.toFixed(2)}%), mas o percentual gravado é ${row.percent}%`,
    );
  }
}

test('percentuais de categorias avaliadas batem com os totais', () => {
  assertPercentagesMatch('categorias', EVALUATED_CATEGORIES);
});

test('percentuais de grupos avaliados batem com os totais', () => {
  assertPercentagesMatch('grupos', EVALUATED_GROUPS);
});

test('percentuais de ameaça por grupo batem com os totais', () => {
  for (const [group, rows] of Object.entries(THREATENED_BY_GROUP)) {
    assertPercentagesMatch(`ameaça/${group}`, rows);
  }
});

test('percentuais por bioma batem com os totais', () => {
  for (const [key, biome] of Object.entries(BIOMES)) {
    assertPercentagesMatch(`bioma/${key}`, biome.categories);
  }
  assertPercentagesMatch('bioma/desconhecido', BIOMES_UNKNOWN.categories);
});

test('somas conhecidas do portal (protegem a transcrição dos dados)', () => {
  assert.equal(sum(EVALUATED_CATEGORIES), 15410);
  assert.equal(sum(EVALUATED_GROUPS), 15781);
  assert.equal(TOTALS.evaluated, 15974);
});

test('espécies em categoria de ameaça = CR + EN + VU das categorias avaliadas', () => {
  const total = ['CR', 'EN', 'VU'].reduce((acc, code) => acc + EVALUATED_CATEGORIES.find((row) => row.code === code).total, 0);
  assert.equal(total, TOTALS.threatened);
});

test('pizza das ameaçadas: CR + EN + VU somam o painel do portal e os percentuais fecham em 100%', () => {
  const spec = getChartSpec('ameacadas');
  const total = spec.items.reduce((acc, item) => acc + item.value, 0);
  assert.equal(total, TOTALS.threatened);
  assertPercentagesMatch('ameacadas', spec.items.map((item) => ({ code: item.code, total: item.value, percent: item.percent })));
  const percents = spec.items.reduce((acc, item) => acc + item.percent, 0);
  assert.ok(Math.abs(percents - 100) <= 0.15, `percentuais somam ${percents}`);
});

test('gráfico de ameaça por grupo: o total do título é a soma de CR, EN e VU do grupo', () => {
  for (const [group, rows] of Object.entries(THREATENED_BY_GROUP)) {
    const total = rows.filter((row) => ['CR', 'EN', 'VU'].includes(row.code)).reduce((acc, row) => acc + row.total, 0);
    assert.ok(getChartSpec('ameaca-por-grupo', group).caption.endsWith(`${total.toLocaleString('pt-BR')} no total`), group);
  }
});

test('painel de números tem os valores publicados pelo portal', () => {
  assert.equal(TOTALS.publishedSheets, 15237);
  assert.equal(TOTALS.experts, 2003);
  assert.match(TOTALS.threatenedNote, /não reflete a lista oficial/i);
});

test('todo código de categoria usado existe no glossário', () => {
  const used = new Set([
    ...EVALUATED_CATEGORIES.map((row) => row.code),
    ...Object.values(THREATENED_BY_GROUP).flat().map((row) => row.code),
    ...Object.values(BIOMES).flatMap((biome) => biome.categories.map((row) => row.code)),
  ]);
  for (const code of used) assert.ok(CATEGORIES[code], `categoria sem rótulo: ${code}`);
});

test('um recorte de ameaça para cada grupo avaliado, e vice-versa', () => {
  assert.deepEqual(Object.keys(THREATENED_BY_GROUP).sort(), EVALUATED_GROUPS.map((group) => group.code).sort());
});

test('filtros oferecem todos os recortes e omitem "Desconhecido"', () => {
  assert.equal(GROUP_OPTIONS.length, 10);
  assert.equal(BIOME_OPTIONS.length, 7);
  assert.ok(!BIOME_OPTIONS.some((option) => /desconhecido/i.test(option.label)));
});

test('atribuição ao SALVE: link, data de coleta, citação e endpoints', () => {
  assert.equal(SOURCE.url, 'https://salve.icmbio.gov.br/');
  assert.equal(SOURCE.collectedAt, '2026-11-19');
  assert.match(SOURCE.citation, /ICMBio, 2026\. Sistema de Avaliação do Risco de Extinção da Biodiversidade – SALVE/);
  assert.equal(SOURCE.endpoints.length, 5);
  for (const endpoint of SOURCE.endpoints) {
    assert.ok(endpoint.url.startsWith('https://salve.icmbio.gov.br/salve-api/public/'), endpoint.url);
  }
});
