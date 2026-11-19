/**
 * Audita o build de produção com o Lighthouse (mobile e desktop) e falha se
 * algum dos quatro tópicos ficar abaixo de 100.
 *
 *   npm run build && npm run lighthouse
 *
 * Usa o Lighthouse via npx (não é dependência do projeto) e o Chrome do
 * sistema. Defina CHROME_PATH se o Chrome estiver em outro lugar.
 * Os relatórios completos ficam em .lighthouse/ (ignorado pelo Git).
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { preview } from 'vite';

const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo'];
const PORT = 4174;
const URL = `http://127.0.0.1:${PORT}/`;

/** Assíncrono de propósito: o servidor de preview roda neste processo e precisa responder enquanto o Lighthouse audita. */
const run = (command, args, env) =>
  new Promise((resolve) => {
    const child = spawn(command, args, { stdio: ['ignore', 'inherit', 'inherit'], env });
    child.on('exit', (code) => resolve(code ?? 1));
    child.on('error', () => resolve(1));
  });

const chromeCandidates = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);
const chrome = chromeCandidates.find((path) => existsSync(path));
if (!chrome) {
  console.error('Chrome não encontrado. Defina CHROME_PATH.');
  process.exit(2);
}
if (!existsSync('dist/index.html')) {
  console.error('Rode "npm run build" antes.');
  process.exit(2);
}

mkdirSync('.lighthouse', { recursive: true });
const server = await preview({ preview: { port: PORT, strictPort: true, host: '127.0.0.1', open: false } });

let failed = false;
try {
  for (const mode of ['mobile', 'desktop']) {
    const output = `.lighthouse/${mode}.json`;
    const args = [
      '--yes',
      'lighthouse',
      URL,
      '--quiet',
      '--output=json',
      `--output-path=${output}`,
      `--only-categories=${CATEGORIES.join(',')}`,
      '--chrome-flags=--headless=new --disable-gpu --no-sandbox',
    ];
    if (mode === 'desktop') args.push('--preset=desktop');
    const status = await run('npx', args, { ...process.env, CHROME_PATH: chrome });
    if (status !== 0) {
      console.error(`Lighthouse (${mode}) falhou com código ${status}`);
      failed = true;
      continue;
    }
    const report = JSON.parse(readFileSync(output, 'utf8'));
    const scores = CATEGORIES.map((id) => [id, Math.round((report.categories[id].score ?? 0) * 100)]);
    console.log(`\n${mode} (Lighthouse ${report.lighthouseVersion})`);
    for (const [id, score] of scores) console.log(`  ${id.padEnd(15)} ${score}`);
    const metrics = report.audits;
    console.log(
      `  LCP ${metrics['largest-contentful-paint'].displayValue} · CLS ${metrics['cumulative-layout-shift'].displayValue} · TBT ${metrics['total-blocking-time'].displayValue} · FCP ${metrics['first-contentful-paint'].displayValue}`,
    );
    if (scores.some(([, score]) => score < 100)) failed = true;
  }
} finally {
  server.httpServer.close();
}
process.exit(failed ? 1 : 0);
