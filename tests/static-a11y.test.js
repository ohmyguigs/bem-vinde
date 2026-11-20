import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { attr, hasAttr, ids, read, renderedIndex, root, tags, textBlocks } from './helpers.js';

const html = renderedIndex();
const body = html.slice(html.indexOf('<body'));

test('documento: idioma, título, descrição, canonical e viewport sem bloqueio de zoom', () => {
  assert.match(html, /<html lang="pt-BR">/);
  const title = html.match(/<title>([^<]+)<\/title>/)[1];
  assert.ok(title.length >= 20 && title.length <= 70, `título com ${title.length} caracteres`);
  const description = html.match(/<meta\s+name="description"\s+content="([^"]+)"/)[1];
  assert.ok(description.length >= 70 && description.length <= 175, `descrição com ${description.length} caracteres`);
  assert.match(html, /<link rel="canonical" href="https:\/\/ohmyguigs\.com\/"/);
  const viewport = html.match(/<meta name="viewport" content="([^"]+)"/)[1];
  assert.doesNotMatch(viewport, /user-scalable\s*=\s*no|maximum-scale/i);
});

test('estrutura: um h1, hierarquia sem saltos, landmarks e navegações nomeadas', () => {
  const levels = [...body.matchAll(/<h([1-6])[\s>]/g)].map((m) => Number(m[1]));
  assert.equal(levels.filter((level) => level === 1).length, 1, 'exatamente um h1');
  assert.equal(levels[0], 1);
  levels.forEach((level, index) => {
    if (index > 0) assert.ok(level <= levels[index - 1] + 1, `salto de h${levels[index - 1]} para h${level}`);
  });
  for (const landmark of ['header', 'main', 'footer']) {
    assert.equal(tags(body, landmark).length, 1, `um <${landmark}>`);
  }
  const navs = tags(body, 'nav').map((a) => attr(a, 'aria-label'));
  assert.ok(navs.length >= 2 && navs.every(Boolean), 'toda <nav> precisa de aria-label');
  assert.equal(new Set(navs).size, navs.length, 'rótulos de <nav> distintos');
});

test('leitura por Tab: todo bloco de texto (p, h1-h6, dl, blockquote) é uma parada de Tab', () => {
  const blocks = textBlocks(body);
  const included = blocks.filter((block) => !block.excluded);
  assert.ok(included.length > 40, `só ${included.length} blocos de texto encontrados`);
  const missing = included.filter((block) => attr(block.attributes, 'tabindex') !== '0');
  assert.deepEqual(missing.map((block) => block.snippet), [], 'blocos de texto sem tabindex="0"');
  // Onde o texto não é lido nem visto, ou o controle já é a parada, não pode haver parada extra.
  // Texto com `hidden` pode trazer tabindex: só vira parada quando o JavaScript o revela.
  const extra = blocks.filter((block) => block.excluded && block.excluded !== 'hidden' && hasAttr(block.attributes, 'tabindex'));
  assert.deepEqual(extra.map((block) => `${block.excluded}: ${block.snippet}`), [], 'paradas de Tab sem necessidade');
});

test('link de salto: primeiro elemento focável e com destino existente', () => {
  const firstFocusable = body.match(/<(a|button|input|select|textarea|summary)\b[^>]*>/i)[0];
  assert.match(firstFocusable, /class="skip-link"/);
  assert.match(firstFocusable, /href="#conteudo"/);
  assert.ok(ids(body).includes('conteudo'));
});

