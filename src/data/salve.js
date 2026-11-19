/**
 * Snapshot estático do SALVE (Sistema de Avaliação do Risco de Extinção da
 * Biodiversidade), do ICMBio.
 *
 * Os números abaixo foram copiados, sem alteração, das respostas públicas que
 * alimentam os gráficos do portal em 19 de novembro de 2026. Nada aqui é
 * consultado em tempo de execução: o site não faz requisições a terceiros.
 *
 * Para atualizar: repita a coleta nos endpoints listados em `source.endpoints`,
 * substitua os valores e a data, e rode `npm test` (os testes recalculam os
 * percentuais para detectar erros de transcrição).
 */

export const SOURCE = Object.freeze({
  name: 'SALVE – Sistema de Avaliação do Risco de Extinção da Biodiversidade',
  institution: 'ICMBio – Instituto Chico Mendes de Conservação da Biodiversidade',
  url: 'https://salve.icmbio.gov.br/',
  collectedAt: '2026-11-19',
  collectedAtLabel: '19 de novembro de 2026',
  citation:
    'ICMBio, 2026. Sistema de Avaliação do Risco de Extinção da Biodiversidade – SALVE. Disponível em: https://salve.icmbio.gov.br/. Acesso em: 19 de nov. de 2026.',
  endpoints: Object.freeze([
    { id: 'totalNumbers', url: 'https://salve.icmbio.gov.br/salve-api/public/totalNumbers' },
    { id: 'graphEvaluatedCategories', url: 'https://salve.icmbio.gov.br/salve-api/public/graphEvaluatedCategories' },
    { id: 'graphEvaluatedGroups', url: 'https://salve.icmbio.gov.br/salve-api/public/graphEvaluatedGroups' },
    { id: 'graphThreatenedGroupsCategories', url: 'https://salve.icmbio.gov.br/salve-api/public/graphThreatenedGroupsCategories' },
    { id: 'graphEvaluatedCategoriesBiomes', url: 'https://salve.icmbio.gov.br/salve-api/public/graphEvaluatedCategoriesBiomes' },
  ]),
});

/** Painel de números do portal. O portal avisa: o total em categoria de ameaça não reflete a lista oficial. */
export const TOTALS = Object.freeze({
  evaluated: 15974,
  publishedSheets: 15237,
  threatened: 1383,
  experts: 2003,
  threatenedNote: 'Este número não reflete a lista oficial.',
});

/** Categorias de risco (padrão da lista vermelha). Rótulos em português usados pelo portal. */
export const CATEGORIES = Object.freeze({
  EX: { code: 'EX', name: 'Extinta' },
  EW: { code: 'EW', name: 'Extinta na Natureza' },
  RE: { code: 'RE', name: 'Regionalmente Extinta' },
  CR: { code: 'CR', name: 'Criticamente em Perigo' },
  EN: { code: 'EN', name: 'Em Perigo' },
  VU: { code: 'VU', name: 'Vulnerável' },
  NT: { code: 'NT', name: 'Quase Ameaçada' },
  LC: { code: 'LC', name: 'Menos Preocupante' },
  DD: { code: 'DD', name: 'Dados Insuficientes' },
  NA: { code: 'NA', name: 'Não Aplicável' },
});

/** Espécies avaliadas por categoria (graphEvaluatedCategories). */
export const EVALUATED_CATEGORIES = Object.freeze([
  { code: 'EX', total: 6, percent: 0.0 },
  { code: 'EW', total: 1, percent: 0.0 },
  { code: 'RE', total: 3, percent: 0.0 },
  { code: 'CR', total: 361, percent: 2.3 },
  { code: 'EN', total: 510, percent: 3.3 },
  { code: 'VU', total: 512, percent: 3.3 },
  { code: 'NT', total: 443, percent: 2.9 },
  { code: 'LC', total: 12167, percent: 79.0 },
  { code: 'DD', total: 1192, percent: 7.7 },
  { code: 'NA', total: 215, percent: 1.4 },
]);

