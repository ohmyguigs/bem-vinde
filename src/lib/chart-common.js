import { escapeHtml, formatInt, formatPercent } from './format.js';

/**
 * Peças comuns a todos os gráficos (pizza, barras e colunas): cores, padrões,
 * texto da legenda, nome acessível, resumo, legenda e tabela de dados.
 */

/**
 * Cores dos itens. Todas são escuras o bastante para sustentar texto branco
 * e para manter 3:1 contra o fundo da seção do atlas (medido em
 * A11Y-DECISIONS.md). A cor nunca é o único canal: cada item também tem um
 * padrão de preenchimento, contorno, legenda e tabela.
 */
export const PALETTE = Object.freeze([
  '#b3261e', // 0 vermelho
  '#b94a0b', // 1 laranja queimado
  '#8a5a00', // 2 ocre
  '#566b0c', // 3 oliva
  '#0b6b5f', // 4 verde-azulado
  '#475569', // 5 ardósia
  '#6f655f', // 6 pedra
  '#161a22', // 7 quase preto
  '#6b21a8', // 8 roxo
  '#b0125f', // 9 magenta
]);

/** Cada categoria de risco mantém a mesma cor e o mesmo padrão em todos os gráficos. */
export const CATEGORY_STYLE = Object.freeze({
  CR: 0,
  EN: 1,
  VU: 2,
  NT: 3,
  LC: 4,
  DD: 5,
  NA: 6,
  EX: 7,
  EW: 8,
  RE: 9,
});

/** Padrões de preenchimento (célula 8×8). Segundo canal visual além da cor. */
const PATTERN_SHAPES = Object.freeze([
  '<path class="pl" d="M0 8 L8 0 M-2 2 L2 -2 M6 10 L10 6"/>', // 0 diagonal /
  '<path class="pl" d="M0 0 L8 8 M-2 6 L2 10 M6 -2 L10 2"/>', // 1 diagonal \
  '<path class="pl" d="M0 2 H8 M0 6 H8"/>', // 2 horizontais
  '<path class="pl" d="M2 0 V8 M6 0 V8"/>', // 3 verticais
  '<circle class="pf" cx="2" cy="2" r="1.05"/><circle class="pf" cx="6" cy="6" r="1.05"/>', // 4 pontos
  '<path class="pl" d="M0 4 H8 M4 0 V8"/>', // 5 cruz
  '<path class="pl" d="M0 0 L8 8 M0 8 L8 0"/>', // 6 xadrez diagonal
  '<path class="pl" d="M0 3 Q2 0 4 3 T8 3 M0 7 Q2 4 4 7 T8 7"/>', // 7 ondas
  '<rect class="pf" x="1" y="1" width="2.4" height="2.4"/><rect class="pf" x="5" y="5" width="2.4" height="2.4"/>', // 8 quadrados
  '<path class="pl pl-bold" d="M-1 5 L5 -1 M3 9 L9 3"/>', // 9 diagonal larga
]);

/** Como cada tipo de gráfico chama os seus itens. */
const KINDS = Object.freeze({
  pie: { chart: 'Gráfico de pizza', one: 'fatia', many: 'fatias', cap: 'Fatia' },
  bar: { chart: 'Gráfico de barras', one: 'barra', many: 'barras', cap: 'Barra' },
  column: { chart: 'Gráfico de colunas', one: 'coluna', many: 'colunas', cap: 'Coluna' },
});

export const kindOf = (spec) => KINDS[spec.type] ?? KINDS.pie;

export const styleIndex = (item, position) =>
  item.code && item.code in CATEGORY_STYLE ? CATEGORY_STYLE[item.code] : position % PALETTE.length;

/** "1 espécie", "2 espécies". */
export const unitFor = (spec, count) => {
  const [one, many] = spec.unit ?? ['espécie', 'espécies'];
  return count === 1 ? one : many;
};

/**
 * Texto de uma linha da legenda, na forma em que o leitor de tela o fala
 * ("Aves: 2.069 espécies, 13,1%."). É a única fonte do nome acessível de
 * cada fatia, barra ou coluna: o que se vê e o que se ouve dizem sempre a
 * mesma coisa.
 */
export function legendText(item, spec) {
  return `${item.label}: ${formatInt(item.value)} ${unitFor(spec, item.value)}, ${formatPercent(item.percent)}.`;
}

/** Nome acessível: a linha da legenda mais a posição ("… Barra 2 de 10."). `noun` é "Fatia", "Barra" ou "Coluna". */
export function markName(item, position, count, spec, noun) {
  return `${legendText(item, spec)} ${noun} ${position} de ${count}.`;
}

/**
 * Sufixo estável dos ids. Usa o código da categoria ou do grupo, então "CR"
 * tem o mesmo id em todos os recortes do gráfico.
 */
export const slug = (item, position) =>
  item.code ? String(item.code).toLowerCase().replace(/[^a-z0-9]+/g, '-') : String(position + 1);

/**
 * Itens desenhados, com o índice original (que decide cor e padrão quando não
 * há código de categoria). Itens com `chart: false` ficam só na tabela.
 */
export const chartEntries = (spec) =>
  spec.items.map((item, index) => ({ item, index })).filter(({ item }) => item.value > 0 && item.chart !== false);

export const chartItems = (spec) => chartEntries(spec).map((entry) => entry.item);

