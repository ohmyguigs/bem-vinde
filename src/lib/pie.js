import { computeSlices } from './pie-math.js';
import { escapeHtml, formatInt, formatPercent, round3 } from './format.js';
import {
  PALETTE,
  markName,
  renderChartTail,
  renderLegendItems,
  renderPatterns,
  slug,
  styleIndex,
  unitFor,
} from './chart-common.js';

// Reexporta o que os testes e os outros módulos já importavam daqui.
export { PALETTE, CATEGORY_STYLE, legendText, summarize, announcement, renderTableOnly } from './chart-common.js';

/** Texto lido pelos leitores de tela para uma fatia: a linha da legenda mais a posição. */
export const sliceName = (item, position, count, spec) => markName(item, position, count, spec, 'Fatia');

/**
 * Renderiza um gráfico de pizza acessível como HTML.
 * O resultado é completo e legível sem JavaScript; o custom element
 * <accessible-pie> apenas acrescenta teclado, foco e destaque.
 *
 * @param {{id:string, caption:string, unit?:string, headerLabel?:string, items:{label:string, value:number, percent:number, code?:string}[]}} spec
 */
export function renderPie(spec) {
  const slices = computeSlices(spec.items);
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

  const legend = renderLegendItems(
    slices.map((slice) => ({ item: slice.item, index: slice.index })),
    spec,
  );

  return `<accessible-pie class="pie" data-pie-id="${id}"><figure class="pie-figure"><figcaption class="pie-caption" id="${id}-cap">${escapeHtml(spec.caption)}</figcaption><div class="pie-grid"><div class="pie-stage"><svg class="pie-svg" viewBox="0 0 100 100" role="group" aria-labelledby="${id}-cap" aria-describedby="${id}-sum ${id}-hint"><defs>${renderPatterns(spec)}</defs>${groups}<g class="rings" aria-hidden="true"><path class="ring-halo" d=""/><path class="ring" d=""/></g></svg><p class="pie-readout js-only" aria-hidden="true" data-default="Passe o mouse, toque ou use as setas para ver os detalhes de cada fatia.">Passe o mouse, toque ou use as setas para ver os detalhes de cada fatia.</p></div><div class="pie-side"><ul class="legend" role="list" aria-hidden="true">${legend}</ul></div></div>${renderChartTail(spec)}</figure></accessible-pie>`;
}