/** Espécies avaliadas por grupo (graphEvaluatedGroups). */
export const EVALUATED_GROUPS = Object.freeze([
  { code: 'ANFIBIOS', label: 'Anfíbios', total: 1298, percent: 8.2 },
  { code: 'AVES', label: 'Aves', total: 2069, percent: 13.1 },
  { code: 'INVERTEBRADOS_AGUA_DOCE', label: 'Invertebrados de água doce', total: 1614, percent: 10.2 },
  { code: 'INVERTEBRADOS_MARINHOS', label: 'Invertebrados marinhos', total: 1027, percent: 6.5 },
  { code: 'INVERTEBRADOS_TERRESTRES', label: 'Invertebrados terrestres', total: 2815, percent: 17.8 },
  { code: 'MAMIFEROS', label: 'Mamíferos', total: 826, percent: 5.2 },
  { code: 'PEIXES_CONTINENTAIS', label: 'Peixes continentais', total: 3763, percent: 23.8 },
  { code: 'PEIXES_MARINHOS', label: 'Peixes marinhos (ósseos)', total: 1322, percent: 8.4 },
  { code: 'REPTEIS', label: 'Répteis', total: 856, percent: 5.4 },
  { code: 'TUBARAO_RAIA', label: 'Tubarões e raias', total: 191, percent: 1.2 },
]);

/** Espécies ameaçadas por grupo e categoria (graphThreatenedGroupsCategories). */
export const THREATENED_BY_GROUP = Object.freeze({
  ANFIBIOS: [
    { code: 'CR', total: 74, percent: 46.5 },
    { code: 'EN', total: 54, percent: 34.0 },
    { code: 'VU', total: 31, percent: 19.5 },
  ],
  AVES: [
    { code: 'CR', total: 32, percent: 13.2 },
    { code: 'EN', total: 78, percent: 32.1 },
    { code: 'EW', total: 1, percent: 0.4 },
    { code: 'VU', total: 132, percent: 54.3 },
  ],
  INVERTEBRADOS_AGUA_DOCE: [
    { code: 'CR', total: 26, percent: 28.9 },
    { code: 'EN', total: 38, percent: 42.2 },
    { code: 'VU', total: 26, percent: 28.9 },
  ],
  INVERTEBRADOS_MARINHOS: [
    { code: 'CR', total: 4, percent: 17.4 },
    { code: 'EN', total: 7, percent: 30.4 },
    { code: 'VU', total: 12, percent: 52.2 },
  ],
  INVERTEBRADOS_TERRESTRES: [
    { code: 'CR', total: 83, percent: 31.1 },
    { code: 'EN', total: 94, percent: 35.2 },
    { code: 'VU', total: 90, percent: 33.7 },
  ],
  MAMIFEROS: [
    { code: 'CR', total: 11, percent: 10.6 },
    { code: 'EN', total: 41, percent: 39.4 },
    { code: 'VU', total: 52, percent: 50.0 },
  ],
  PEIXES_CONTINENTAIS: [
    { code: 'CR', total: 83, percent: 32.2 },
    { code: 'EN', total: 113, percent: 43.8 },
    { code: 'VU', total: 62, percent: 24.0 },
  ],
  PEIXES_MARINHOS: [
    { code: 'CR', total: 5, percent: 9.4 },
    { code: 'EN', total: 13, percent: 24.5 },
    { code: 'VU', total: 35, percent: 66.0 },
  ],
  REPTEIS: [
    { code: 'CR', total: 10, percent: 8.1 },
    { code: 'EN', total: 62, percent: 50.4 },
    { code: 'VU', total: 51, percent: 41.5 },
  ],
  TUBARAO_RAIA: [
    { code: 'CR', total: 33, percent: 51.6 },
    { code: 'EN', total: 10, percent: 15.6 },
    { code: 'VU', total: 21, percent: 32.8 },
  ],
});

/**
 * Categorias por bioma / sistema (graphEvaluatedCategoriesBiomes).
 * O grupo "Desconhecido" existe na resposta do portal (LC 4, DD 17) e fica
 * documentado aqui, mas não entra na vitrine por não representar um bioma.
 */
