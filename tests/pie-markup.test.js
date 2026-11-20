import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderPie, sliceName, legendText, summarize, announcement } from '../src/lib/pie.js';
import { getChartSpec } from '../src/lib/charts.js';
import { escapeHtml, formatInt } from '../src/lib/format.js';
import { attr, ids, tags } from './helpers.js';

// A pizza fica para um gráfico em que ela é a escolha certa: três partes de um todo.
const everySpec = () => [getChartSpec('ameacadas')];

test('a pizza das espécies ameaçadas: CR, EN e VU, com o percentual calculado sobre o total', () => {
  const spec = getChartSpec('ameacadas');
  assert.equal(spec.type, 'pie');
  assert.deepEqual(spec.items.map((item) => item.code), ['CR', 'EN', 'VU']);
  assert.deepEqual(spec.items.map((item) => item.value), [361, 510, 512]);
  assert.deepEqual(spec.items.map((item) => item.percent), [26.1, 36.9, 37.0]);
  assert.match(spec.note, /sobre as 1\.383 espécies em categoria de ameaça/);
});

test('todo gráfico: SVG nomeado, descrito e com uma fatia nomeada por item', () => {
  for (const spec of everySpec()) {
    const html = renderPie(spec);
    const present = spec.items.filter((item) => item.value > 0);
    const svg = html.match(/<svg class="pie-svg"[^>]*>/)[0];
    assert.match(svg, /role="group"/, spec.caption);
    for (const ref of attr(svg, 'aria-labelledby').split(' ')) assert.ok(ids(html).includes(ref), `${spec.caption}: aria-labelledby órfão ${ref}`);
    for (const ref of attr(svg, 'aria-describedby').split(' ')) assert.ok(ids(html).includes(ref), `${spec.caption}: aria-describedby órfão ${ref}`);

    const slices = tags(html, 'path').filter((a) => /class="slice"/.test(a));
    assert.equal(slices.length, present.length, spec.caption);
    slices.forEach((a, index) => {
      assert.equal(attr(a, 'role'), 'img');
      assert.ok(attr(a, 'aria-label').includes(`Fatia ${index + 1} de ${present.length}.`), attr(a, 'aria-label'));
    });
    assert.equal((html.match(/class="legend-item"/g) ?? []).length, present.length, `${spec.caption}: legenda`);
  }
});

test('pizza: tabela equivalente com legenda, cabeçalhos com scope, todos os valores e a nota do cálculo', () => {
  for (const spec of everySpec()) {
    const html = renderPie(spec);
    assert.match(html, /<table class="data-table"><caption>[^<]+: dados do gráfico<\/caption>/, spec.caption);
    assert.match(html, /<th scope="col">/);
    const rows = html.match(/<tr><th scope="row">/g) ?? [];
    const present = spec.items.filter((item) => item.value > 0);
    assert.equal(rows.length, present.length + 1, `${spec.caption}: linhas + rodapé`);
    for (const item of present) {
      assert.ok(html.includes(`<td>${formatInt(item.value)}</td>`), `${spec.caption}: falta o valor ${item.value}`);
    }
    assert.match(html, /<details class="pie-table"><summary id="[^"]+">Ver dados como tabela/);
    assert.match(html, /<th scope="row">Total em CR, EN e VU<\/th><td>1\.383<\/td>/);
    assert.match(html, /<p class="table-note" tabindex="0">Percentuais calculados neste site sobre as 1\.383 espécies/);
  }
});

test('nome da fatia = texto da linha da legenda + posição; legenda escondida do leitor de tela', () => {
  for (const spec of everySpec()) {
    const html = renderPie(spec);
    const present = spec.items.filter((item) => item.value > 0);
    const legend = html.match(/<ul class="legend"[^>]*>/)[0];
    assert.match(legend, /aria-hidden="true"/, `${spec.caption}: a legenda tem de ficar escondida do leitor`);
    assert.doesNotMatch(legend, /aria-label/, 'legenda escondida não precisa de nome');
    const slices = tags(html, 'path').filter((a) => /class="slice"/.test(a));
    slices.forEach((a, index) => {
      const expected = `${legendText(present[index], spec)} Fatia ${index + 1} de ${present.length}.`;
      assert.equal(attr(a, 'aria-label'), escapeHtml(expected));
    });
  }
  const spec = getChartSpec('grupos');
  assert.equal(legendText(spec.items[1], spec), 'Aves: 2.069 espécies, 13,1%.');
  assert.equal(sliceName(spec.items[1], 2, 10, spec), 'Aves: 2.069 espécies, 13,1%. Fatia 2 de 10.');
});

