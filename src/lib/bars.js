import { escapeHtml, formatInt, formatPercent } from './format.js';
import {
  PALETTE,
  chartEntries,
  kindOf,
  markName,
  renderChartTail,
  renderLegendItems,
  renderPatterns,
  slug,
  styleIndex,
} from './chart-common.js';

const round4 = (value) => Math.round(value * 10000) / 10000;

/**
 * O preenchimento de cada barra é um SVG com um retângulo que usa o padrão
 * definido no gráfico (`fill: var(--pat)`). O `scale(3)` aumenta o padrão, que é
 * desenhado numa célula de 8 unidades, para ficar do tamanho do das fatias da pizza.
 * O retângulo passa da caixa e o SVG recorta o excesso.
 */
const FILL = '<svg class="bar-fill" aria-hidden="true" focusable="false"><rect width="100%" height="100%" transform="scale(3)"/></svg>';

/**
 * Renderiza um gráfico de barras horizontais (`type: 'bar'`) ou de colunas
 * verticais (`type: 'column'`) acessível como HTML.
 *
 * O resultado é completo e legível sem JavaScript. O custom element
 * <accessible-bars> acrescenta teclado, foco e destaque: cada barra ou coluna
 * é uma parada de Tab, e a linha da legenda (ou o rótulo da barra) acende junto.
 *
 * - barras: o rótulo e o valor ficam na própria linha e fazem o papel da legenda;
 * - colunas: a legenda é a mesma lista das pizzas.
 */
export function renderBars(spec) {
  const entries = chartEntries(spec);
  const kind = kindOf(spec);
  const column = spec.type === 'column';
  const id = spec.id;
  const count = entries.length;
  // Barras: o maior valor ocupa a largura toda. Colunas: escala fixa de 0 a 100%,
  // para que grupos diferentes continuem comparáveis quando o filtro muda.
  const max = Math.max(0, ...entries.map(({ item }) => item.value));

  const mark = ({ item, index }, position) => {
    const n = styleIndex(item, index);
    const name = markName(item, position + 1, count, spec, kind.cap);
    const share = column ? item.percent / 100 : item.value / max;
    return {
      style: `--c:${PALETTE[n]};--pat:url(#${id}-p${n});--w:${round4(share)}`,
      bar: `<span class="bar" id="${id}-${kind.one}-${slug(item, position)}" role="img" aria-label="${escapeHtml(name)}">${FILL}</span>`,
    };
  };

  let body = '';
  if (count > 0 && !column) {
    const rows = entries
      .map((entry, position) => {
        const { item } = entry;
        const { style, bar } = mark(entry, position);
        return `<div class="bar-row" id="${id}-legenda-${slug(item, position)}" data-position="${position}" style="${style}"><span class="bar-label" aria-hidden="true">${escapeHtml(item.label)}</span><span class="bar-lane">${bar}</span><span class="bar-value" aria-hidden="true"><strong>${formatInt(item.value)}</strong> <span class="legend-pct">${formatPercent(item.percent)}</span></span></div>`;
      })
      .join('');
    body = `<div class="bar-chart" role="group" aria-labelledby="${id}-cap" aria-describedby="${id}-sum ${id}-hint"><svg class="bar-defs" aria-hidden="true" focusable="false" width="0" height="0"><defs>${renderPatterns(spec)}</defs></svg>${rows}</div>`;
  } else if (count > 0) {
    const columns = entries
      .map((entry, position) => {
        const { item } = entry;
        const { style, bar } = mark(entry, position);
        return `<div class="bar-col" data-position="${position}" style="${style}"><span class="bar-lane"><span class="bar-pct" aria-hidden="true">${formatPercent(item.percent)}</span>${bar}</span><span class="bar-code" aria-hidden="true">${escapeHtml(item.code ?? item.label)}</span></div>`;
      })
      .join('');
    body = `<div class="bar-chart" role="group" aria-labelledby="${id}-cap" aria-describedby="${id}-sum ${id}-hint"><svg class="bar-defs" aria-hidden="true" focusable="false" width="0" height="0"><defs>${renderPatterns(spec)}</defs></svg><div class="bar-columns" style="--n:${count}">${columns}</div><ul class="legend" role="list" aria-hidden="true">${renderLegendItems(entries, spec)}</ul></div>`;
  }

  return `<accessible-bars class="bars" data-orientation="${column ? 'column' : 'row'}" data-chart-id="${id}"><figure class="pie-figure"><figcaption class="pie-caption" id="${id}-cap">${escapeHtml(spec.caption)}</figcaption>${body}${renderChartTail(spec)}</figure></accessible-bars>`;
}
