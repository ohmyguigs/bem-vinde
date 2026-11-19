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

const VOID_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const TEXT_BLOCKS = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'dl', 'blockquote']);

/**
 * Blocos de texto (p, h1-h6, dl, blockquote) do HTML e se cada um deve ser uma parada de Tab.
 *
 * Fora da regra (`excluded` com o motivo):
 * - dentro de aria-hidden, hidden, .sr-only ou role="status" (não é lido nem visto);
 * - cujo único conteúdo é um link ou botão (o controle já é a parada de Tab);
 * - dentro de blockquote, que já é a parada de Tab do trecho inteiro.
 */
export function textBlocks(html) {
  const source = html.replace(/<!--[\s\S]*?-->/g, '');
  const stack = [];
  const blocks = [];
  for (const match of source.matchAll(/<(\/?)([a-zA-Z][\w-]*)([^>]*)>/g)) {
    const [whole, closing, rawName, attributes] = match;
    const name = rawName.toLowerCase();
    if (VOID_TAGS.has(name) || whole.endsWith('/>')) continue;
    if (!closing) {
      const hiddenBy =
        attr(attributes, 'aria-hidden') === 'true' ? 'aria-hidden'
        : hasAttr(attributes, 'hidden') ? 'hidden'
        : /(^|\s)sr-only(\s|$)/.test(attr(attributes, 'class') ?? '') ? 'sr-only'
        : attr(attributes, 'role') === 'status' ? 'role=status'
        : null;
      stack.push({ name, attributes, start: match.index + whole.length, hiddenBy, open: match.index });
      continue;
    }
    const index = stack.map((entry) => entry.name).lastIndexOf(name);
    if (index < 0) continue;
    const [entry] = stack.splice(index);
    if (!TEXT_BLOCKS.has(name)) continue;
    const inner = source.slice(entry.start, match.index).trim();
    const ancestors = stack.slice(0, index);
    let excluded = ancestors.find((a) => a.hiddenBy)?.hiddenBy ?? entry.hiddenBy ?? null;
    if (!excluded && ancestors.some((a) => a.name === 'blockquote')) excluded = 'dentro de blockquote';
    if (!excluded && ancestors.some((a) => ['a', 'button', 'summary', 'label'].includes(a.name))) excluded = 'dentro de controle';
    if (!excluded) {
      const only = inner.match(/^<(a|button)\b[\s\S]*<\/\1>$/);
      const controls = inner.match(/<(a|button)\b/g) ?? [];
      if (only && controls.length === 1) excluded = 'só um controle';
    }
    blocks.push({
      tag: name,
      attributes: entry.attributes,
      excluded,
      order: entry.open,
      snippet: `<${name}${entry.attributes}> ${inner.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').slice(0, 60)}`,
    });
  }
  return blocks.sort((a, b) => a.order - b.order);
}