test('ids estáveis da pizza: fatia e linha da legenda pelo código da categoria', () => {
  const html = renderPie(getChartSpec('ameacadas'));
  for (const code of ['cr', 'en', 'vu']) {
    assert.ok(html.includes(`id="pie-ameacadas-fatia-${code}"`), `falta a fatia ${code}`);
    assert.ok(html.includes(`id="pie-ameacadas-legenda-${code}"`), `falta a legenda ${code}`);
  }
  assert.ok(html.includes('<summary id="pie-ameacadas-tabela">'));
});

test('pizza: cor nunca é o único canal (padrão, cor e contorno distintos por fatia)', () => {
  for (const spec of everySpec()) {
    const html = renderPie(spec);
    const groups = [...html.matchAll(/<g class="slice-group"[^>]*style="([^"]+)"/g)].map((m) => m[1]);
    const colors = groups.map((s) => s.match(/--c:(#[0-9a-f]{6})/)[1]);
    const patterns = groups.map((s) => s.match(/--pat:(url\(#[^)]+\))/)[1]);
    assert.equal(new Set(colors).size, groups.length, `${spec.caption}: cores repetidas`);
    assert.equal(new Set(patterns).size, groups.length, `${spec.caption}: padrões repetidos`);
    for (const pattern of patterns) {
      const id = pattern.slice(5, -1);
      assert.ok(html.includes(`<pattern id="${id}"`), `${spec.caption}: padrão ${id} não definido`);
    }
  }
});

test('pizza: ids únicos e nenhum manipulador de evento inline nem script', () => {
  for (const spec of everySpec()) {
    const html = renderPie(spec);
    const all = ids(html);
    assert.equal(new Set(all).size, all.length, `${spec.caption}: ids repetidos`);
    assert.doesNotMatch(html, /\son[a-z]+\s*=/i);
    assert.doesNotMatch(html, /<script/i);
  }
});

test('singular e plural: "1 espécie", "2 espécies"', () => {
  const spec = { id: 'x', caption: 'x', items: [{ label: 'A', value: 1, percent: 10 }, { label: 'B', value: 9, percent: 90 }] };
  assert.match(sliceName(spec.items[0], 1, 2, spec), /: 1 espécie,/);
  assert.match(sliceName(spec.items[1], 2, 2, spec), /: 9 espécies,/);
});

test('resumo em texto da pizza traz a conclusão do gráfico', () => {
  const text = summarize(getChartSpec('ameacadas'));
  assert.match(text, /^Gráfico de pizza com 3 fatias, somando 1\.383 espécies\./);
  assert.match(text, /Maior fatia: Vulnerável \(VU\), com 512 \(37,0%\)/);
  assert.match(text, /Menor fatia: Criticamente em Perigo \(CR\), com 361 \(26,1%\)/);
});

test('anúncio descreve o resultado, não "gráfico atualizado" genérico', () => {
  assert.match(announcement(getChartSpec('ameacadas')), /3 fatias\. Maior: Vulnerável \(VU\), 37,0%\./);
});

test('rótulos com HTML são escapados', () => {
  const html = renderPie({ id: 'x', caption: '<img src=x onerror=alert(1)>', items: [{ label: '<script>alert(1)</script>', value: 1, percent: 100 }] });
  assert.doesNotMatch(html, /<script>alert/);
  assert.doesNotMatch(html, /<img src=x/);
});

test('gráfico sem dados e com uma única fatia não quebram', () => {
  assert.match(renderPie({ id: 'v', caption: 'vazio', items: [] }), /Sem dados/);
  assert.match(renderPie({ id: 'u', caption: 'um', items: [{ label: 'Só', value: 3, percent: 100 }] }), /Fatia 1 de 1\./);
});