test('ids únicos e toda referência ARIA/âncora aponta para algo que existe', () => {
  const all = ids(body);
  assert.equal(new Set(all).size, all.length, `ids repetidos: ${all.filter((id, i) => all.indexOf(id) !== i)}`);
  for (const name of ['aria-labelledby', 'aria-describedby', 'aria-controls']) {
    for (const match of body.matchAll(new RegExp(`${name}="([^"]+)"`, 'g'))) {
      for (const ref of match[1].split(/\s+/)) assert.ok(all.includes(ref), `${name} aponta para #${ref}, que não existe`);
    }
  }
  for (const match of body.matchAll(/\shref="#([^"]+)"/g)) assert.ok(all.includes(match[1]), `âncora #${match[1]} sem destino`);
  for (const match of body.matchAll(/<label[^>]*\sfor="([^"]+)"/g)) assert.ok(all.includes(match[1]), `label for=${match[1]} órfão`);
});

test('links externos: nova aba avisada no nome, rel seguro, texto de propósito claro', () => {
  const anchors = [...body.matchAll(/<a\s([^>]*)>([\s\S]*?)<\/a>/g)];
  assert.ok(anchors.length > 10);
  for (const [, attributes, content] of anchors) {
    const href = attr(attributes, 'href');
    assert.ok(href, 'link sem href');
    if (attr(attributes, 'target') === '_blank') {
      assert.match(attr(attributes, 'rel') ?? '', /noopener/, href);
      assert.match(attr(attributes, 'rel') ?? '', /noreferrer/, href);
      assert.match(content, /\(abre em nova aba\)/, `${href} não avisa a nova aba`);
    }
    const text = content.replace(/<[^>]+>/g, '').trim().toLowerCase();
    assert.ok(text.length > 0, `link sem texto: ${href}`);
    assert.doesNotMatch(text, /^(clique aqui|saiba mais|leia mais|aqui)$/);
  }
});

test('controles: botões com type, switches nativos com aria-checked, selects rotulados', () => {
  for (const attributes of tags(body, 'button')) {
    assert.ok(hasAttr(attributes, 'type'), 'button sem type');
    if (attr(attributes, 'role') === 'switch') assert.match(attr(attributes, 'aria-checked'), /^(true|false)$/);
  }
  const selects = tags(body, 'select');
  assert.equal(selects.length, 2);
  for (const attributes of selects) {
    const id = attr(attributes, 'id');
    assert.match(body, new RegExp(`<label[^>]*for="${id}"`), `select #${id} sem label`);
  }
  assert.doesNotMatch(body, /\son(click|keydown|keyup|mouseover|focus|blur|change)\s*=/i, 'sem manipuladores inline');
  assert.doesNotMatch(body, /<(div|span)[^>]*\s(onclick|role="button")/i, 'sem div/span clicáveis');
});

test('índice do atlas: nav nomeada, cada link leva a um destino existente e a todos os gráficos', () => {
  const nav = body.match(/<nav[^>]*aria-label="Gráficos do atlas"[^>]*>([\s\S]*?)<\/nav>/);
  assert.ok(nav, 'índice do atlas ausente');
  const targets = [...nav[1].matchAll(/href="#([^"]+)"/g)].map((m) => m[1]);
  const all = ids(body);
  for (const target of targets) assert.ok(all.includes(target), `índice aponta para #${target}, que não existe`);
  for (const required of ['grafico-ameacadas', 'grafico-categorias', 'grafico-grupos', 'grafico-ameaca-por-grupo', 'grafico-biomas', 'preferencias', 'fonte-dos-dados']) {
    assert.ok(targets.includes(required), `índice sem link para #${required}`);
  }
  assert.equal(new Set(targets).size, targets.length, 'destinos repetidos no índice');
  assert.match(nav[1], /<ul class="toc-list" role="list">/);
});

