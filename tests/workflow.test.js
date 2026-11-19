import { test } from 'node:test';
import assert from 'node:assert/strict';
import { read } from './helpers.js';

const workflow = read('.github/workflows/deploy.yml');

test('deploy: dispara em push na main e manualmente', () => {
  assert.match(workflow, /\non:(?:\s*#[^\n]*)*\s*\n\s*push:\s*\n\s*branches:\s*\[main\]/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.doesNotMatch(workflow, /gh-pages|master/);
});

test('deploy: permissões mínimas do GitHub Pages', () => {
  assert.match(workflow, /permissions:\s*\n\s*contents:\s*read\s*\n\s*pages:\s*write\s*\n\s*id-token:\s*write/);
});

test('deploy: build reprodutível com npm ci, verificações e artefato dist/', () => {
  assert.match(workflow, /uses:\s*actions\/setup-node@/);
  assert.match(workflow, /node-version-file:\s*\.nvmrc/);
  assert.match(workflow, /run:\s*npm ci/);
  assert.match(workflow, /run:\s*npm run check/);
  assert.match(workflow, /uses:\s*actions\/upload-pages-artifact@[^\n]*\n\s*with:\s*\n\s*path:\s*dist/);
  assert.match(workflow, /uses:\s*actions\/deploy-pages@/);
  assert.match(workflow, /needs:\s*build/);
  assert.match(workflow, /name:\s*github-pages/);
});

test('deploy: não sobra nada do Astro', () => {
  assert.doesNotMatch(workflow, /astro|yarn/i);
});

test('domínio próprio preservado em public/CNAME', () => {
  assert.equal(read('public/CNAME').trim(), 'ohmyguigs.com');
});

test('.nvmrc e engines concordam com a versão de Node usada pelo CI', () => {
  assert.match(read('.nvmrc'), /^22\b/);
  assert.match(JSON.parse(read('package.json')).engines.node, /22/);
});
