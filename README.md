# ohmyguigs.com

Site pessoal de Guilherme “Guigs” Freitas, em português do Brasil. É um experimento de stack restrita: **HTML5, Tailwind CSS e JavaScript puro com Web Components**, sem framework, sem bibliotecas de interface e sem requisições a terceiros, com acessibilidade (WCAG 2.2 AA) e Core Web Vitals como requisito.

O site tem uma abertura editorial, a trajetória profissional, projetos do GitHub, a música (single *Trocas Genuínas*) e um **atlas da fauna brasileira** com gráficos de barras, colunas e pizza acessíveis, feitos com dados do [SALVE/ICMBio](https://salve.icmbio.gov.br/).

## Rodar localmente

Requer Node.js 22.12 ou mais novo (`.nvmrc`).

```bash
npm install
npm run dev        # servidor local com recarga, em http://localhost:5173
```

Outros comandos:

| Comando | O que faz |
| :--- | :--- |
| `npm run build` | Gera o site em `dist/` |
| `npm run preview` | Serve o `dist/` em `http://localhost:4173` |
| `npm test` | Testes de dados, gráficos, acessibilidade estática, contraste e workflow |
| `npm run check` | Testes, build e testes do artefato (o mesmo que o CI roda) |
| `npm run browser-check` | Verifica no Chrome (teclado, foco, filtros, movimento reduzido, reflow, sem JavaScript). Precisa do Chrome instalado |
| `npm run lighthouse` | Audita o build (mobile e desktop); exige 100 nos quatro tópicos. Precisa do Chrome e baixa o Lighthouse via `npx` |

## Como funciona

- **Tudo está no HTML inicial.** `index.html` tem marcadores `<!--@chart:categorias-->`, `<!--@kpis-->` etc. O Vite os troca no build (`src/lib/prerender.js`) por gráficos, legendas e tabelas completos. Sem JavaScript, a página inteira continua legível e todos os números continuam acessíveis; o JavaScript só acrescenta teclado, foco e filtros.
- **Web Components** (`src/components/`, light DOM): `<accessible-pie>` e `<accessible-bars>` (cada fatia, barra ou coluna é uma parada de Tab, setas como atalho, destaque no item e na linha da legenda no foco e no mouse), `<chart-explorer>` (filtro nativo `<select>` que troca o recorte no lugar e anuncia o resultado) e `<chart-settings>` (preferências de padrões e animações, salvas só neste navegador).
- **Tipo de gráfico por dado:** barras horizontais para categorias, grupos e biomas (comparar valores), colunas para a divisão das ameaçadas dentro de cada grupo (como no portal SALVE) e uma pizza para as 1.383 espécies em categoria de ameaça (três partes de um todo). Cada tipo tem o seu renderizador (`src/lib/pie.js`, `src/lib/bars.js`) e as peças comuns ficam em `src/lib/chart-common.js`.
- **Gráficos acessíveis:** cada gráfico tem cor, padrão de preenchimento, contorno, legenda, resumo em texto e tabela equivalente. A navegação por Tab passa por todos os itens, sem repetir informação. Inspirado nos gráficos de pizza do [Panorama de acessibilidade digital Brasil e Portugal 2026](https://tudoeacessibilidade.com.br/pesquisa/panorama-brasil-portugal-2026/).
- **Movimento é opcional:** respeita `prefers-reduced-motion`, tem um interruptor próprio e nenhuma animação é infinita.

## Dados

| Arquivo | Conteúdo | Origem |
| :--- | :--- | :--- |
| `src/data/salve.js` | Números do SALVE | Respostas públicas do portal, coletadas em 19/11/2026 |
| `src/data/projects.js` | Três projetos do GitHub | Perfil público github.com/ohmyguigs |
| `src/data/profile.js` | Links e identificação | Perfil público do LinkedIn |

O texto da carreira vem do perfil público do LinkedIn. O PDF exportado fica fora do repositório e telefone e e-mail não são publicados.

### Atualizar o snapshot do SALVE

1. Consulte as respostas listadas em `SOURCE.endpoints` (em `src/data/salve.js`), por exemplo abrindo o portal e usando a aba Network do navegador.
2. Copie os valores sem ajustes, atualize `SOURCE.collectedAt` e `collectedAtLabel` (e `sitemap.xml`, se quiser refletir a data).
3. Rode `npm test`: os testes recalculam cada percentual a partir dos totais e acusam erro de transcrição.

O site reproduz os números como o portal os publica, e a página traz uma nota neutra: os totais seguem cada recorte publicado pelo portal. Os testes guardam as somas conhecidas de cada recorte para acusar erro de transcrição.

## Deploy

O workflow `.github/workflows/deploy.yml` roda a cada push na `main` (e manualmente pela aba Actions): `npm ci`, `npm run check`, envio de `dist/` como artefato e publicação com `actions/deploy-pages`. O domínio `ohmyguigs.com` vem de `public/CNAME`.

Configuração única no GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

## Acessibilidade

- Perfil **Standard (WCAG 2.2 AA)** do protocolo [A11Y.md](https://github.com/fecarrico/A11Y.md) (skill em `.kiro/skills/a11y/` e instrução permanente em `.kiro/steering/accessibility.md`).
- `A11Y-DECISIONS.md` registra as decisões de padrão; `EXCEPTIONS.md` registra desvios (hoje, nenhum); `REPORT.md` reúne as evidências e o que ainda precisa de teste humano.
- Teste automatizado não prova conformidade: o `REPORT.md` separa o que foi verificado do que depende de leitor de tela e de pessoas.

Para rodar o gate estático do A11Y.md:

```bash
curl -fsSLO https://raw.githubusercontent.com/fecarrico/A11Y.md/main/tools/verify-a11y.py
python3 verify-a11y.py .
```

## Estrutura

```text
.github/workflows/deploy.yml   deploy no GitHub Pages
.kiro/steering/                regras permanentes para o Kiro (stack, acessibilidade)
.kiro/skills/a11y/             skill A11Y.md (cópia fixada da v2.5.0)
public/                        CNAME, favicon, robots.txt, sitemap.xml
scripts/                       browser-check.mjs (Chrome) e lighthouse.mjs (auditoria do build)
src/components/                Web Components
src/data/                      dados estáticos
src/lib/                       funções puras (geometria, formatação, renderização)
src/main.js, src/styles.css    entrada JavaScript e CSS (Tailwind)
tests/                         node --test (tests/build/ roda sobre o dist/)
index.html                     conteúdo da página
```
