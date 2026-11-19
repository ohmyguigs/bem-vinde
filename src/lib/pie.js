import { computeSlices } from './pie-math.js';
import { escapeHtml, formatInt, formatPercent, round3 } from './format.js';

/**
 * Cores das fatias. Todas são escuras o bastante para sustentar texto branco
 * e para manter 3:1 contra o fundo da seção do atlas (medido em
 * A11Y-DECISIONS.md). A cor nunca é o único canal: cada fatia também tem um
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

const styleIndex = (item, position) =>
  item.code && item.code in CATEGORY_STYLE ? CATEGORY_STYLE[item.code] : position % PALETTE.length;

/** "1 espécie", "2 espécies". */
const unitFor = (spec, count) => {
  const [one, many] = spec.unit ?? ['espécie', 'espécies'];
  return count === 1 ? one : many;
};

/**
 * Texto de uma linha da legenda, na forma em que o leitor de tela o fala
 * ("Aves: 2.069 espécies, 13,1%."). É a única fonte do nome acessível da
 * fatia: a legenda visível e a fatia focada dizem sempre a mesma coisa.
 */
export function legendText(item, spec) {
  return `${item.label}: ${formatInt(item.value)} ${unitFor(spec, item.value)}, ${formatPercent(item.percent)}.`;
}

/** Texto lido pelos leitores de tela para uma fatia: a linha da legenda mais a posição. */
export function sliceName(item, position, count, spec) {
  return `${legendText(item, spec)} Fatia ${position} de ${count}.`;
}

/**
 * Sufixo estável dos ids de fatia e de legenda. Usa o código da categoria
 * ou do grupo, então "CR" tem o mesmo id em todos os recortes do gráfico.
 */
const slug = (item, position) =>
  item.code ? String(item.code).toLowerCase().replace(/[^a-z0-9]+/g, '-') : String(position + 1);

/** Resumo em texto: a conclusão do gráfico, para quem não vê o desenho. */
export function summarize(spec) {
  const items = spec.items.filter((item) => item.value > 0);
  const total = items.reduce((sum, item) => sum + item.value, 0);
  if (items.length === 0) return 'Sem dados para este gráfico.';
  const biggest = items.reduce((a, b) => (b.value > a.value ? b : a));
  const smallest = items.reduce((a, b) => (b.value < a.value ? b : a));
  const head = `Gráfico de pizza com ${items.length} ${items.length === 1 ? 'fatia' : 'fatias'}, somando ${formatInt(total)} ${unitFor(spec, total)}.`;
  if (items.length === 1) return `${head} ${biggest.label} concentra tudo.`;
  return `${head} Maior fatia: ${biggest.label}, com ${formatInt(biggest.value)} (${formatPercent(biggest.percent)}). Menor fatia: ${smallest.label}, com ${formatInt(smallest.value)} (${formatPercent(smallest.percent)}).`;
}

/** Mensagem curta anunciada depois que um filtro muda o gráfico. */
export function announcement(spec) {
  const items = spec.items.filter((item) => item.value > 0);
  const biggest = items.reduce((a, b) => (b.value > a.value ? b : a));
  return `Gráfico atualizado: ${spec.caption}. ${items.length} ${items.length === 1 ? 'fatia' : 'fatias'}. Maior: ${biggest.label}, ${formatPercent(biggest.percent)}.`;
}

function renderPatterns(spec) {
  const used = new Map();
  spec.items.forEach((item, position) => {
    if (item.value > 0) used.set(styleIndex(item, position), true);
  });
  return [...used.keys()]
    .map(
      (n) =>
        `<pattern id="${spec.id}-p${n}" patternUnits="userSpaceOnUse" width="8" height="8"><rect width="8" height="8" fill="${PALETTE[n]}"/>${PATTERN_SHAPES[n]}</pattern>`,
    )
    .join('');
}

function renderTable(spec, base) {
  const rows = spec.items
    .filter((item) => item.value > 0)
    .map(
      (item) =>
        `<tr><th scope="row">${escapeHtml(item.label)}</th><td>${formatInt(item.value)}</td><td>${formatPercent(item.percent)}</td></tr>`,
    )
    .join('');
  return `<table class="data-table"><caption>${escapeHtml(spec.caption)}: dados do gráfico</caption><thead><tr><th scope="col">${escapeHtml(spec.headerLabel ?? 'Categoria')}</th><th scope="col">Espécies</th><th scope="col"><span aria-hidden="true">%</span><span class="sr-only">Percentual</span></th></tr></thead><tbody>${rows}</tbody><tfoot><tr><th scope="row">Total usado como base</th><td>${formatInt(base)}</td><td><span aria-hidden="true">—</span><span class="sr-only">não se aplica</span></td></tr></tfoot></table>`;
}