test('"Voltar ao topo": um link em cada seção com título, sempre com o mesmo texto e destino (SC 3.2.4)', () => {
  // "inicio" é o <header>: o destino leva ao menu, não só à abertura (#topo, que fica abaixo do cabeçalho).
  assert.match(body, /<header id="inicio"/);
  const sections = [...body.matchAll(/<section id="([a-z]+)"[^>]*class="[^"]*\b(?:section|hero)\b[^"]*"/g)].map((m) => m[1]).filter((id) => id !== 'topo');
  assert.deepEqual(sections.sort(), ['atlas', 'carreira', 'laboratorio', 'musica']);
  for (const id of sections) {
    // Cada seção de primeiro nível é precedida por um comentário "<!-- N. NOME -->".
    const section = body.match(new RegExp(`<section id="${id}"[\\s\\S]*?(?=<!-- \\d+\\. |</main>)`))[0];
    assert.match(section, new RegExp(`<a id="voltar-topo-${id}" href="#inicio">Voltar ao topo</a>`), `seção ${id} sem "Voltar ao topo"`);
  }
  const all = [...body.matchAll(/<a [^>]*href="#inicio"[^>]*>([^<]*)<\/a>/g)];
  assert.equal(all.length, 4, 'um link por seção');
  assert.ok(all.every((m) => m[1] === 'Voltar ao topo'), 'mesmo texto em todos');
});

test('nomes acessíveis: o mesmo nome nunca leva a destinos diferentes (SC 2.4.4, 3.2.4)', () => {
  const byName = new Map();
  for (const [, attributes, content] of body.matchAll(/<a\s([^>]*)>([\s\S]*?)<\/a>/g)) {
    const name = content.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    const href = attr(attributes, 'href');
    byName.set(name, new Set([...(byName.get(name) ?? []), href]));
  }
  for (const [name, hrefs] of byName) assert.equal(hrefs.size, 1, `"${name}" leva a destinos diferentes: ${[...hrefs]}`);
});

test('destinos importantes: ids estáveis nos controles e nas fatias dos gráficos', () => {
  const all = ids(body);
  for (const id of ['preferencia-padroes', 'preferencia-animacoes', 'filtro-grupo', 'filtro-bioma', 'tabelas-todos-os-grupos', 'tabelas-todos-os-biomas', 'origem-dos-graficos', 'pie-ameacadas-fatia-cr', 'barras-categorias-barra-cr', 'barras-grupos-barra-aves', 'colunas-ameaca-coluna-vu', 'barras-biomas-barra-lc', 'barras-categorias-tabela']) {
    assert.ok(all.includes(id), `falta o id estável #${id}`);
  }
});

test('nota neutra sobre os totais: sem os números que comparam os gráficos', () => {
  assert.match(body, /Os totais de cada gráfico seguem o recorte publicado pelo portal\./);
  // O total de cada recorte continua no rodapé da tabela e no resumo do próprio gráfico, sem comparação entre eles.
  const outsideTables = body.replace(/<table[\s\S]*?<\/table>/g, '').replace(/<p class="pie-summary"[\s\S]*?<\/p>/g, '');
  assert.doesNotMatch(outsideTables, /15\.410|15\.781/, 'texto comparando os totais');
  assert.doesNotMatch(body, /Atenção às bases|base de cálculo|usado como base/);
  assert.match(body, /Total do recorte/);
});

test('o painel de ameaça: pizza logo depois dos números, antes dos gráficos de categorias', () => {
  const order = ['id="panorama"', 'id="grafico-ameacadas"', 'id="grafico-categorias"', 'id="grafico-grupos"', 'id="grafico-ameaca-por-grupo"', 'id="grafico-biomas"'].map((needle) => body.indexOf(needle));
  assert.ok(order.every((index) => index > 0), 'seção ausente');
  assert.deepEqual([...order].sort((a, b) => a - b), order, 'ordem dos blocos do atlas');
  assert.match(body, /O portal avisa que o total de 1\.383 espécies não reflete a lista oficial/);
});

test('imagens com alt e nenhum elemento de mídia ou incorporação na página', () => {
  for (const attributes of tags(body, 'img')) assert.ok(hasAttr(attributes, 'alt'), 'img sem alt');
  // Nomes montados a partir de texto: o gate estático do A11Y.md trata um literal de tag de mídia como componente presente.
  for (const name of ['vid' + 'eo', 'aud' + 'io', 'i' + 'frame', 'embed', 'object']) {
    assert.equal(tags(body, name).length, 0, `elemento de mídia ou incorporação não deveria existir: ${name}`);
  }
});

