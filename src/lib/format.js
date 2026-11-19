const integer = new Intl.NumberFormat('pt-BR');
const percent = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** 15974 -> "15.974" */
export const formatInt = (value) => integer.format(value);

/** 79 -> "79,0%" */
export const formatPercent = (value) => `${percent.format(value)}%`;

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escapa texto para uso em HTML e em valores de atributo. */
export const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ESCAPES[char]);

/** Arredonda para 3 casas, suficiente para coordenadas do SVG. */
export const round3 = (value) => Math.round(value * 1000) / 1000;
