# A11y Verification Report

Evidências de conformidade do site ohmyguigs.com, no formato do template do [A11Y.md](https://github.com/fecarrico/A11Y.md). Este relatório é versionado: atualize-o sempre que a interface mudar.

> **Legenda:** `[x]` verificado, com a evidência ao lado · `[!]` verificado e reprovado · `[~]` verificado parcialmente, com o que falta · `[ ]` **não verificado**, com o motivo e quem deve executar.
> Teste automatizado não estabelece conformidade. Tudo que depende de leitor de tela, de controle por voz e de outros navegadores está marcado `[ ]` e **não foi feito**.

---

## 📌 Contexto da Validação
- **Funcionalidade/Épico:** Site pessoal completo (abertura, carreira, laboratório, música e atlas da fauna brasileira com gráficos de barras, colunas e pizza acessíveis)
- **Data do Teste:** 19/11/2026
- **Cobre a interface em:** árvore de trabalho da branch `reafctor/js-vanilla-a11y`, ainda sem commit; build verificado gerado em 19/11/2026 (`npm run check`). Depois do commit, registre aqui o hash.
- **Versão do padrão:** 2.5.0 (A11Y.md, perfil Standard · WCAG 2.2 AA)
- **Status de Conformidade:** ⚠️ CONDICIONAL (verificações automáticas e no navegador passam; faltam os testes humanos do §3)
- **Independência da Verificação:** self-reported ⚠️ — o agente Kiro que escreveu a interface executou as verificações desta sessão (sem leitor de tela e só no Chrome). Teto: CONDICIONAL.
- **Gate estático (`verify-a11y.py`):** PASS (0 erros, 1 aviso: verificação self-reported, 10 achados registrados em `A11Y-DECISIONS.md`) — rodado em: 2026-11-19

## 1. Verificação Técnica (Automated & Semantics)
- [x] **Axe-Core / Lighthouse:** Lighthouse 13.6.0 sobre o build de produção (`npm run lighthouse`, em 19/11/2026): **mobile e desktop com 100 em Desempenho, Acessibilidade, Boas práticas e SEO**. Mobile: LCP 0,8 s, CLS 0, TBT 0 ms. Desktop: LCP 0,2 s, CLS 0, TBT 0 ms. Não foi rodado o axe-core separadamente; a categoria de acessibilidade do Lighthouse usa o motor do axe e detecta só uma parte das barreiras.
- [x] **Semântica HTML:** testes em `tests/static-a11y.test.js` (61 testes passando em `npm test`, contando os de gráficos, contraste, dados e fluxo): um `h1`, landmarks, `nav` nomeadas, sem `div` clicável, sem manipuladores inline, referências ARIA sem órfãs, ids únicos, links externos com aviso de nova aba e `rel` seguro.
- [x] **Hierarquia de Títulos (H1-H6):** verificada por teste (`h1 → h2 → h3`, sem saltos).

## 2. Tab Order e Focus Management
- [x] **Indicador de Foco:** anel de 3 px com contraste mínimo de 3:1 contra o fundo de cada tema (matriz abaixo). Nenhum `outline: none` além do destino do link de salto (`main:focus`, registrado em `A11Y-DECISIONS.md`). Nos gráficos há um anel duplo em SVG (halo branco e traço escuro). Verificado no Chrome com teclado (`npm run browser-check`): `:focus-visible` verdadeiro e anel visível.
- [x] **Navegação Lógica:** o link de salto é o primeiro item focável (teste estático); no Chrome, Tab e Shift+Tab percorrem todas as fatias, barras e colunas de cada gráfico, em ordem, e o Tab seguinte sai do gráfico. O índice do atlas leva a cada gráfico, e "Voltar ao topo" (um por seção, mesmo texto e mesmo destino) leva ao início da página, com o Tab seguinte no menu.
- [x] **Foco Capturado (Modals/Overlays):** N/A. A página não tem modais, diálogos, popovers nem overlays.

## 3. Comportamento e Retorno de Tarefas
- [ ] **Screen Reader Test:** **não feito.** Nenhum leitor de tela foi usado nesta sessão; o agente não tem como executá-lo. Quem deve executar: Guilherme (ou outra pessoa que use leitor de tela), pelo menos um par, por exemplo VoiceOver + Safari no macOS e NVDA + Firefox no Windows.
  - Par(es) usado(s): nenhum até aqui
  - Quem executou e quando: pendente
  - Cenários a executar (blocos *Comportamento esperado* de cada guia): guide-charts (gráficos de barras, colunas e pizza), guide-navigation (link de salto, menu, landmarks), guide-tables (tabelas de dados), guide-form-controls (select de filtros, switches de preferências), guide-tabs-accordion (`details` das tabelas), guide-toasts-notifications (região `role="status"` dos filtros), guide-buttons (botões de preferências).
- [~] **Cenários de teclado dos guias, executados no Chrome por automação (`npm run browser-check`, 86 verificações, todas passando):**
  - **guide-charts (barras e colunas)** — cada barra ou coluna é uma parada de Tab (Tab e Shift+Tab percorrem as 10 barras de categorias e as 3 colunas de cada grupo, e o 11º Tab sai do gráfico); setas, Home, End e Esc funcionam como na pizza; a barra focada recebe anel de 3 px e o rótulo da linha (nas colunas, a linha da legenda, que fica `aria-hidden`) ganha o contorno pontilhado ao mesmo tempo; o nome acessível é "rótulo: valor, percentual. Barra n de N" (ou "Coluna n de N"), e rótulos e valores visíveis ficam `aria-hidden` para nada ser lido duas vezes; a barra de 1 espécie continua visível (largura mínima de 0,5 rem); as colunas seguem a ordem VU, EN, CR do portal; o EW de Aves aparece só na tabela de dados. Falta: ouvir os anúncios num leitor de tela.
  - **guide-charts (pizza)** — cada fatia é uma parada de Tab (Tab e Shift+Tab percorrem as 3 fatias das espécies ameaçadas); setas, Home e End também trocam de fatia; a fatia focada mostra o anel pontilhado, "explode" como no hover e acende a linha correspondente da legenda (que fica `aria-hidden`); ela recebe o nome acessível "rótulo: valor, percentual. Fatia n de N" (o texto da linha da legenda mais a posição); Esc limpa a seleção; o hover e o foco mostram os mesmos detalhes; alternativa em tabela com legenda e `scope`; o filtro troca o gráfico e anuncia o resultado ("Gráfico atualizado: …, N fatias. Maior: …"). Falta: ouvir os anúncios num leitor de tela.
  - **guide-form-controls** — `select` nativo com label visível, sem navegação nem envio ao mudar de valor; switches (`button role="switch"`) com nome fixo e estado em `aria-checked`; estado "indisponível" quando o sistema pede movimento reduzido. Falta: ouvir "switch, ligado/desligado" no leitor de tela.
  - **guide-navigation** — link de salto visível ao focar, primeiro focável, com destino existente (teste estático). Falta: pular por landmarks e listar links num leitor de tela.
  - **guide-tables** — `caption`, `th scope="col"` e `scope="row"`, rodapé com base de cálculo (teste estático). Falta: navegação por células num leitor de tela.
  - **guide-tabs-accordion** — usa `details`/`summary` nativos (não há abas); Enter e Espaço nativos. Falta: ouvir "expandido/recolhido".
  - **guide-toasts-notifications** — região `role="status"` pequena e dedicada ao anúncio do filtro, fora do contêiner do gráfico. Falta: confirmar a fala.
  - **guide-buttons** — botões nativos, com `type` (teste estático).
- [~] **Controle por Voz:** nomes acessíveis conferidos por leitura do código contra os rótulos visíveis (links incluem o texto visível, mais o sufixo "(abre em nova aba)"; os switches incluem o rótulo visível). Não testado com Voice Control, Voice Access ou Dragon.
  - Ferramenta ou método: leitura dos nomes acessíveis contra os rótulos visíveis
- [~] **Estados interativos inventariados:**
  - Gráficos de barras e colunas (repouso, hover, foco por teclado com Tab, Shift+Tab e setas, Esc, troca de recorte com o foco ficando no select): **navegados** no Chrome.
  - Gráfico de pizza (repouso, hover, foco por teclado com Tab, Shift+Tab e setas, Esc, troca de recorte com o foco ficando no select): **navegado** no Chrome.
  - Preferências (padrões ligados/desligados, animações ligadas, desligadas e travadas pelo sistema): **navegado** no Chrome (movimento reduzido emulado).
  - `details` das tabelas e da origem dos dados (fechado/aberto): **lido no código** (elemento nativo); não aberto e percorrido no navegador.
  - Página sem JavaScript: **navegada** no Chrome (script desativado); o `select` e os textos de ajuda de teclado ficam ocultos, as tabelas e os gráficos continuam.
  - Foco em Safari e Firefox: **não verificado** (só Chrome).
- [x] **Mudança de Status (`aria-live`):** a troca de recorte atualiza uma região `role="status"` própria com o resultado; verificado no Chrome que o texto é o esperado. Não há outros eventos dinâmicos.
- [x] **Preenchimento de Formulários:** não há formulários de envio. Os dois `select` têm `label` com `for`/`id` (teste estático) e não navegam nem enviam ao mudar.

## 4. Percepção Visual e Compreensão
- [x] **Contraste de Texto & UI:** todos os pares abaixo foram calculados com a fórmula da WCAG a partir dos tokens do CSS (`tests/contrast.test.js` repete o cálculo a cada `npm test`). Nenhum par abaixo do piso. A cor da fatia se compara com o fundo do gráfico (3:1 para componente gráfico) e com o texto branco do rótulo (4,5:1).
| Par | Primeiro plano | Fundo | Razão | Piso | Resultado |
| :--- | :--- | :--- | ---: | ---: | :--- |
| ink: texto corrido | #f5f1e8 | #0e0f12 | 17.00:1 | 4.5:1 | ✅ |
| ink: texto de apoio | #c9c4b6 | #0e0f12 | 11.00:1 | 4.5:1 | ✅ |
| ink: kicker e destaque | #d4ff4f | #0e0f12 | 16.62:1 | 4.5:1 | ✅ |
| ink: links | #d4ff4f | #0e0f12 | 16.62:1 | 4.5:1 | ✅ |
| ink: texto em cartão | #f5f1e8 | #1a1c22 | 15.11:1 | 4.5:1 | ✅ |
| ink: apoio em cartão | #c9c4b6 | #1a1c22 | 9.78:1 | 4.5:1 | ✅ |
| ink: destaque em cartão | #d4ff4f | #1a1c22 | 14.77:1 | 4.5:1 | ✅ |
| ink: anel de foco | #d4ff4f | #0e0f12 | 16.62:1 | 3:1 | ✅ |
| ink: anel de foco em cartão | #d4ff4f | #1a1c22 | 14.77:1 | 3:1 | ✅ |
| ink: bordas de UI | #70737d | #0e0f12 | 4.05:1 | 3:1 | ✅ |
| ink: bordas de UI em cartão | #70737d | #1a1c22 | 3.60:1 | 3:1 | ✅ |
| paper: texto corrido | #17160f | #f5f1e8 | 16.09:1 | 4.5:1 | ✅ |
| paper: texto de apoio | #4a463b | #f5f1e8 | 8.35:1 | 4.5:1 | ✅ |
| paper: kicker e destaque | #1d4ed8 | #f5f1e8 | 5.95:1 | 4.5:1 | ✅ |
| paper: links | #1d4ed8 | #f5f1e8 | 5.95:1 | 4.5:1 | ✅ |
| paper: texto em cartão | #17160f | #fffdf7 | 17.83:1 | 4.5:1 | ✅ |
| paper: apoio em cartão | #4a463b | #fffdf7 | 9.26:1 | 4.5:1 | ✅ |
| paper: destaque em cartão | #1d4ed8 | #fffdf7 | 6.59:1 | 4.5:1 | ✅ |
| paper: anel de foco | #1d4ed8 | #f5f1e8 | 5.95:1 | 3:1 | ✅ |
| paper: anel de foco em cartão | #1d4ed8 | #fffdf7 | 6.59:1 | 3:1 | ✅ |
| paper: bordas de UI | #17160f | #f5f1e8 | 16.09:1 | 3:1 | ✅ |
| paper: bordas de UI em cartão | #17160f | #fffdf7 | 17.83:1 | 3:1 | ✅ |
| night: texto corrido | #eaf6ff | #0b1d33 | 15.45:1 | 4.5:1 | ✅ |
| night: texto de apoio | #a9c4d6 | #0b1d33 | 9.33:1 | 4.5:1 | ✅ |
| night: kicker e destaque | #8fe8ff | #0b1d33 | 12.24:1 | 4.5:1 | ✅ |
| night: links | #8fe8ff | #0b1d33 | 12.24:1 | 4.5:1 | ✅ |
| night: texto em cartão | #eaf6ff | #12304f | 12.25:1 | 4.5:1 | ✅ |
| night: apoio em cartão | #a9c4d6 | #12304f | 7.40:1 | 4.5:1 | ✅ |
| night: destaque em cartão | #8fe8ff | #12304f | 9.71:1 | 4.5:1 | ✅ |
| night: anel de foco | #8fe8ff | #0b1d33 | 12.24:1 | 3:1 | ✅ |
| night: anel de foco em cartão | #8fe8ff | #12304f | 9.71:1 | 3:1 | ✅ |
| night: bordas de UI | #5f84a6 | #0b1d33 | 4.31:1 | 3:1 | ✅ |
| night: bordas de UI em cartão | #5f84a6 | #12304f | 3.42:1 | 3:1 | ✅ |
| grape: texto corrido | #fbeeff | #2b0f45 | 14.94:1 | 4.5:1 | ✅ |
| grape: texto de apoio | #e2c3f0 | #2b0f45 | 10.58:1 | 4.5:1 | ✅ |
| grape: kicker e destaque | #ffa6dd | #2b0f45 | 9.35:1 | 4.5:1 | ✅ |
| grape: links | #ffa6dd | #2b0f45 | 9.35:1 | 4.5:1 | ✅ |
| grape: texto em cartão | #fbeeff | #3d1a5e | 12.45:1 | 4.5:1 | ✅ |
| grape: apoio em cartão | #e2c3f0 | #3d1a5e | 8.82:1 | 4.5:1 | ✅ |
| grape: destaque em cartão | #ffa6dd | #3d1a5e | 7.79:1 | 4.5:1 | ✅ |
| grape: anel de foco | #ffa6dd | #2b0f45 | 9.35:1 | 3:1 | ✅ |
| grape: anel de foco em cartão | #ffa6dd | #3d1a5e | 7.79:1 | 3:1 | ✅ |
| grape: bordas de UI | #b98ad6 | #2b0f45 | 6.10:1 | 3:1 | ✅ |
| grape: bordas de UI em cartão | #b98ad6 | #3d1a5e | 5.09:1 | 3:1 | ✅ |
| moss: texto corrido | #10281a | #eef3e4 | 13.86:1 | 4.5:1 | ✅ |
| moss: texto de apoio | #3b5646 | #eef3e4 | 7.13:1 | 4.5:1 | ✅ |
| moss: kicker e destaque | #0b5a2b | #eef3e4 | 7.40:1 | 4.5:1 | ✅ |
| moss: links | #0b4f8a | #eef3e4 | 7.43:1 | 4.5:1 | ✅ |
| moss: texto em cartão | #10281a | #fbfdf6 | 15.28:1 | 4.5:1 | ✅ |
| moss: apoio em cartão | #3b5646 | #fbfdf6 | 7.86:1 | 4.5:1 | ✅ |
| moss: destaque em cartão | #0b5a2b | #fbfdf6 | 8.16:1 | 4.5:1 | ✅ |
| moss: anel de foco | #1d4ed8 | #eef3e4 | 5.93:1 | 3:1 | ✅ |
| moss: anel de foco em cartão | #1d4ed8 | #fbfdf6 | 6.54:1 | 3:1 | ✅ |
| moss: bordas de UI | #10281a | #eef3e4 | 13.86:1 | 3:1 | ✅ |
| moss: bordas de UI em cartão | #10281a | #fbfdf6 | 15.28:1 | 3:1 | ✅ |
| botão escuro (texto) | #f5f1e8 | #17160f | 16.09:1 | 4.5:1 | ✅ |
| botão rosa (texto) | #2b0f45 | #ffa6dd | 9.35:1 | 4.5:1 | ✅ |
| botão rosa em hover (texto) | #ffa6dd | #2b0f45 | 9.35:1 | 4.5:1 | ✅ |
| citação sobre lima | #0e0f12 | #d4ff4f | 16.62:1 | 4.5:1 | ✅ |
| chip de competência | #f5f1e8 | #17160f | 16.09:1 | 4.5:1 | ✅ |
| select | #10281a | #ffffff | 15.67:1 | 4.5:1 | ✅ |
| link de salto | #0e0f12 | #d4ff4f | 16.62:1 | 4.5:1 | ✅ |
| anel do link de salto | #0e0f12 | #d4ff4f | 16.62:1 | 3:1 | ✅ |
| fatia vermelho sobre o cartão do gráfico | #b3261e | #fbfdf6 | 6.38:1 | 3:1 | ✅ |
| texto branco sobre a fatia vermelho | #ffffff | #b3261e | 6.54:1 | 4.5:1 | ✅ |
| fatia laranja sobre o cartão do gráfico | #b94a0b | #fbfdf6 | 5.06:1 | 3:1 | ✅ |
| texto branco sobre a fatia laranja | #ffffff | #b94a0b | 5.19:1 | 4.5:1 | ✅ |
| fatia ocre sobre o cartão do gráfico | #8a5a00 | #fbfdf6 | 5.78:1 | 3:1 | ✅ |
| texto branco sobre a fatia ocre | #ffffff | #8a5a00 | 5.93:1 | 4.5:1 | ✅ |
| fatia oliva sobre o cartão do gráfico | #566b0c | #fbfdf6 | 5.85:1 | 3:1 | ✅ |
| texto branco sobre a fatia oliva | #ffffff | #566b0c | 5.99:1 | 4.5:1 | ✅ |
| fatia verde-azulado sobre o cartão do gráfico | #0b6b5f | #fbfdf6 | 6.24:1 | 3:1 | ✅ |
| texto branco sobre a fatia verde-azulado | #ffffff | #0b6b5f | 6.40:1 | 4.5:1 | ✅ |
| fatia ardósia sobre o cartão do gráfico | #475569 | #fbfdf6 | 7.39:1 | 3:1 | ✅ |
| texto branco sobre a fatia ardósia | #ffffff | #475569 | 7.58:1 | 4.5:1 | ✅ |
| fatia pedra sobre o cartão do gráfico | #6f655f | #fbfdf6 | 5.53:1 | 3:1 | ✅ |
| texto branco sobre a fatia pedra | #ffffff | #6f655f | 5.67:1 | 4.5:1 | ✅ |
| fatia quase preto sobre o cartão do gráfico | #161a22 | #fbfdf6 | 17.00:1 | 3:1 | ✅ |
| texto branco sobre a fatia quase preto | #ffffff | #161a22 | 17.43:1 | 4.5:1 | ✅ |
| fatia roxo sobre o cartão do gráfico | #6b21a8 | #fbfdf6 | 8.51:1 | 3:1 | ✅ |
| texto branco sobre a fatia roxo | #ffffff | #6b21a8 | 8.72:1 | 4.5:1 | ✅ |
| fatia magenta sobre o cartão do gráfico | #b0125f | #fbfdf6 | 6.61:1 | 3:1 | ✅ |
| texto branco sobre a fatia magenta | #ffffff | #b0125f | 6.78:1 | 4.5:1 | ✅ |
| anel do gráfico (traço escuro) sobre o halo branco | #10281a | #ffffff | 15.67:1 | 3:1 | ✅ |
- [x] **Redundância:** gráficos usam cor, padrão de preenchimento (10 padrões distintos), contorno escuro, legenda e tabela; cada categoria de risco mantém o mesmo padrão e a mesma cor em todos os gráficos (testado). O estado dos switches é texto ("Ligado/Desligado") e posição, não só cor. O usuário pode desligar os padrões.
- [~] **Scale / Zoom:** no Chrome, texto a 200% sem rolagem horizontal (SC 1.4.4); reflow a 320 e 375 px sem rolagem horizontal (SC 1.4.10); espaçamento de texto ampliado sem cortes (SC 1.4.12). Falta conferir em dispositivos reais e em outros navegadores. Simulação de daltonismo e teste em escala de cinza não foram feitos (a redundância acima foi verificada por inspeção do código e das capturas de tela).

## 5. Mídia Temporal e Movimento
O site não tem vídeo nem áudio; a música é um link para o Spotify, sem player e sem som automático. Há movimento decorativo.
- [x] **Classificação:** N/A para mídia. O círculo da abertura e o vinil são decorativos, em CSS, com `aria-hidden`.
- [x] **Alternativas:** N/A (sem mídia temporal).
- [x] **Autoplay e Conteúdo em Movimento:** sem áudio. Nenhuma animação é infinita (teste estático proíbe `infinite`); as entradas duram até 4,5 s e rodam uma vez, as demais acompanham a rolagem. Nada pisca.
- [x] **Movimento Reduzido:** verificado no Chrome com `prefers-reduced-motion: reduce` emulado: nenhuma animação roda (`animation-name: none` no círculo, no vinil e nos blocos revelados) e o switch "Animações do site" fica indisponível, desligado e com o motivo ligado por `aria-describedby`.
- [x] **Texto sobre Mídia:** N/A. Não há texto sobre imagem, vídeo ou gradiente.

## 6. Carga Cognitiva e Fluxo
O site não tem fluxo de várias etapas, autenticação nem limite de tempo.
- [x] **Nada para lembrar:** N/A (sem fluxo).
- [x] **Nada para redigitar:** N/A.
- [x] **Ajuda no mesmo lugar:** N/A.
- [x] **Espaçamento de texto:** verificado no Chrome (linha 1,5×, parágrafo 2×, letras 0,12×, palavras 0,16×): sem cortes nem rolagem horizontal.
- [x] **Tempo:** N/A (sem limites de tempo).
- [x] **Necessidades conflitantes:** movimento × distúrbio vestibular resolvido por `prefers-reduced-motion` (canal em que a própria pessoa decide) e por um interruptor próprio; padrões visuais × poluição visual resolvido por um interruptor. Registrado em `A11Y-DECISIONS.md`.

---
## 7. Desempenho Funcional *(opcional)*
Não preenchido; nenhuma declaração formal (VPAT/EN 301 549) foi emitida.

---
## 📝 Notas de Avaliação ou Bloqueios Conhecidos

- **Pendente, humano:** teste com leitor de tela (§3), controle por voz e navegação em Safari e Firefox. Até lá, o status é CONDICIONAL.
- **Roteiro manual com a extensão Atalhos Acessíveis (pendente, humano; baseado na palestra "Além do Tab", de Juliano Lopes):**
  1. No gráfico "Quais grupos da fauna foram mais avaliados?", dê Tab até uma barra, use o comando de adicionar atalho da extensão e grave uma combinação. Repita num link do índice do atlas ("Risco em cada bioma") e no "Voltar ao topo".
  2. Recarregue a página e execute os atalhos: cada um deve focar o elemento certo.
  3. No filtro de bioma, troque o recorte e execute o atalho de uma barra que existe nos dois recortes (por exemplo, Menos Preocupante, `barras-biomas-barra-lc`). Registre se a extensão ainda encontra o elemento. Para uma categoria que não existe no novo recorte, o atalho não encontra o elemento, e isso é esperado.
  4. Com NVDA + Firefox ou VoiceOver + Safari, confirme que cada barra é anunciada uma vez ("Aves: 2.069 espécies, 13,1%. Barra 2 de 10.") e que o rótulo e o valor visíveis não são lidos de novo.
  5. Anote o par de leitor de tela e navegador, quem testou e quando, e preencha o §3.
- **Custo de Tab aceito:** cada gráfico tem de 3 a 10 paradas de Tab. O índice do atlas e o "Voltar ao topo" existem para compensar.
- **Navegadores:** verificado só no Chrome. Animações ligadas à rolagem (`animation-timeline: view()`) só existem em navegadores que suportam a propriedade; nos demais a página aparece sem essas entradas, sem perda de conteúdo.
- **Totais do SALVE:** os números foram reproduzidos sem ajuste, e a página traz uma nota neutra de que os totais seguem cada recorte publicado pelo portal.
- **Dado do portal:** o total de espécies em categoria de ameaça (1.383) traz o aviso do próprio SALVE de que não reflete a lista oficial; o aviso aparece ao lado do número.
- **Valores muito pequenos:** no gráfico de categorias, três categorias têm menos de 1 espécie por 1.000 (0,0%). Cada barra tem largura mínima de 0,5 rem para continuar visível e focável, e o percentual aparece como o portal o publica.
- **Pizza das ameaçadas:** o portal publica o total de 1.383, mas não o percentual de cada categoria. Os percentuais (26,1%, 36,9% e 37,0%) são calculados neste site, e a tabela do gráfico diz isso.
- **Mapa de biomas:** o portal usa um mapa clicável. Este site usa um filtro nativo com barras, que entrega a mesma tabela por bioma e funciona por teclado.
- **Comando para reproduzir:** `npm run check` (testes e build), `npm run browser-check` (Chrome) e `npm run lighthouse`.
