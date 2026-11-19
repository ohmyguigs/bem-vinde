import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';
import { attr, root, tags } from '../helpers.js';

const dist = join(root, 'dist');
const html = readFileSync(join(dist, 'index.html'), 'utf8');
const assets = readdirSync(join(dist, 'assets'));
const js = assets.filter((name) => name.endsWith('.js'));
// O CSS é inlinado no HTML no build (veja scripts/vite-plugins/inline-css.js).
const inlineCss = [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((match) => match[1]).join('');
const gz = (file) => gzipSync(readFileSync(join(dist, 'assets', file))).length;

test('dist contém HTML com CSS inline, JS local, CNAME, robots e sitemap', () => {
  for (const file of ['index.html', 'CNAME', 'robots.txt', 'sitemap.xml', 'favicon.svg', 'favicon.ico', 'llms.txt', 'ai-catalog.json', '.well-known/ard.json', '.well-known/ai-catalog.json']) {
    assert.ok(existsSync(join(dist, file)), `falta dist/${file}`);
  }
  assert.equal(readFileSync(join(dist, 'CNAME'), 'utf8').trim(), 'ohmyguigs.com');
  assert.equal(js.length, 1, 'um único arquivo JS');
  assert.equal(assets.filter((name) => name.endsWith('.css')).length, 0, 'o CSS vai dentro do HTML, sem arquivo .css');
  assert.doesNotMatch(html, /<link[^>]*rel="stylesheet"/, 'nenhum CSS bloqueando a renderização');
  assert.match(inlineCss, /\.theme-ink/, 'o CSS do site está inline');
});

test('nenhum marcador de pré-renderização sobrou e o conteúdo está no HTML inicial', () => {
  assert.doesNotMatch(html, /<!--@/);
  assert.equal((html.match(/<accessible-pie /g) ?? []).length, 4);
  assert.match(html, /15\.974/);
  assert.match(html, /Peixes continentais/);
  assert.match(html, /Mata Atlântica/);
  assert.equal((html.match(/<table class="data-table"/g) ?? []).length, 4 + 10 + 7, 'tabelas dos 4 gráficos + todos os grupos + todos os biomas');
});

test('o documento não carrega nada de terceiros', () => {
  for (const name of ['script', 'link', 'img', 'iframe']) {
    for (const attributes of tags(html, name)) {
      const url = attr(attributes, 'src') ?? attr(attributes, 'href');
      if (!url || attr(attributes, 'rel') === 'canonical') continue;
      assert.doesNotMatch(url, /^(https?:)?\/\//, `${name} externo: ${url}`);
    }
  }
  const sources = [...js.map((file) => [file, readFileSync(join(dist, 'assets', file), 'utf8')]), ['CSS inline', inlineCss]];
  for (const [file, code] of sources) {
    // Comentários de licença (ex.: o do Tailwind cita tailwindcss.com) não são requisições.
    const content = code.replace(/\/\*[\s\S]*?\*\//g, '');
    assert.doesNotMatch(content, /https?:\/\/(?!www\.w3\.org|ohmyguigs\.com|salve\.icmbio\.gov\.br)[^"'`\s)]+/, `URL inesperada em ${file}`);
  }
});

test('JavaScript publicado: sem framework e sem chamadas de rede', () => {
  const code = readFileSync(join(dist, 'assets', js[0]), 'utf8');
  for (const forbidden of [/react/i, /\bvue\b/i, /angular/i, /svelte/i, /astro/i, /jquery/i, /\bfetch\(/, /XMLHttpRequest/, /sendBeacon/]) {
    assert.doesNotMatch(code, forbidden, String(forbidden));
  }
  assert.match(code, /customElements\.define|customElements/);
});

test('orçamentos de peso (gzip): JS ≤ 12 KB, CSS ≤ 15 KB, HTML (com o CSS inline) ≤ 30 KB', () => {
  assert.ok(gz(js[0]) <= 12 * 1024, `JS ${gz(js[0])} bytes`);
  assert.ok(gzipSync(Buffer.from(inlineCss)).length <= 15 * 1024, 'CSS');
  assert.ok(gzipSync(Buffer.from(html)).length <= 30 * 1024, 'HTML');
});

test('HTML minificado: sem comentários, JSON-LD válido e ids únicos', () => {
  assert.doesNotMatch(html.replace(/<(script|style)[\s\S]*?<\/\1>/g, ''), /<!--/);
  const ld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.equal(JSON.parse(ld[1])['@type'], 'Person');
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length, 'ids repetidos');
});

test('assets do build usam caminhos relativos (funciona em qualquer base)', () => {
  assert.match(html, /<script type="module"[^>]*src="\.\/assets\//);
});

test('sitemap e robots apontam para o domínio canônico', () => {
  assert.match(readFileSync(join(dist, 'sitemap.xml'), 'utf8'), /<loc>https:\/\/ohmyguigs\.com\/<\/loc>/);
  assert.match(readFileSync(join(dist, 'robots.txt'), 'utf8'), /Sitemap: https:\/\/ohmyguigs\.com\/sitemap\.xml/);
  assert.ok(statSync(join(dist, 'index.html')).size > 10000);
});
