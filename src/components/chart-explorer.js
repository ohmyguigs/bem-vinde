import { announcement, renderPie } from '../lib/pie.js';
import { getChartSpec } from '../lib/charts.js';
import './accessible-pie.js';

/**
 * <chart-explorer data-chart="biomas">
 *
 * Liga um <select> nativo a um gráfico. O HTML já traz o gráfico do recorte
 * inicial e todas as tabelas; o JavaScript apenas troca o recorte no lugar,
 * sem navegar, e anuncia o resultado (e não "gráfico atualizado") numa região
 * role="status" pequena e dedicada, nunca no contêiner do gráfico.
 */
export class ChartExplorer extends HTMLElement {
  connectedCallback() {
    const select = this.querySelector('select');
    const host = this.querySelector('[data-pie-host]');
    const status = this.querySelector('[data-status]');
    const chartId = this.dataset.chart;
    if (!select || !host || !chartId) return;

    select.disabled = false;
    select.addEventListener('change', () => {
      const spec = getChartSpec(chartId, select.value);
      host.innerHTML = renderPie(spec);
      if (status) status.textContent = announcement(spec);
    });
  }
}

if (!customElements.get('chart-explorer')) {
  customElements.define('chart-explorer', ChartExplorer);
}