export const BIOMES = Object.freeze({
  MATA_ATLANTICA: {
    label: 'Mata Atlântica',
    categories: [
      { code: 'EX', total: 6, percent: 0.1 },
      { code: 'EW', total: 1, percent: 0.0 },
      { code: 'RE', total: 2, percent: 0.0 },
      { code: 'CR', total: 195, percent: 3.0 },
      { code: 'EN', total: 256, percent: 4.0 },
      { code: 'VU', total: 216, percent: 3.4 },
      { code: 'NT', total: 251, percent: 3.9 },
      { code: 'LC', total: 5009, percent: 78.1 },
      { code: 'DD', total: 412, percent: 6.4 },
      { code: 'NA', total: 62, percent: 1.0 },
    ],
  },
  AMAZONIA: {
    label: 'Amazônia',
    categories: [
      { code: 'RE', total: 1, percent: 0.0 },
      { code: 'CR', total: 22, percent: 0.3 },
      { code: 'EN', total: 69, percent: 1.0 },
      { code: 'VU', total: 136, percent: 2.0 },
      { code: 'NT', total: 99, percent: 1.4 },
      { code: 'LC', total: 6303, percent: 90.6 },
      { code: 'DD', total: 275, percent: 4.0 },
      { code: 'NA', total: 50, percent: 0.7 },
    ],
  },
  CERRADO: {
    label: 'Cerrado',
    categories: [
      { code: 'CR', total: 62, percent: 1.2 },
      { code: 'EN', total: 143, percent: 2.7 },
      { code: 'VU', total: 179, percent: 3.4 },
      { code: 'NT', total: 125, percent: 2.4 },
      { code: 'LC', total: 4473, percent: 85.7 },
      { code: 'DD', total: 222, percent: 4.3 },
      { code: 'NA', total: 15, percent: 0.3 },
    ],
  },
  CAATINGA: {
    label: 'Caatinga',
    categories: [
      { code: 'CR', total: 36, percent: 1.6 },
      { code: 'EN', total: 106, percent: 4.8 },
      { code: 'VU', total: 101, percent: 4.6 },
      { code: 'NT', total: 37, percent: 1.7 },
      { code: 'LC', total: 1821, percent: 83.2 },
      { code: 'DD', total: 74, percent: 3.4 },
      { code: 'NA', total: 14, percent: 0.6 },
    ],
  },
  PANTANAL: {
    label: 'Pantanal',
    categories: [
      { code: 'RE', total: 1, percent: 0.1 },
      { code: 'CR', total: 1, percent: 0.1 },
      { code: 'EN', total: 13, percent: 0.9 },
      { code: 'VU', total: 33, percent: 2.3 },
      { code: 'NT', total: 17, percent: 1.2 },
      { code: 'LC', total: 1355, percent: 92.7 },
      { code: 'DD', total: 25, percent: 1.7 },
      { code: 'NA', total: 17, percent: 1.2 },
    ],
  },
  PAMPA: {
    label: 'Pampa',
    categories: [
      { code: 'RE', total: 2, percent: 0.1 },
      { code: 'CR', total: 16, percent: 0.9 },
      { code: 'EN', total: 46, percent: 2.7 },
      { code: 'VU', total: 47, percent: 2.7 },
      { code: 'NT', total: 42, percent: 2.4 },
      { code: 'LC', total: 1469, percent: 85.3 },
      { code: 'DD', total: 41, percent: 2.4 },
      { code: 'NA', total: 59, percent: 3.4 },
    ],
  },
  SISTEMA_COSTEIRO_MARINHO: {
    label: 'Sistema Costeiro-Marinho',
    categories: [
      { code: 'CR', total: 53, percent: 1.8 },
      { code: 'EN', total: 52, percent: 1.8 },
      { code: 'VU', total: 91, percent: 3.1 },
      { code: 'NT', total: 31, percent: 1.1 },
      { code: 'LC', total: 2325, percent: 79.8 },
      { code: 'DD', total: 280, percent: 9.6 },
      { code: 'NA', total: 83, percent: 2.8 },
    ],
  },
});

/** Resposta "Desconhecido" do portal, preservada apenas para registro. */
export const BIOMES_UNKNOWN = Object.freeze({
  label: 'Desconhecido',
  categories: [
    { code: 'LC', total: 4, percent: 19.0 },
    { code: 'DD', total: 17, percent: 81.0 },
  ],
});
