import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { root } from './helpers.js';

const pub = (file) => readFileSync(join(root, 'public', file), 'utf8');

test('llms.txt: um H1, resumo, links absolutos e nenhum dado de contato', () => {
  const text = pub('llms.txt');
  assert.equal(text.match(/^# .+/gm)?.length, 1, 'exatamente um H1');
  assert.match(text, /^> .+/m, 'resumo em citação');
  const links = [...text.matchAll(/\[[^\]]+\]\((https:\/\/[^)]+)\)/g)].map((m) => m[1]);
  assert.ok(links.length >= 1, 'pelo menos um link');
  assert.ok(links.some((url) => url.startsWith('https://ohmyguigs.com/')));
  assert.doesNotMatch(text, /[\w.+-]+@[\w-]+\.[\w.]+/, 'sem e-mail');
  assert.doesNotMatch(text, /\(?\d{2}\)?\s?9?\d{4}-?\d{4}/, 'sem telefone');
});

test('llms.txt: os links de seção apontam para ids que existem no index.html', () => {
  const index = readFileSync(join(root, 'index.html'), 'utf8');
  for (const [, id] of pub('llms.txt').matchAll(/https:\/\/ohmyguigs\.com\/#([\w-]+)/g)) {
    assert.match(index, new RegExp(`id="${id}"`), `#${id}`);
  }
});

test('ARD: ard.json é o manifesto; ai-catalog.json (legado) tem o mesmo conteúdo nos dois caminhos', () => {
  const raw = pub('.well-known/ard.json');
  assert.equal(pub('.well-known/ai-catalog.json'), raw, '.well-known/ai-catalog.json');
  assert.equal(pub('ai-catalog.json'), raw, 'ai-catalog.json');
});

test('ARD: entradas com identificador URN, nome, tipo, url exclusiva e consultas representativas', () => {
  const { entries } = JSON.parse(pub('.well-known/ard.json'));
  assert.ok(Array.isArray(entries) && entries.length > 0);
  const identifiers = entries.map((entry) => entry.identifier);
  assert.equal(new Set(identifiers).size, identifiers.length, 'identificadores únicos');
  for (const entry of entries) {
    assert.match(entry.identifier, /^urn:air:ohmyguigs\.com(:[\w.-]+)+$/, entry.identifier);
    assert.ok(entry.displayName && entry.type, `${entry.identifier}: displayName e type`);
    assert.ok('url' in entry && !('data' in entry), `${entry.identifier}: exatamente um entre url e data`);
    assert.match(entry.url, /^https:\/\/ohmyguigs\.com\//, entry.identifier);
    assert.ok(entry.representativeQueries.length >= 2 && entry.representativeQueries.length <= 5, `${entry.identifier}: 2 a 5 consultas`);
  }
});
