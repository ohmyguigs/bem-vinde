import { renderBars } from './bars.js';
import { renderPie } from './pie.js';

export { announcement, summarize } from './chart-common.js';

/** Escolhe o desenho pelo tipo do gráfico: 'pie' (padrão), 'bar' ou 'column'. */
export function renderChart(spec) {
  return spec.type === 'bar' || spec.type === 'column' ? renderBars(spec) : renderPie(spec);
}
