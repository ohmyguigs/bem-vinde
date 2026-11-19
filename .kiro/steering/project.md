# Projeto: site pessoal ohmyguigs.com

Site estático em português do Brasil. A stack é uma restrição, não uma preferência.

## Stack

- **HTML5** semântico, **Tailwind CSS v4** compilado no build e **JavaScript nativo (ES Modules) com Web Components**.
- **Proibido:** React, Vue, Angular, Svelte, Lit, jQuery e qualquer biblioteca de interface ou de gráficos. Não há `dependencies` no `package.json`; apenas `vite`, `tailwindcss` e `@tailwindcss/vite` em `devDependencies` (ferramentas de build).
- **Proibido em produção:** requisições de rede (`fetch`, XHR, beacons), fontes remotas, CDNs, analytics, cookies, embeds, iframes. Os dados externos são um snapshot estático em `src/data/`.
- Fontes do sistema apenas.

## Estrutura

- `index.html`: todo o conteúdo. Marcadores `<!--@nome-->` são trocados no build por HTML pré-renderizado (`src/lib/prerender.js`).
- `src/data/`: dados estáticos (SALVE/ICMBio, GitHub, perfil). Para atualizar o SALVE, veja o cabeçalho de `src/data/salve.js`.
- `src/lib/`: funções puras (geometria, formatação, renderização do gráfico), usadas pelo build e pelo navegador.
- `src/components/`: Web Components (`<accessible-pie>`, `<chart-explorer>`, `<chart-settings>`), em light DOM.
- `tests/`: `node --test`, sem biblioteca. `tests/build/` roda sobre o `dist/`.

## Comandos

- `npm run dev`: servidor local com recarga.
- `npm run build` e `npm run preview`: build de produção e servidor do `dist/`.
- `npm test`: testes de dados, gráficos, acessibilidade estática, contraste e workflow.
- `npm run check`: testes, build e testes do artefato (é o que o CI roda).
- `npm run lighthouse`: audita o build (mobile e desktop) e exige 100 nos quatro tópicos.

## Dados e privacidade

- Não publique telefone, e-mail ou endereço. O único canal de contato é o link do LinkedIn.
- O PDF do currículo (`Profile.pdf`) é só fonte de trabalho local e nunca entra no repositório.
- Todo número do SALVE aparece com atribuição, link e data de coleta; não ajuste valores nem percentuais publicados pelo portal.

## Deploy

GitHub Actions publica o `dist/` no GitHub Pages a cada push na `main`. `public/CNAME` mantém o domínio `ohmyguigs.com`.
