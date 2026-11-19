import {
  BIOMES,
  CATEGORIES,
  EVALUATED_CATEGORIES,
  EVALUATED_GROUPS,
  THREATENED_BY_GROUP,
} from '../data/salve.js';

const categoryLabel = (code) => `${CATEGORIES[code].name} (${code})`;

const fromCategories = (rows) =>
  rows.map((row) => ({ code: row.code, label: categoryLabel(row.code), value: row.total, percent: row.percent }));

/** Opções dos filtros (valor + rótulo), na ordem em que aparecem no <select>. */
export const GROUP_OPTIONS = EVALUATED_GROUPS.map((group) => ({ value: group.code, label: group.label }));
export const BIOME_OPTIONS = Object.entries(BIOMES).map(([value, biome]) => ({ value, label: biome.label }));

export const DEFAULT_KEYS = Object.freeze({ 'ameaca-por-grupo': 'ANFIBIOS', biomas: 'MATA_ATLANTICA' });

const groupLabel = (code) => EVALUATED_GROUPS.find((group) => group.code === code).label;

/**
 * Monta a especificação de um gráfico a partir dos dados estáticos.
 * `chartId` identifica o gráfico; `key` escolhe o recorte nos gráficos com filtro.
 */
export function getChartSpec(chartId, key = DEFAULT_KEYS[chartId]) {
  switch (chartId) {
    case 'categorias':
      return {
        id: 'pie-categorias',
        caption: 'Espécies avaliadas por categoria de risco',
        shortName: 'categorias de risco',
        headerLabel: 'Categoria',
        items: fromCategories(EVALUATED_CATEGORIES),
      };
    case 'grupos':
      return {
        id: 'pie-grupos',
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
      return {
        id: 'pie-ameaca',
        caption: `Espécies ameaçadas: ${groupLabel(key)}`,
        shortName: 'risco dentro de cada grupo',
        headerLabel: 'Categoria',
        items: fromCategories(rows),
      };
    }
    case 'biomas': {
      const biome = BIOMES[key];
      if (!biome) throw new Error(`Bioma desconhecido: ${key}`);
      return {
        id: 'pie-biomas',
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