/**
 * Renderiza um gráfico de pizza acessível como HTML.
 * O resultado é completo e legível sem JavaScript; o custom element
 * <accessible-pie> apenas acrescenta teclado, foco e destaque.
 *
 * @param {{id:string, caption:string, unit?:string, headerLabel?:string, items:{label:string, value:number, percent:number, code?:string}[]}} spec
 */
export function renderPie(spec) {
  const slices = computeSlices(spec.items);
  const base = spec.items.reduce((sum, item) => sum + item.value, 0);
  const summary = summarize(spec);
  const count = slices.length;
  const id = spec.id;

  const groups = slices
    .map((slice, position) => {
      const { item } = slice;
      const n = styleIndex(item, slice.index);
      const label =
        item.percent >= 9
          ? `<text class="pie-pct" x="${slice.labelX}" y="${slice.labelY}" text-anchor="middle" dominant-baseline="central" aria-hidden="true">${formatPercent(item.percent)}</text>`
          : '';
      return `<g class="slice-group" data-position="${position}" data-mid="${round3(slice.mid)}" data-angle="${round3(slice.angle)}" style="--c:${PALETTE[n]};--pat:url(#${id}-p${n});--ex:${slice.ex};--ey:${slice.ey};--i:${position}"><path class="slice" id="${id}-fatia-${slug(item, position)}" d="${slice.d}" role="img" aria-label="${escapeHtml(sliceName(item, position + 1, count, spec))}" data-readout="${escapeHtml(`${item.label}: ${formatInt(item.value)} ${unitFor(spec, item.value)} · ${formatPercent(item.percent)}`)}"/>${label}</g>`;
    })
    .join('');

  const legend = slices
    .map((slice, position) => {
      const { item } = slice;
      const n = styleIndex(item, slice.index);
      return `<li class="legend-item" id="${id}-legenda-${slug(item, position)}" data-position="${position}" style="--c:${PALETTE[n]};--pat:url(#${id}-p${n})"><svg class="swatch" viewBox="0 0 16 16" width="22" height="22" aria-hidden="true" focusable="false"><rect x="1" y="1" width="14" height="14" rx="3"/></svg><span class="legend-label">${escapeHtml(item.label)}</span><span class="legend-value"><strong>${formatInt(item.value)}</strong> <span class="legend-pct">${formatPercent(item.percent)}</span></span></li>`;
    })
    .join('');

  return `<accessible-pie class="pie" data-pie-id="${id}"><figure class="pie-figure"><figcaption class="pie-caption" id="${id}-cap">${escapeHtml(spec.caption)}</figcaption><div class="pie-grid"><div class="pie-stage"><svg class="pie-svg" viewBox="0 0 100 100" role="group" aria-labelledby="${id}-cap" aria-describedby="${id}-sum ${id}-hint"><defs>${renderPatterns(spec)}</defs>${groups}<g class="rings" aria-hidden="true"><path class="ring-halo" d=""/><path class="ring" d=""/></g></svg><p class="pie-readout js-only" aria-hidden="true" data-default="Passe o mouse, toque ou use as setas para ver os detalhes de cada fatia.">Passe o mouse, toque ou use as setas para ver os detalhes de cada fatia.</p></div><div class="pie-side"><ul class="legend" role="list" aria-hidden="true">${legend}</ul></div></div><p class="pie-summary" id="${id}-sum">${escapeHtml(summary)}</p><p class="pie-hint js-only" id="${id}-hint">Com o teclado: Tab e Shift+Tab passam por todas as fatias. As setas, Home e End também trocam de fatia, e Esc limpa o destaque.</p><details class="pie-table"><summary id="${id}-tabela">Ver dados como tabela${spec.shortName ? `<span class="sr-only"> do gráfico de ${escapeHtml(spec.shortName)}</span>` : ''}</summary>${renderTable(spec, base)}</details></figure></accessible-pie>`;
}

/** Só a tabela, para a versão sem JavaScript que lista todos os recortes. */
export function renderTableOnly(spec) {
  const base = spec.items.reduce((sum, item) => sum + item.value, 0);
  return renderTable(spec, base);
}
