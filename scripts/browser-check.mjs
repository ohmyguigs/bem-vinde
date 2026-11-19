/**
 * Verificação no navegador real (Chrome, via DevTools Protocol), sem dependências.
 *
 *   npm run build && npm run browser-check
 *
 * Sobe o preview do build, abre a página e confere o que testes estáticos não
 * alcançam: teclado nos gráficos, foco, filtros, preferências, movimento
 * reduzido, reflow, zoom de texto, espaçamento de texto e a página sem
 * JavaScript. Não substitui o teste com leitor de tela (veja REPORT.md).
 *
 * Defina CHROME_PATH se o Chrome estiver em outro lugar.
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { preview } from 'vite';

const PORT = 4176;
const DEBUG_PORT = 9334;
const URL = `http://127.0.0.1:${PORT}/`;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const chrome = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
]
  .filter(Boolean)
  .find((path) => existsSync(path));
if (!chrome) {
  console.error('Chrome não encontrado. Defina CHROME_PATH.');
  process.exit(2);
}
if (!existsSync('dist/index.html')) {
  console.error('Rode "npm run build" antes.');
  process.exit(2);
}

const profile = mkdtempSync(join(tmpdir(), 'ohmyguigs-chrome-'));
const server = await preview({ preview: { port: PORT, strictPort: true, host: '127.0.0.1', open: false } });
const browser = spawn(
  chrome,
  ['--headless=new', '--disable-gpu', '--no-first-run', '--hide-scrollbars', `--remote-debugging-port=${DEBUG_PORT}`, `--user-data-dir=${profile}`, 'about:blank'],
  { stdio: 'ignore' },
);

async function connect() {
  for (let i = 0; i < 80; i++) {
    try {
      const targets = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json`)).json();
      const page = targets.find((target) => target.type === 'page');
      if (page) return page.webSocketDebuggerUrl;
    } catch {
      /* Chrome ainda iniciando */
    }
    await sleep(250);
  }
  throw new Error('Não consegui conectar ao Chrome.');
}

const socket = new WebSocket(await connect());
await new Promise((resolve) => (socket.onopen = resolve));
let nextId = 0;
const pending = new Map();
const consoleProblems = [];
socket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    message.error ? reject(new Error(JSON.stringify(message.error))) : resolve(message.result);
  } else if (message.method === 'Runtime.exceptionThrown') {
    consoleProblems.push(`exceção: ${message.params.exceptionDetails.text}`);
  } else if (message.method === 'Log.entryAdded' && ['error', 'warning'].includes(message.params.entry.level)) {
    consoleProblems.push(`${message.params.entry.level}: ${message.params.entry.text} ${message.params.entry.url ?? ''}`);
  }
};
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
const evaluate = async (expression) => {
  const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
};
const json = (expression) => evaluate(`JSON.stringify(${expression})`).then(JSON.parse);
/** `modifiers`: 8 = Shift (por exemplo, Shift+Tab). */
const key = async (name, vk, modifiers = 0) => {
  await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: name, code: name, windowsVirtualKeyCode: vk, modifiers });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: name, code: name, windowsVirtualKeyCode: vk, modifiers });
  await sleep(120);
};
const visit = async ({ width = 1280, height = 900, mobile = false, media = [], scripts = true } = {}) => {
  await send('Emulation.setScriptExecutionDisabled', { value: !scripts });
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
  await send('Emulation.setEmulatedMedia', { features: media });
  await send('Page.navigate', { url: URL });
  await sleep(2000);
};
const active = () =>
  json(`(() => { const a = document.activeElement; return { cls: a.getAttribute('class'), label: a.getAttribute('aria-label'), tabindex: a.getAttribute('tabindex'), focusVisible: a.matches(':focus-visible'), tag: a.tagName.toLowerCase() }; })()`);

/** A página tem rolagem suave: espera a posição ficar estável antes de medir (até 6 s). */
const scrollIdle = async () => {
  let last = -1;
  for (let i = 0; i < 30; i++) {
    await sleep(200);
    const y = await evaluate(`window.scrollY`);
    if (y === last) return;
    last = y;
  }
};

const results = [];
const check = (name, ok, detail = '') => {
  results.push(ok);
  console.log(`${ok ? 'OK   ' : 'FALHA'} ${name}${detail ? `  →  ${detail}` : ''}`);
};

const PIE = (id) => `document.querySelector('[data-pie-id="${id}"]')`;

