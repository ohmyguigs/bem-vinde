import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { replacePlaceholders } from '../src/lib/prerender.js';

export const root = fileURLToPath(new URL('..', import.meta.url));
export const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

/** index.html com os marcadores já substituídos (o mesmo HTML que o build produz, antes do Vite processar os assets). */
export const renderedIndex = () => replacePlaceholders(read('index.html'));

/** Todas as tags de abertura com o nome dado, devolvendo o texto dos atributos. */
export function tags(html, name) {
  const re = new RegExp(`<${name}(\\s[^>]*)?>`, 'gi');
  return [...html.matchAll(re)].map((match) => match[1] ?? '');
}

export function attr(attributes, name) {
  const match = attributes.match(new RegExp(`(?:^|\\s)${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i'));
  return match ? (match[2] ?? match[3]) : undefined;
}

export function hasAttr(attributes, name) {
  return new RegExp(`(?:^|\\s)${name}(\\s|=|$)`, 'i').test(attributes);
}

export function ids(html) {
  return [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
}

/** Luminância relativa e razão de contraste da WCAG 2.x. */
export function luminance(hex) {
  const value = hex.replace('#', '');
  const full = value.length === 3 ? [...value].map((c) => c + c).join('') : value;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
