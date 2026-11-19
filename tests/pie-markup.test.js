import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderPie, sliceName, legendText, summarize, announcement } from '../src/lib/pie.js';
import { BIOME_OPTIONS, GROUP_OPTIONS, getChartSpec } from '../src/lib/charts.js';
import { escapeHtml, formatInt } from '../src/lib/format.js';
import { attr, ids, tags } from './helpers.js';

const everySpec = () => [
  getChartSpec('categorias'),
  getChartSpec('grupos'),
  ...GROUP_OPTIONS.map((option) => getChartSpec('ameaca-por-grupo', option.value)),
  ...BIOME_OPTIONS.map((option) => getChartSpec('biomas', option.value)),
];

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

test('todo gráfico: tabela equivalente com legenda, cabeçalhos com scope e todos os valores', () => {
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

test('ids estáveis: a fatia de uma categoria tem o mesmo id em todos os recortes do gráfico', () => {
  for (const spec of everySpec()) {
    const html = renderPie(spec);
    const present = spec.items.filter((item) => item.value > 0);
    for (const item of present) {
      const code = item.code.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      assert.ok(html.includes(`id="${spec.id}-fatia-${code}"`), `${spec.caption}: falta ${spec.id}-fatia-${code}`);
      assert.ok(html.includes(`id="${spec.id}-legenda-${code}"`), `${spec.caption}: falta a legenda ${code}`);
    }
  }
  const cerrado = renderPie(getChartSpec('biomas', 'CERRADO'));
  const pantanal = renderPie(getChartSpec('biomas', 'PANTANAL'));
  assert.ok(cerrado.includes('id="pie-biomas-fatia-cr"'));
  assert.ok(pantanal.includes('id="pie-biomas-fatia-cr"'));
});

test('o resumo da tabela tem nome estável por gráfico, que não muda com o filtro', () => {
  const a = renderPie(getChartSpec('biomas', 'CERRADO')).match(/<summary id="[^"]+">(.*?)<\/summary>/)[1];
  const b = renderPie(getChartSpec('biomas', 'PANTANAL')).match(/<summary id="[^"]+">(.*?)<\/summary>/)[1];
  assert.equal(a, b);
  assert.match(a, /do gráfico de risco por bioma/);
  const names = ['categorias', 'grupos', 'ameaca-por-grupo', 'biomas'].map(
    (chart) => renderPie(getChartSpec(chart)).match(/<summary id="[^"]+">(.*?)<\/summary>/)[1],
  );
  assert.equal(new Set(names).size, 4, 'um nome diferente para cada gráfico');
});

test('todo gráfico: cor nunca é o único canal (padrão, cor e contorno distintos por fatia)', () => {
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

test('todo gráfico: ids únicos e nenhum manipulador de evento inline nem script', () => {
  for (const spec of everySpec()) {
    const html = renderPie(spec);
    const all = ids(html);
    assert.equal(new Set(all).size, all.length, `${spec.caption}: ids repetidos`);
    assert.doesNotMatch(html, /\son[a-z]+\s*=/i);
    assert.doesNotMatch(html, /<script/i);
  }
});

test('cada categoria mantém a mesma cor em todos os gráficos', () => {
  const colorOf = (html, label) => {
    const slice = html.match(new RegExp(`<g class="slice-group"[^>]*style="[^"]*--c:(#[0-9a-f]{6})[^"]*"><path class="slice"[^>]*aria-label="${label}`));
    return slice?.[1];
  };
  const a = colorOf(renderPie(getChartSpec('categorias')), 'Criticamente em Perigo \\(CR\\)');
  const b = colorOf(renderPie(getChartSpec('ameaca-por-grupo', 'AVES')), 'Criticamente em Perigo \\(CR\\)');
  const c = colorOf(renderPie(getChartSpec('biomas', 'CERRADO')), 'Criticamente em Perigo \\(CR\\)');
  assert.ok(a);
  assert.equal(a, b);
  assert.equal(a, c);
});

test('singular e plural: "1 espécie", "2 espécies"', () => {
  const spec = { id: 'x', caption: 'x', items: [{ label: 'A', value: 1, percent: 10 }, { label: 'B', value: 9, percent: 90 }] };
  assert.match(sliceName(spec.items[0], 1, 2, spec), /: 1 espécie,/);
  assert.match(sliceName(spec.items[1], 2, 2, spec), /: 9 espécies,/);
});

test('resumo em texto traz a conclusão do gráfico', () => {
  const text = summarize(getChartSpec('categorias'));
  assert.match(text, /10 fatias/);
  assert.match(text, /Maior fatia: Menos Preocupante \(LC\), com 12\.167 \(79,0%\)/);
});

test('anúncio do filtro descreve o resultado, não "gráfico atualizado" genérico', () => {
  const text = announcement(getChartSpec('biomas', 'PANTANAL'));
  assert.match(text, /Pantanal/);
  assert.match(text, /Maior: Menos Preocupante \(LC\), 92,7%/);
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