try {
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Log.enable');

  // ---------- Teclado e foco nos gráficos ----------
  await visit();
  check('componentes registrados', await evaluate(`['accessible-pie','chart-explorer','chart-settings'].every((n) => !!customElements.get(n))`));

  await evaluate(`document.querySelector('[data-setting="motion"]').focus()`);
  await key('Tab', 9);
  let now = await active();
  check('Tab entra no primeiro gráfico, na primeira fatia', now.cls === 'slice' && now.tabindex === '0', now.label);
  check('foco por teclado é :focus-visible', now.focusVisible);
  check('anel de foco visível', await evaluate(`!!${PIE('pie-categorias')}.querySelector('.rings[data-visible]')`));
  check('fatia minúscula mostra linha-guia', /^M 50 50 L /.test(await evaluate(`${PIE('pie-categorias')}.querySelector('.ring').getAttribute('d')`)));

  check('toda fatia é uma parada de Tab (tabindex 0)', await evaluate(`[...${PIE('pie-categorias')}.querySelectorAll('.slice')].every((s) => s.getAttribute('tabindex') === '0')`));
  check('legenda escondida do leitor de tela (aria-hidden)', await evaluate(`!!${PIE('pie-categorias')}.querySelector('.legend[aria-hidden="true"]')`));
  const legendFocus = () => json(`[...${PIE('pie-categorias')}.querySelectorAll('.legend-item')].map((li, i) => li.hasAttribute('data-focused') ? i : -1).filter((i) => i >= 0)`);
  check('foco na fatia 1 acende só a linha 1 da legenda', JSON.stringify(await legendFocus()) === '[0]', JSON.stringify(await legendFocus()));
  check('a linha focada da legenda tem contorno pontilhado visível', await evaluate(`(() => { const s = getComputedStyle(${PIE('pie-categorias')}.querySelector('.legend-item[data-focused]')); return s.outlineStyle === 'dashed' && parseFloat(s.outlineWidth) >= 3; })()`));
  check('o nome da fatia começa com o texto da linha da legenda', await evaluate(`(() => { const p = ${PIE('pie-categorias')}; const label = p.querySelectorAll('.slice')[0].getAttribute('aria-label'); const row = p.querySelectorAll('.legend-item')[0]; return label.startsWith(row.querySelector('.legend-label').textContent + ':'); })()`));

  await key('Tab', 9);
  now = await active();
  check('Tab vai para a fatia 2', /Fatia 2 de 10/.test(now.label ?? '') && now.cls === 'slice', now.label);
  check('foco na fatia 2 acende só a linha 2 da legenda', JSON.stringify(await legendFocus()) === '[1]', JSON.stringify(await legendFocus()));
  check('a fatia 2 "explode" como no hover', await evaluate(`getComputedStyle(${PIE('pie-categorias')}.querySelectorAll('.slice-group')[1]).translate`).then((t) => t !== 'none' && t !== '0px'));
  await key('Tab', 9, 8);
  now = await active();
  check('Shift+Tab volta para a fatia 1', /Fatia 1 de 10/.test(now.label ?? ''), now.label);

  await key('ArrowRight', 39);
  now = await active();
  check('seta → vai para a fatia 2', /Fatia 2 de 10/.test(now.label ?? ''), now.label);
  check('linha de detalhes acompanha a fatia', /Extinta na Natureza/.test(await evaluate(`${PIE('pie-categorias')}.querySelector('.pie-readout').textContent`)));
  await key('End', 35);
  check('End vai à última fatia', /Fatia 10 de 10/.test((await active()).label ?? ''));
  await key('ArrowRight', 39);
  check('→ na última volta à primeira', /Fatia 1 de 10/.test((await active()).label ?? ''));
  await key('ArrowLeft', 37);
  check('← na primeira vai à última', /Fatia 10 de 10/.test((await active()).label ?? ''));
  await key('Home', 36);
  await key('ArrowLeft', 37);
  await key('ArrowLeft', 37);
  await key('ArrowLeft', 37);
  check('anel segue o contorno de fatia grande', /A 42 42/.test(await evaluate(`${PIE('pie-categorias')}.querySelector('.ring').getAttribute('d')`)));
  await key('Escape', 27);
  check('Esc limpa seleção, anel e legenda', await evaluate(`!${PIE('pie-categorias')}.querySelector('.slice-group[data-active]') && !${PIE('pie-categorias')}.querySelector('.rings[data-visible]') && !${PIE('pie-categorias')}.querySelector('.legend-item[data-focused]')`));

  // Tab percorre as 10 fatias, na ordem, e o 11º Tab sai do gráfico.
  await key('Home', 36);
  const walked = [(await active()).label];
  for (let i = 0; i < 9; i++) {
    await key('Tab', 9);
    walked.push((await active()).label);
  }
  check('Tab percorre as 10 fatias em ordem', walked.every((label, i) => new RegExp(`Fatia ${i + 1} de 10\\.`).test(label ?? '')), walked.map((l) => (l ?? '').slice(-16)).join(' | '));
  check('na última fatia, só a linha 10 da legenda está focada', JSON.stringify(await legendFocus()) === '[9]', JSON.stringify(await legendFocus()));
  await key('Tab', 9);
  check('o próximo Tab sai do gráfico', (await active()).cls !== 'slice');
  check('ao sair, a legenda perde o destaque', (await legendFocus()).length === 0);
  await key('Tab', 9, 8);
  check('Shift+Tab volta para a última fatia', /Fatia 10 de 10/.test((await active()).label ?? ''));

  // ---------- Filtros ----------
  await evaluate(`document.querySelector('#filtro-grupo').scrollIntoView()`);
  check('select habilitado pelo componente', await evaluate(`document.querySelector('#filtro-grupo').disabled === false`));
  await evaluate(`document.querySelector('#filtro-grupo').focus()`);
  await evaluate(`(() => { const s = document.querySelector('#filtro-grupo'); s.value = 'AVES'; s.dispatchEvent(new Event('change', { bubbles: true })); })()`);
  await sleep(200);
  check('depois de trocar o filtro, o foco continua no select', await evaluate(`document.activeElement.id === 'filtro-grupo'`));
  await key('Tab', 9);
  check('o próximo Tab entra na primeira fatia do gráfico novo', (await active()).cls === 'slice' && /Fatia 1 de 4/.test((await active()).label ?? ''), (await active()).label);
  check('filtro troca o gráfico no lugar', /Aves/.test(await evaluate(`${PIE('pie-ameaca')}.querySelector('.pie-caption').textContent`)) && (await evaluate(`${PIE('pie-ameaca')}.querySelectorAll('.slice').length`)) === 4);
  const status = await evaluate(`document.querySelector('#filtro-grupo').closest('chart-explorer').querySelector('[data-status]').textContent`);
  check('resultado anunciado em role="status"', /Aves/.test(status) && /Maior/.test(status), status);
  check('novo gráfico já nasce navegável', (await evaluate(`${PIE('pie-ameaca')}.querySelector('.slice').getAttribute('tabindex')`)) === '0');
  await evaluate(`(() => { const s = document.querySelector('#filtro-bioma'); s.value = 'PANTANAL'; s.dispatchEvent(new Event('change', { bubbles: true })); })()`);
  await sleep(200);
  check('filtro de bioma funciona', /Pantanal/.test(await evaluate(`${PIE('pie-biomas')}.querySelector('.pie-caption').textContent`)));
  check('ids das fatias continuam estáveis depois do filtro', await evaluate(`!!document.getElementById('pie-biomas-fatia-lc') && !!document.getElementById('pie-biomas-fatia-cr')`));
  check('depois do filtro, todas as fatias novas são paradas de Tab', await evaluate(`[...${PIE('pie-biomas')}.querySelectorAll('.slice')].every((s) => s.getAttribute('tabindex') === '0')`));
  check('os ids da página continuam únicos depois do filtro', await evaluate(`(() => { const ids = [...document.querySelectorAll('[id]')].map((e) => e.id); return new Set(ids).size === ids.length; })()`));

  // ---------- Índice do atlas e "Voltar ao topo" ----------
  await evaluate(`document.querySelector('#indice-biomas').click()`);
  await sleep(300);
  check('índice do atlas leva ao gráfico de biomas', await evaluate(`location.hash === '#grafico-biomas'`));
  await key('Tab', 9);
  check('depois do link do índice, o Tab entra no conteúdo do gráfico (select de bioma)', await evaluate(`document.activeElement.id === 'filtro-bioma'`), await evaluate(`document.activeElement.id || document.activeElement.tagName`));
  await evaluate(`document.querySelector('#voltar-topo-atlas').click()`);
  // A rolagem é suave (scroll-behavior: smooth): espera terminar, até 5 s.
  for (let i = 0; i < 30 && (await evaluate(`window.scrollY`)) !== 0; i++) await sleep(200);
  check('"Voltar ao topo" volta ao início da página', await evaluate(`location.hash === '#inicio' && window.scrollY === 0`), await evaluate(`location.hash + ' ' + window.scrollY`));
  await key('Tab', 9);
  check('depois de "Voltar ao topo", o Tab cai no menu (marca do site)', await evaluate(`document.activeElement.classList.contains('brand')`), await evaluate(`document.activeElement.id || document.activeElement.className || document.activeElement.tagName`));

  // ---------- Mouse ----------
  await evaluate(`${PIE('pie-grupos')}.scrollIntoView({ block: 'center' })`);
  await scrollIdle();
  await sleep(300);
  const box = await json(`(() => { const r = ${PIE('pie-grupos')}.querySelectorAll('.slice')[6].getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: box.x, y: box.y });
  await sleep(300);
  check('hover mostra os detalhes da fatia', /Peixes continentais/.test(await evaluate(`${PIE('pie-grupos')}.querySelector('.pie-readout').textContent`)));
  const moved = await evaluate(`getComputedStyle(${PIE('pie-grupos')}.querySelectorAll('.slice-group')[6]).translate`);
  check('hover "explode" a fatia', moved !== 'none' && moved !== '0px', moved);
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 4, y: 4 });
  await sleep(300);
  check('ao sair, os detalhes voltam ao padrão', await evaluate(`${PIE('pie-grupos')}.querySelector('.pie-readout').textContent.startsWith('Passe o mouse')`));

  // ---------- Preferências ----------
  await evaluate(`document.querySelector('[data-setting="patterns"]').click()`);
  const off = await json(`({ cls: document.documentElement.classList.contains('no-patterns'), checked: document.querySelector('[data-setting="patterns"]').getAttribute('aria-checked'), fill: getComputedStyle(document.querySelector('.slice')).fill })`);
  check('desligar padrões: classe, aria-checked e preenchimento sólido', off.cls && off.checked === 'false' && /^rgb/.test(off.fill), off.fill);
  await evaluate(`document.querySelector('[data-setting="patterns"]').click()`);
  check('religar padrões', await evaluate(`getComputedStyle(document.querySelector('.slice')).fill.startsWith('url(')`));
  check('o nome do switch nunca muda', (await evaluate(`document.querySelector('[data-setting="patterns"] .switch-label').textContent`)) === 'Padrões de preenchimento nos gráficos');
  await evaluate(`localStorage.clear()`);

  // ---------- Movimento reduzido do sistema ----------
  await visit({ media: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  const reduced = await json(`({ disabled: document.querySelector('[data-setting="motion"]').getAttribute('aria-disabled'), checked: document.querySelector('[data-setting="motion"]').getAttribute('aria-checked'), orb: getComputedStyle(document.querySelector('.hero-orb')).animationName, vinyl: getComputedStyle(document.querySelector('.vinyl')).animationName, reveal: getComputedStyle(document.querySelector('.reveal')).animationName })`);
  check('movimento reduzido: switch indisponível e desligado', reduced.disabled === 'true' && reduced.checked === 'false');
  check('movimento reduzido: nenhuma animação roda', [reduced.orb, reduced.vinyl, reduced.reveal].every((name) => name === 'none'), JSON.stringify(reduced));

  // ---------- Reflow, zoom e espaçamento ----------
  for (const width of [320, 375]) {
    await visit({ width, height: 700, mobile: true });
    const metrics = await json(`({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth })`);
    check(`reflow a ${width} px, sem rolagem horizontal (SC 1.4.10)`, metrics.scroll <= metrics.client, JSON.stringify(metrics));
  }
  await visit();
  await evaluate(`document.documentElement.style.fontSize = '200%'`);
  await sleep(500);
  const zoom = await json(`({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth })`);
  check('texto a 200%, sem rolagem horizontal (SC 1.4.4)', zoom.scroll <= zoom.client, JSON.stringify(zoom));
  await visit();
  await evaluate(`(() => { const s = document.createElement('style'); s.textContent = '* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }'; document.head.append(s); })()`);
  await sleep(500);
  const spacing = await json(`({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth, clipped: [...document.querySelectorAll('p, li, dd, dt, h1, h2, h3, summary, label, button, a')].filter((e) => e.scrollWidth > e.clientWidth + 2 && getComputedStyle(e).overflow !== 'visible').length })`);
  check('espaçamento de texto ampliado, sem cortes (SC 1.4.12)', spacing.scroll <= spacing.client && spacing.clipped === 0, JSON.stringify(spacing));

  // ---------- Sem JavaScript ----------
  await visit({ scripts: false });
  const plain = await json(`({ selects: [...document.querySelectorAll('select')].filter((s) => s.offsetParent !== null).length, jsOnly: [...document.querySelectorAll('.js-only')].filter((e) => e.offsetParent !== null).length, tables: document.querySelectorAll('table').length, slices: document.querySelectorAll('.slice').length, kpi: document.querySelector('.kpi-value').textContent.slice(0, 6) })`);
  check('sem JavaScript: números, tabelas e gráficos presentes', plain.kpi === '15.974' && plain.tables === 21 && plain.slices > 0, JSON.stringify(plain));
  check('sem JavaScript: controles que dependem de script ficam ocultos', plain.selects === 0 && plain.jsOnly === 0);

  check('sem erros nem avisos no console', consoleProblems.length === 0, consoleProblems.join(' | '));
} finally {
  socket.close();
  browser.kill('SIGKILL');
  server.httpServer.close();
  rmSync(profile, { recursive: true, force: true });
}

const failed = results.filter((ok) => !ok).length;
console.log(`\n${results.length - failed}/${results.length} verificações passaram`);
process.exit(failed ? 1 : 0);
