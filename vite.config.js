import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { inlineCssPlugin } from './scripts/vite-plugins/inline-css.js';
import { minifyHtmlPlugin } from './scripts/vite-plugins/minify-html.js';

const prerenderFile = fileURLToPath(new URL('./src/lib/prerender.js', import.meta.url));

/**
 * Troca os marcadores <!--@...--> do index.html por HTML pré-renderizado
 * (gráficos, tabelas, KPIs). Veja src/lib/prerender.js.
 */
function prerenderCharts() {
  return {
    name: 'prerender-charts',
    transformIndexHtml: {
      order: 'pre',
      async handler(html, context) {
        const module = context.server
          ? await context.server.ssrLoadModule('/src/lib/prerender.js')
          : await import(pathToFileURL(prerenderFile).href);
        return module.replacePlaceholders(html);
      },
    },
    handleHotUpdate({ file, server }) {
      if (/[\\/]src[\\/](lib|data)[\\/]/.test(file)) {
        server.ws.send({ type: 'full-reload' });
      }
    },
  };
}

export default defineConfig({
  // Caminhos relativos: o build funciona no domínio próprio e em qualquer subcaminho.
  base: './',
  // Ordem importa: primeiro o CSS entra no HTML, depois o HTML inteiro é minificado.
  plugins: [tailwindcss(), prerenderCharts(), inlineCssPlugin(), minifyHtmlPlugin()],
  build: {
    target: 'es2022',
    sourcemap: false,
    modulePreload: { polyfill: false },
  },
});
