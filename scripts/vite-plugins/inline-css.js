/**
 * Coloca o CSS gerado dentro do HTML (<style> no <head>) e remove o arquivo .css.
 * Assim a primeira pintura não espera uma requisição extra de CSS.
 * Só atua no build; o servidor de desenvolvimento continua usando o <link>.
 */
export function inlineCssPlugin() {
  return {
    name: 'inline-css',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const html = Object.values(bundle).find((file) => file.type === 'asset' && file.fileName.endsWith('.html'));
      if (!html) return;

      let source = String(html.source);
      for (const [name, file] of Object.entries(bundle)) {
        if (file.type !== 'asset' || !name.endsWith('.css')) continue;
        const link = new RegExp(`<link\\b[^>]*rel="stylesheet"[^>]*href="[^"]*${name.split('/').pop().replace(/\./g, '\\.')}"[^>]*>`);
        if (!link.test(source)) continue;
        const css = String(file.source);
        if (/<\/style/i.test(css)) this.error(`O CSS ${name} contém "</style" e não pode ser inlinado.`);
        // Função no replace: o CSS pode conter "$&" ou "$1", que seriam interpretados.
        source = source.replace(link, () => `<style>${css.trim()}</style>`);
        delete bundle[name];
      }
      html.source = source;
    },
  };
}
