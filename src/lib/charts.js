import {
  BIOMES,
  CATEGORIES,
  EVALUATED_CATEGORIES,
  EVALUATED_GROUPS,
  THREATENED_BY_GROUP,
} from '../data/salve.js';
import { formatInt } from './format.js';

const categoryLabel = (code) => `${CATEGORIES[code].name} (${code})`;

const fromCategories = (rows) =>
  rows.map((row) => ({ code: row.code, label: categoryLabel(row.code), value: row.total, percent: row.percent }));

/** Opções dos filtros (valor + rótulo), na ordem em que aparecem no <select>. */
export const GROUP_OPTIONS = EVALUATED_GROUPS.map((group) => ({ value: group.code, label: group.label }));
export const BIOME_OPTIONS = Object.entries(BIOMES).map(([value, biome]) => ({ value, label: biome.label }));

export const DEFAULT_KEYS = Object.freeze({ 'ameaca-por-grupo': 'ANFIBIOS', biomas: 'MATA_ATLANTICA' });

/** Categorias em ameaça, como o painel do portal as conta. */
export const THREATENED_CODES = Object.freeze(['CR', 'EN', 'VU']);

/** Ordem das colunas do gráfico de ameaça por grupo, a mesma do portal (da menos para a mais grave). */
const THREAT_COLUMNS = Object.freeze(['VU', 'EN', 'CR']);

const groupLabel = (code) => EVALUATED_GROUPS.find((group) => group.code === code).label;

const sum = (rows, field) => rows.reduce((total, row) => total + row[field], 0);

/**
 * Monta a especificação de um gráfico a partir dos dados estáticos.
 * `chartId` identifica o gráfico; `key` escolhe o recorte nos gráficos com filtro.
 *
 * `type` escolhe o desenho: 'pie' (padrão), 'bar' (barras horizontais) ou
 * 'column' (colunas verticais). Um item com `chart: false` entra na tabela de
 * dados, mas não no desenho, no resumo nem na ordem de Tab.
 */
export function getChartSpec(chartId, key = DEFAULT_KEYS[chartId]) {
  switch (chartId) {
    case 'ameacadas': {
      // O portal publica o total (1.383), mas não o percentual de cada categoria: aqui ele é calculado.
      const rows = THREATENED_CODES.map((code) => EVALUATED_CATEGORIES.find((row) => row.code === code));
      const base = sum(rows, 'total');
      return {
        id: 'pie-ameacadas',
        type: 'pie',
        caption: 'Espécies em categoria de ameaça, por categoria',
        shortName: 'espécies em categoria de ameaça',
        headerLabel: 'Categoria',
        totalLabel: 'Total em CR, EN e VU',
        note: `Percentuais calculados neste site sobre as ${formatInt(base)} espécies em categoria de ameaça.`,
        items: rows.map((row) => ({
          code: row.code,
          label: categoryLabel(row.code),
          value: row.total,
          percent: Math.round((row.total / base) * 1000) / 10,
        })),
      };
    }
    case 'categorias':
      return {
        id: 'barras-categorias',
        type: 'bar',
        caption: 'Espécies avaliadas por categoria de risco',
        shortName: 'categorias de risco',
        headerLabel: 'Categoria',
        items: fromCategories(EVALUATED_CATEGORIES),
      };
    case 'grupos':
      return {
        id: 'barras-grupos',
        type: 'bar',
        caption: 'Espécies avaliadas por grupo da fauna',
        shortName: 'grupos da fauna',
        headerLabel: 'Grupo',
        items: EVALUATED_GROUPS.map((group) => ({
          code: group.code,
          label: group.label,
          value: group.total,
          percent: group.percent,
        })),
      };
    case 'ameaca-por-grupo': {
      const rows = THREATENED_BY_GROUP[key];
      if (!rows) throw new Error(`Grupo desconhecido: ${key}`);
      const items = fromCategories(rows);
      // Como o portal: colunas VU, EN e CR. Outras categorias (EW em Aves) ficam só na tabela.
      const shown = THREAT_COLUMNS.map((code) => items.find((item) => item.code === code)).filter(Boolean);
      const tableOnly = items.filter((item) => !THREAT_COLUMNS.includes(item.code)).map((item) => ({ ...item, chart: false }));
      return {
        id: 'colunas-ameaca',
        type: 'column',
        caption: `Espécies ameaçadas: ${groupLabel(key)}, ${formatInt(sum(shown, 'value'))} no total`,
        shortName: 'risco dentro de cada grupo',
        headerLabel: 'Categoria',
        totalLabel: 'Total em CR, EN e VU',
        items: [...shown, ...tableOnly],
      };
    }
    case 'biomas': {
      const biome = BIOMES[key];
      if (!biome) throw new Error(`Bioma desconhecido: ${key}`);
      return {
        id: 'barras-biomas',
        type: 'bar',
        caption: `Espécies avaliadas por categoria de risco: ${biome.label}`,
        shortName: 'risco por bioma',
        headerLabel: 'Categoria',
        items: fromCategories(biome.categories),
      };
    }
    default:
      throw new Error(`Gráfico desconhecido: ${chartId}`);
  }
}
