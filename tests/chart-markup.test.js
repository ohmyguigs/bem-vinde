import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderChart } from '../src/lib/chart-render.js';
import { announcement, CATEGORY_STYLE, PALETTE, chartItems, markName, summarize } from '../src/lib/chart-common.js';
import { BIOME_OPTIONS, GROUP_OPTIONS, getChartSpec } from '../src/lib/charts.js';
import { THREATENED_BY_GROUP } from '../src/data/salve.js';
import { escapeHtml, formatInt } from '../src/lib/format.js';
import { attr, ids, read, tags } from './helpers.js';

const barSpecs = () => [
  getChartSpec('categorias'),
  getChartSpec('grupos'),
  ...BIOME_OPTIONS.map((option) => getChartSpec('biomas', option.value)),
];
const columnSpecs = () => GROUP_OPTIONS.map((option) => getChartSpec('ameaca-por-grupo', option.value));
const everySpec = () => [...barSpecs(), ...columnSpecs()];

const noun = (spec) => (spec.type === 'column' ? 'Coluna' : 'Barra');
const barTags = (html) => tags(html, 'span').filter((a) => /class="bar"/.test(a));

test('o tipo de cada gráfico: categorias, grupos e biomas em barras; ameaça por grupo em colunas', () => {
  assert.equal(getChartSpec('categorias').type, 'bar');
  assert.equal(getChartSpec('grupos').type, 'bar');
  assert.equal(getChartSpec('biomas').type, 'bar');
  assert.equal(getChartSpec('ameaca-por-grupo').type, 'column');
  assert.match(renderChart(getChartSpec('categorias')), /^<accessible-bars class="bars" data-orientation="row"/);
  assert.match(renderChart(getChartSpec('ameaca-por-grupo')), /^<accessible-bars class="bars" data-orientation="column"/);
  assert.match(renderChart(getChartSpec('ameacadas')), /^<accessible-pie /);
});

test('todo gráfico: grupo nomeado e descrito, com uma barra ou coluna nomeada por item', () => {
  for (const spec of everySpec()) {
    const html = renderChart(spec);
    const shown = chartItems(spec);
    const chart = html.match(/<div class="bar-chart"[^>]*>/)[0];
    assert.match(chart, /role="group"/, spec.caption);
    for (const name of ['aria-labelledby', 'aria-describedby']) {
      for (const ref of attr(chart, name).split(' ')) assert.ok(ids(html).includes(ref), `${spec.caption}: ${name} órfão ${ref}`);
    }
    const bars = barTags(html);
    assert.equal(bars.length, shown.length, spec.caption);
    bars.forEach((a, index) => {
      assert.equal(attr(a, 'role'), 'img');
      assert.equal(attr(a, 'aria-label'), escapeHtml(markName(shown[index], index + 1, shown.length, spec, noun(spec))));
      assert.ok(attr(a, 'aria-label').endsWith(`${noun(spec)} ${index + 1} de ${shown.length}.`), attr(a, 'aria-label'));
    });
  }
});

test('nome da barra = texto da linha da legenda + posição (exemplo)', () => {
  const html = renderChart(getChartSpec('grupos'));
  assert.ok(html.includes('aria-label="Aves: 2.069 espécies, 13,1%. Barra 2 de 10."'));
  const columns = renderChart(getChartSpec('ameaca-por-grupo', 'AVES'));
  assert.ok(columns.includes('aria-label="Vulnerável (VU): 132 espécies, 54,3%. Coluna 1 de 3."'));
});

