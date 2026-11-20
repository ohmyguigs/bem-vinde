import { BIOMES, CATEGORIES, SOURCE, THREATENED_BY_GROUP, TOTALS } from '../data/salve.js';
import { PROJECTS } from '../data/projects.js';
import { BIOME_OPTIONS, DEFAULT_KEYS, GROUP_OPTIONS, getChartSpec } from './charts.js';
import { renderChart } from './chart-render.js';
import { renderTableOnly } from './chart-common.js';
import { escapeHtml, formatInt } from './format.js';

/**
 * Pré-renderização em tempo de build.
 *
 * O index.html contém marcadores como <!--@pie:categorias-->. O Vite os
 * substitui por HTML completo (gráfico, legenda e tabela), usando as mesmas
 * funções que o navegador usa para redesenhar o gráfico quando o filtro muda.
 * Resultado: a página inteira, com todos os números, existe no HTML inicial,
 * sem JavaScript e sem requisição a terceiros.
 */

const externalLink = (href, text, className = '') =>
  `<a${className ? ` class="${className}"` : ''} href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${text}<span class="sr-only"> (abre em nova aba)</span></a>`;

function kpis() {
  const items = [
    ['Espécies avaliadas', TOTALS.evaluated, ''],
    ['Espécies com ficha publicada', TOTALS.publishedSheets, ''],
    ['Espécies em categoria de ameaça', TOTALS.threatened, TOTALS.threatenedNote],
    ['Especialistas envolvidos', TOTALS.experts, ''],
  ];
  const cards = items
    .map(
      ([label, value, note]) =>
        `<div class="kpi"><dt class="kpi-label">${label}</dt><dd class="kpi-value">${formatInt(value)}${note ? `<span class="kpi-note">${escapeHtml(note)} (aviso do portal)</span>` : ''}</dd></div>`,
    )
    .join('');
  return `<dl class="kpis" tabindex="0">${cards}</dl>`;
}

function options(list, selected) {
  return list
    .map(
      (option) =>
        `<option value="${escapeHtml(option.value)}"${option.value === selected ? ' selected' : ''}>${escapeHtml(option.label)}</option>`,
    )
    .join('');
}

function allTables(chartId, keys) {
  return keys.map((key) => renderTableOnly(getChartSpec(chartId, key))).join('');
}

function glossary() {
  const rows = Object.values(CATEGORIES)
    .map((category) => `<div class="gloss-item"><dt>${category.code}</dt><dd>${escapeHtml(category.name)}</dd></div>`)
    .join('');
  return `<dl class="glossary" tabindex="0">${rows}</dl>`;
}

function endpoints() {
  return SOURCE.endpoints
    .map((endpoint) => `<li>${externalLink(endpoint.url, `<code>${escapeHtml(endpoint.id)}</code>`)}</li>`)
    .join('');
}

function projects() {
  return PROJECTS.map(
    (project) =>
      `<li class="project"><article><h3 class="project-name">${externalLink(project.url, escapeHtml(project.name))}</h3><p class="project-desc" tabindex="0">${escapeHtml(project.description)}</p><p class="project-meta" tabindex="0"><span>${escapeHtml(project.language)}</span><span>${project.year}</span></p></article></li>`,
  ).join('');
}

const RENDERERS = {
  'chart:ameacadas': () => renderChart(getChartSpec('ameacadas')),
  'chart:categorias': () => renderChart(getChartSpec('categorias')),
  'chart:grupos': () => renderChart(getChartSpec('grupos')),
  'chart:ameaca-por-grupo': () => renderChart(getChartSpec('ameaca-por-grupo')),
  'chart:biomas': () => renderChart(getChartSpec('biomas')),
  'options:ameaca-por-grupo': () => options(GROUP_OPTIONS, DEFAULT_KEYS['ameaca-por-grupo']),
  'options:biomas': () => options(BIOME_OPTIONS, DEFAULT_KEYS.biomas),
  'tables:ameaca-por-grupo': () => allTables('ameaca-por-grupo', Object.keys(THREATENED_BY_GROUP)),
  'tables:biomas': () => allTables('biomas', Object.keys(BIOMES)),
  kpis,
  glossary,
  endpoints,
  projects,
};

/** Substitui todos os marcadores <!--@nome--> do HTML. Marcador desconhecido falha o build. */
export function replacePlaceholders(html) {
  return html.replace(/<!--@([a-z:-]+)-->/g, (_, name) => {
    const render = RENDERERS[name];
    if (!render) throw new Error(`Marcador de pré-renderização desconhecido: ${name}`);
    return render();
  });
}