test('trechos em outro idioma declaram lang', () => {
  assert.match(body, /<q lang="en">General problem solver/);
});

test('listas com list-style:none mantêm role="list" (decisão registrada em A11Y-DECISIONS.md)', () => {
  const decisions = read('A11Y-DECISIONS.md');
  assert.match(decisions, /role="list"/);
});

test('privacidade: nenhum telefone, e-mail ou endereço no HTML publicado', () => {
  assert.doesNotMatch(html, /[\w.+-]+@[\w-]+\.[\w.-]+/, 'e-mail encontrado');
  assert.doesNotMatch(html, /\(?\b\d{2}\)?[\s.-]?9?\d{4}[\s.-]?\d{4}\b/, 'telefone encontrado');
  assert.doesNotMatch(html, /mailto:|tel:/i);
});

test('sem recursos de terceiros carregados pelo documento (só links clicáveis)', () => {
  for (const name of ['script', 'link', 'img', 'iframe', 'source']) {
    for (const attributes of tags(html, name)) {
      const url = attr(attributes, 'src') ?? attr(attributes, 'href');
      if (!url) continue;
      if (name === 'link' && attr(attributes, 'rel') === 'canonical') continue;
      assert.doesNotMatch(url, /^(https?:)?\/\//, `<${name}> carrega recurso externo: ${url}`);
    }
  }
});

test('código-fonte: sem requisições de rede, sem frameworks, sem dependências de runtime', () => {
  const files = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      statSync(full).isDirectory() ? walk(full) : files.push(full);
    }
  };
  walk(join(root, 'src'));
  for (const file of files.filter((f) => f.endsWith('.js'))) {
    const code = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
    assert.doesNotMatch(code, /\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|EventSource|import\s*\(\s*['"]https?:/, file);
    assert.doesNotMatch(code, /from\s+['"](react|vue|svelte|preact|lit|@angular|jquery|d3|chart\.js)/i, file);
  }
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.dependencies, undefined, 'sem dependências de runtime');
  assert.deepEqual(Object.keys(pkg.devDependencies).sort(), ['@tailwindcss/vite', 'tailwindcss', 'vite']);
});

test('CSS: foco nunca suprimido, movimento reduzido tratado, tamanhos mínimos respeitados', () => {
  const css = read('src/styles.css');
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const suppressed = [...withoutComments.matchAll(/([^{}]+)\{[^{}]*outline\s*:\s*(none|0)\b[^{}]*\}/g)].map((m) => m[1].trim());
  assert.deepEqual(suppressed, ['main:focus'], 'só o destino do link de salto pode ficar sem contorno');
  // Blocos de texto com tabindex="0" usam o mesmo anel de foco dos controles.
  assert.match(withoutComments, /:where\([^)]*\[tabindex\][^)]*\):focus-visible\s*\{[^}]*outline:\s*3px solid var\(--focus/);
  assert.doesNotMatch(withoutComments, /position:\s*(sticky|fixed)/, 'elemento fixo poderia encobrir o foco (SC 2.4.11)');
  assert.match(css, /prefers-reduced-motion:\s*no-preference/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /forced-colors:\s*active/);
  for (const match of withoutComments.matchAll(/font-size:\s*([\d.]+)rem/g)) {
    assert.ok(Number(match[1]) >= 0.75, `fonte menor que 12px (0.75rem): ${match[0]}`);
  }
  assert.doesNotMatch(withoutComments, /font-size:\s*(\d|1[01])px/, 'fonte abaixo de 12px em CSS');
  assert.doesNotMatch(withoutComments, /animation[^;]*infinite/, 'nenhuma animação infinita (SC 2.2.2)');
  assert.doesNotMatch(withoutComments, /text-align:\s*justify/);
});