test('nada é lido duas vezes: rótulos, valores, % e legenda ficam escondidos do leitor de tela', () => {
  for (const spec of everySpec()) {
    const html = renderChart(spec);
    const shown = chartItems(spec).length;
    if (spec.type === 'column') {
      for (const cls of ['bar-pct', 'bar-code']) {
        assert.equal((html.match(new RegExp(`class="${cls}" aria-hidden="true"`, 'g')) ?? []).length, shown, `${spec.caption}: ${cls}`);
      }
      assert.match(html.match(/<ul class="legend"[^>]*>/)[0], /aria-hidden="true"/, `${spec.caption}: legenda`);
      assert.equal((html.match(/class="legend-item"/g) ?? []).length, shown);
    } else {
      for (const cls of ['bar-label', 'bar-value']) {
        assert.equal((html.match(new RegExp(`class="${cls}" aria-hidden="true"`, 'g')) ?? []).length, shown, `${spec.caption}: ${cls}`);
      }
      assert.doesNotMatch(html, /class="legend"/, 'as barras não têm legenda à parte: o rótulo da linha faz esse papel');
    }
    assert.match(html, /<svg class="bar-defs" aria-hidden="true"/);
    assert.doesNotMatch(html, /<span class="bar"[^>]*tabindex/, 'o tabindex é posto pelo componente');
  }
});

test('barras: largura proporcional ao maior valor e nunca menos que a barra mínima', () => {
  const html = renderChart(getChartSpec('categorias'));
  const width = (code) => Number(html.match(new RegExp(`id="barras-categorias-legenda-${code}"[^>]*--w:([0-9.]+)`))[1]);
  assert.equal(width('lc'), 1);
  assert.equal(width('dd'), Math.round((1192 / 12167) * 10000) / 10000);
  assert.ok(width('ew') > 0 && width('ew') < 0.001, 'EW (1 espécie) tem fração quase zero, e o CSS garante a barra mínima');
  const css = read('src/styles.css');
  assert.match(css, /width:\s*max\(0\.5rem,\s*calc\(var\(--w\) \* 100%\)\)/);
  assert.match(css, /height:\s*max\(0\.5rem,\s*calc\(var\(--w\) \* 11rem\)\)/);
});

test('colunas: ordem VU, EN, CR como no portal, e altura em escala fixa de 0 a 100%', () => {
  const html = renderChart(getChartSpec('ameaca-por-grupo', 'AVES'));
  const order = ['vu', 'en', 'cr'].map((code) => html.indexOf(`id="colunas-ameaca-coluna-${code}"`));
  assert.ok(order.every((index) => index > 0) && order[0] < order[1] && order[1] < order[2], 'DOM na ordem visual, que é a ordem de Tab');
  const height = (code) => Number(html.match(new RegExp(`<div class="bar-col"[^>]*--w:([0-9.]+)"><span class="bar-lane"><span class="bar-pct"[^>]*>[^<]*</span><span class="bar" id="colunas-ameaca-coluna-${code}"`))[1]);
  assert.equal(height('vu'), 0.543);
  assert.equal(height('en'), 0.321);
  assert.equal(height('cr'), 0.132);
  assert.match(html, /<div class="bar-columns" style="--n:3">/);
});

test('ameaça por grupo: título com o total em CR, EN e VU, e o EW de Aves só na tabela', () => {
  for (const [code, rows] of Object.entries(THREATENED_BY_GROUP)) {
    const spec = getChartSpec('ameaca-por-grupo', code);
    const total = rows.filter((row) => ['CR', 'EN', 'VU'].includes(row.code)).reduce((sum, row) => sum + row.total, 0);
    assert.match(spec.caption, new RegExp(`, ${formatInt(total)} no total$`), spec.caption);
    const html = renderChart(spec);
    assert.equal(barTags(html).length, 3, `${code}: sempre 3 colunas`);
    assert.ok(html.includes(`<th scope="row">Total em CR, EN e VU</th><td>${formatInt(total)}</td>`), `${code}: rodapé da tabela`);
  }
  const aves = getChartSpec('ameaca-por-grupo', 'AVES');
  assert.equal(aves.caption, 'Espécies ameaçadas: Aves, 242 no total');
  const html = renderChart(aves);
  assert.match(html, /<th scope="row">Extinta na Natureza \(EW\)<\/th><td>1<\/td><td>0,4%<\/td>/, 'a tabela traz a linha publicada do EW');
  assert.doesNotMatch(html, /coluna-ew|legenda-ew/, 'o desenho não mostra o EW');
  assert.doesNotMatch(html.match(/<div class="bar-chart"[\s\S]*?<\/ul>/)[0], /Extinta na Natureza/);
  assert.match(summarize(aves), /^Gráfico de colunas com 3 colunas, somando 242 espécies\./);
  assert.doesNotMatch(summarize(aves), /Extinta na Natureza/);
  assert.equal((html.match(/<tr><th scope="row">/g) ?? []).length, 4 + 1, '3 colunas + EW + rodapé');
});

