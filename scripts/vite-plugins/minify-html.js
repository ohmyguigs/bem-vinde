/**
 * Minifica o HTML do build sem alterar o que aparece na tela.
 *
 * - Remove comentários HTML.
 * - Preserva o conteúdo de <script>, <style>, <pre> e <textarea>
 *   (o JSON-LD é só recompactado, com JSON.parse/stringify).
 * - Reduz qualquer espaço em branco a um único espaço.
 * - Remove o espaço entre duas tags só quando uma delas é de bloco ou
 *   estrutural (p, li, section…). Entre elementos em linha (<em>, <a>) o
 *   espaço é mantido, porque ele aparece no texto renderizado.
 */

const PROTECTED = /<(script|style|pre|textarea)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;

const BLOCK_TAGS = new Set(
  (
    'html head body meta link title script style noscript base ' +
    'header main footer section nav aside article div p ul ol li dl dt dd ' +
    'h1 h2 h3 h4 h5 h6 figure figcaption blockquote details summary ' +
    'table caption thead tbody tfoot tr th td form fieldset legend select option optgroup hr br'
  ).split(' '),
);

const isBlockTag = (tag) => {
  const name = tag.replace(/^<\/?/, '').split(/[\s/>]/)[0].toLowerCase();
  // Marcadores dos blocos protegidos (x-script-0, x-pre-1…) valem como a tag original.
  return BLOCK_TAGS.has(name.replace(/^x-([a-z]+)-\d+$/, '$1'));
};

function minifyProtected(block) {
  if (/^<script\b[^>]*type=["']application\/ld\+json["']/i.test(block)) {
    return block.replace(/(<script\b[^>]*>)([\s\S]*?)(<\/script\s*>)/i, (_, open, json, close) => {
      try {
        return open + JSON.stringify(JSON.parse(json)) + close;
      } catch {
        return open + json + close;
      }
    });
  }
  return block;
}

function minifyMarkup(markup) {
  return markup
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s+/g, ' ')
    .replace(/(<\/?[^<>]+>) (?=<)/g, (match, before, offset, whole) => {
      const next = whole.slice(offset + match.length).match(/^<\/?[^<>\s/]+/);
      return isBlockTag(before) || (next && isBlockTag(next[0])) ? before : match;
    });
}

export function minifyHtml(html) {
  // Troca os blocos protegidos por marcadores, minifica o resto e devolve os blocos no lugar.
  const blocks = [];
  const masked = html.replace(PROTECTED, (block, tag) => {
    blocks.push(minifyProtected(block));
    const name = `x-${tag.toLowerCase()}-${blocks.length - 1}`;
    return `<${name}></${name}>`;
  });
  return minifyMarkup(masked)
    .replace(/<x-[a-z]+-(\d+)><\/x-[a-z]+-\1>/g, (_, index) => blocks[Number(index)])
    .trim();
}

/** Plugin do Vite: só atua no build, depois que o HTML final foi gerado. */
export function minifyHtmlPlugin() {
  return {
    name: 'minify-html',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      for (const file of Object.values(bundle)) {
        if (file.type === 'asset' && file.fileName.endsWith('.html')) {
          file.source = minifyHtml(String(file.source));
        }
      }
    },
  };
}