/** Resumo em texto: a conclusão do gráfico, para quem não vê o desenho. */
export function summarize(spec) {
  const items = chartItems(spec);
  const kind = kindOf(spec);
  const total = items.reduce((sum, item) => sum + item.value, 0);
  if (items.length === 0) return 'Sem dados para este gráfico.';
  const biggest = items.reduce((a, b) => (b.value > a.value ? b : a));
  const smallest = items.reduce((a, b) => (b.value < a.value ? b : a));
  const head = `${kind.chart} com ${items.length} ${items.length === 1 ? kind.one : kind.many}, somando ${formatInt(total)} ${unitFor(spec, total)}.`;
  if (items.length === 1) return `${head} ${biggest.label} concentra tudo.`;
  return `${head} Maior ${kind.one}: ${biggest.label}, com ${formatInt(biggest.value)} (${formatPercent(biggest.percent)}). Menor ${kind.one}: ${smallest.label}, com ${formatInt(smallest.value)} (${formatPercent(smallest.percent)}).`;
}

/** Mensagem curta anunciada depois que um filtro muda o gráfico. */
export function announcement(spec) {
  const items = chartItems(spec);
  const kind = kindOf(spec);
  const biggest = items.reduce((a, b) => (b.value > a.value ? b : a));
  return `Gráfico atualizado: ${spec.caption}. ${items.length} ${items.length === 1 ? kind.one : kind.many}. Maior: ${biggest.label}, ${formatPercent(biggest.percent)}.`;
}

/** Texto da dica de teclado, no plural do tipo de gráfico. */
export function keyboardHint(spec) {
  const kind = kindOf(spec);
  return `Com o teclado: Tab e Shift+Tab passam por todas as ${kind.many}. As setas, Home e End também trocam de ${kind.one}, e Esc limpa o destaque.`;
}

/** Definições dos padrões usados pelo gráfico (dentro de um <defs>). */
export function renderPatterns(spec) {
  const used = new Map();
  spec.items.forEach((item, position) => {
    if (item.value > 0 && item.chart !== false) used.set(styleIndex(item, position), true);
  });
  return [...used.keys()]
    .map(
      (n) =>
        `<pattern id="${spec.id}-p${n}" patternUnits="userSpaceOnUse" width="8" height="8"><rect width="8" height="8" fill="${PALETTE[n]}"/>${PATTERN_SHAPES[n]}</pattern>`,
    )
    .join('');
}

/**
 * Linhas da legenda (<li>), iguais em todos os gráficos que têm legenda.
 * @param {{item:object, index:number}[]} entries
 */
export function renderLegendItems(entries, spec) {
  return entries
    .map(({ item, index }, position) => {
      const n = styleIndex(item, index);
      return `<li class="legend-item" id="${spec.id}-legenda-${slug(item, position)}" data-position="${position}" style="--c:${PALETTE[n]};--pat:url(#${spec.id}-p${n})"><svg class="swatch" viewBox="0 0 16 16" width="22" height="22" aria-hidden="true" focusable="false"><rect x="1" y="1" width="14" height="14" rx="3"/></svg><span class="legend-label">${escapeHtml(item.label)}</span><span class="legend-value"><strong>${formatInt(item.value)}</strong> <span class="legend-pct">${formatPercent(item.percent)}</span></span></li>`;
    })
    .join('');
}

/** Tabela de dados equivalente ao gráfico: todas as linhas publicadas, inclusive as que o desenho não mostra. */
export function renderTable(spec) {
  const base = chartItems(spec).reduce((sum, item) => sum + item.value, 0);
  const rows = spec.items
    .filter((item) => item.value > 0)
    .map(
      (item) =>
        `<tr><th scope="row">${escapeHtml(item.label)}</th><td>${formatInt(item.value)}</td><td>${formatPercent(item.percent)}</td></tr>`,
    )
    .join('');
  return `<table class="data-table"><caption>${escapeHtml(spec.caption)}: dados do gráfico</caption><thead><tr><th scope="col">${escapeHtml(spec.headerLabel ?? 'Categoria')}</th><th scope="col">Espécies</th><th scope="col"><span aria-hidden="true">%</span><span class="sr-only">Percentual</span></th></tr></thead><tbody>${rows}</tbody><tfoot><tr><th scope="row">${escapeHtml(spec.totalLabel ?? 'Total do recorte')}</th><td>${formatInt(base)}</td><td><span aria-hidden="true">—</span><span class="sr-only">não se aplica</span></td></tr></tfoot></table>`;
}

/** Só a tabela, para a versão sem JavaScript que lista todos os recortes. */
export const renderTableOnly = (spec) => renderTable(spec);

/** Resumo, dica de teclado e tabela: o fim de todo gráfico, igual em todos os tipos. */
export function renderChartTail(spec) {
  const id = spec.id;
  const note = spec.note ? `<p class="table-note" tabindex="0">${escapeHtml(spec.note)}</p>` : '';
  return `<p class="pie-summary" id="${id}-sum" tabindex="0">${escapeHtml(summarize(spec))}</p><p class="pie-hint js-only" id="${id}-hint" tabindex="0">${escapeHtml(keyboardHint(spec))}</p><details class="pie-table"><summary id="${id}-tabela">Ver dados como tabela${spec.shortName ? `<span class="sr-only"> do gráfico de ${escapeHtml(spec.shortName)}</span>` : ''}</summary>${renderTable(spec)}${note}</details>`;
}