test('ids estáveis: o mesmo id para a mesma categoria em todos os recortes do gráfico', () => {
  for (const spec of everySpec()) {
    const html = renderChart(spec);
    const kind = spec.type === 'column' ? 'coluna' : 'barra';
    for (const item of chartItems(spec)) {
      const code = item.code.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      assert.ok(html.includes(`id="${spec.id}-${kind}-${code}"`), `${spec.caption}: falta ${spec.id}-${kind}-${code}`);
      assert.ok(html.includes(`id="${spec.id}-legenda-${code}"`), `${spec.caption}: falta a legenda ${code}`);
    }
    assert.ok(html.includes(`<summary id="${spec.id}-tabela">`));
  }
  assert.ok(renderChart(getChartSpec('biomas', 'CERRADO')).includes('id="barras-biomas-barra-cr"'));
  assert.ok(renderChart(getChartSpec('biomas', 'PANTANAL')).includes('id="barras-biomas-barra-cr"'));
  assert.ok(renderChart(getChartSpec('ameaca-por-grupo', 'AVES')).includes('id="colunas-ameaca-coluna-cr"'));
  assert.ok(renderChart(getChartSpec('ameaca-por-grupo', 'REPTEIS')).includes('id="colunas-ameaca-coluna-cr"'));
});

test('os resumos da tabela têm nome estável e diferente para cada gráfico', () => {
  const name = (spec) => renderChart(spec).match(/<summary id="[^"]+">(.*?)<\/summary>/)[1];
  assert.equal(name(getChartSpec('biomas', 'CERRADO')), name(getChartSpec('biomas', 'PANTANAL')));
  assert.equal(name(getChartSpec('ameaca-por-grupo', 'AVES')), name(getChartSpec('ameaca-por-grupo', 'MAMIFEROS')));
  assert.match(name(getChartSpec('biomas')), /do gráfico de risco por bioma/);
  const names = ['ameacadas', 'categorias', 'grupos', 'ameaca-por-grupo', 'biomas'].map((chart) => name(getChartSpec(chart)));
  assert.equal(new Set(names).size, 5, 'um nome diferente para cada gráfico');
});

test('todo gráfico: cor nunca é o único canal (cor e padrão distintos, padrão definido)', () => {
  for (const spec of everySpec()) {
    const html = renderChart(spec);
    const styles = [...html.matchAll(/<div class="(?:bar-row|bar-col)"[^>]*style="([^"]+)"/g)].map((m) => m[1]);
    const colors = styles.map((s) => s.match(/--c:(#[0-9a-f]{6})/)[1]);
    const patterns = styles.map((s) => s.match(/--pat:(url\(#[^)]+\))/)[1]);
    assert.equal(styles.length, chartItems(spec).length, spec.caption);
    assert.equal(new Set(colors).size, styles.length, `${spec.caption}: cores repetidas`);
    assert.equal(new Set(patterns).size, styles.length, `${spec.caption}: padrões repetidos`);
    for (const pattern of patterns) assert.ok(html.includes(`<pattern id="${pattern.slice(5, -1)}"`), `${spec.caption}: padrão ${pattern} não definido`);
  }
  const css = read('src/styles.css');
  assert.match(css, /\.no-patterns \.bar-fill rect\s*\{\s*fill:\s*var\(--c\)/, 'o interruptor de padrões vale para as barras');
});

test('cada categoria mantém a mesma cor em todos os tipos de gráfico', () => {
  const colorOf = (spec) => renderChart(spec).match(new RegExp(`id="${spec.id}-legenda-cr"[^>]*style="--c:(#[0-9a-f]{6})`))?.[1];
  const colors = [
    colorOf(getChartSpec('ameacadas')),
    colorOf(getChartSpec('categorias')),
    colorOf(getChartSpec('biomas', 'CERRADO')),
    colorOf(getChartSpec('ameaca-por-grupo', 'AVES')),
  ];
  assert.ok(colors.every(Boolean));
  assert.equal(new Set(colors).size, 1);
  assert.equal(colors[0], PALETTE[CATEGORY_STYLE.CR]);
});

test('tabela equivalente em todo gráfico: legenda, scope e todos os valores', () => {
  for (const spec of everySpec()) {
    const html = renderChart(spec);
    assert.match(html, /<table class="data-table"><caption>[^<]+: dados do gráfico<\/caption>/, spec.caption);
    assert.match(html, /<th scope="col">/);
    const present = spec.items.filter((item) => item.value > 0);
    assert.equal((html.match(/<tr><th scope="row">/g) ?? []).length, present.length + 1, `${spec.caption}: linhas + rodapé`);
    for (const item of present) assert.ok(html.includes(`<td>${formatInt(item.value)}</td>`), `${spec.caption}: falta ${item.value}`);
    assert.match(html, /<details class="pie-table"><summary id="[^"]+">Ver dados como tabela/);
  }
});

test('resumo, dica de teclado e anúncio falam em barras e colunas', () => {
  assert.match(summarize(getChartSpec('categorias')), /^Gráfico de barras com 10 barras, somando 15\.410 espécies\./);
  assert.match(summarize(getChartSpec('categorias')), /Maior barra: Menos Preocupante \(LC\), com 12\.167 \(79,0%\)/);
  assert.match(announcement(getChartSpec('biomas', 'PANTANAL')), /^Gráfico atualizado: .*Pantanal\. 8 barras\. Maior: Menos Preocupante \(LC\), 92,7%\./);
  assert.match(announcement(getChartSpec('ameaca-por-grupo', 'AVES')), /3 colunas\. Maior: Vulnerável \(VU\), 54,3%\./);
  assert.match(renderChart(getChartSpec('grupos')), /Tab e Shift\+Tab passam por todas as barras\. As setas, Home e End também trocam de barra/);
  assert.match(renderChart(getChartSpec('ameaca-por-grupo')), /todas as colunas\. As setas, Home e End também trocam de coluna/);
});

test('todo gráfico: ids únicos, sem manipulador inline nem script', () => {
  for (const spec of everySpec()) {
    const html = renderChart(spec);
    const all = ids(html);
    assert.equal(new Set(all).size, all.length, `${spec.caption}: ids repetidos`);
    assert.doesNotMatch(html, /\son[a-z]+\s*=/i);
    assert.doesNotMatch(html, /<script/i);
  }
});

test('rótulos com HTML são escapados', () => {
  for (const type of ['bar', 'column']) {
    const html = renderChart({ id: 'x', type, caption: '<img src=x onerror=alert(1)>', items: [{ label: '<script>alert(1)</script>', code: '<b>', value: 1, percent: 100 }] });
    assert.doesNotMatch(html, /<script>alert/);
    assert.doesNotMatch(html, /<img src=x/);
    assert.doesNotMatch(html, /<b>/);
  }
});

test('gráfico sem dados e com um único item não quebram', () => {
  for (const type of ['bar', 'column']) {
    assert.match(renderChart({ id: 'v', type, caption: 'vazio', items: [] }), /Sem dados/);
    const one = renderChart({ id: 'u', type, caption: 'um', items: [{ label: 'Só', value: 3, percent: 100 }] });
    assert.match(one, /(Barra|Coluna) 1 de 1\./);
  }
});
