# Acessibilidade (obrigatório em toda alteração de interface)

Ao desenvolver o frontend deste projeto, siga estritamente as regras de acessibilidade do arquivo:

https://raw.githubusercontent.com/fecarrico/A11Y.md/main/docs/pt-BR/A11Y.md

- **Perfil de conformidade:** Standard, WCAG 2.2 AA.
- **Versão do protocolo adotada:** 2.5.0 (última atualização 2026-10-21). Registre no `REPORT.md` a versão contra a qual a interface foi verificada.
- **Carregamento sob demanda:** leia o guia de referência (`references/guide-*.md` no repositório upstream) só quando a interface tiver aquele componente. Os guias já usados aqui: gráficos, navegação, tabelas, imagens/SVG, cor e contraste, controles de formulário (select e switch), tabs/accordion (`<details>`), responsivo, mapeamento de framework (Web Components).
- **Memória do projeto (leia antes de criar componentes):** `A11Y-DECISIONS.md` guarda as decisões entre alternativas igualmente conformes. Reutilize o padrão registrado; não crie variantes paralelas.
- **Exceções:** qualquer desvio de critério WCAG vai para `EXCEPTIONS.md` com dono, aprovador, issue e data de expiração. Hoje não há nenhuma.
- **Antes de entregar** (deploy, preview compartilhada, tag): atualize `REPORT.md`, rode `npm run check`, rode o gate estático (`python3 verify-a11y.py .`, do repositório A11Y.md) e registre o resultado no campo *Gate estático*. Teste humano que não foi feito fica `[ ]` com o motivo, nunca `[x]`.
- **Verificação independente:** quem escreveu a interface não é a única testemunha de que ela está conforme. Registre o nível (cross-agent, fresh-context ou self-reported) no `REPORT.md`.

## Regras que valem para este site em particular

- Cor nunca é o único canal. Gráficos têm cor, padrão, contorno, legenda e tabela equivalente.
- Todo conteúdo e todo número precisam existir no HTML inicial (pré-renderização em `src/lib/prerender.js`). JavaScript só aprimora.
- Nenhuma animação infinita; movimento só sob `prefers-reduced-motion: no-preference` e `html:not(.no-motion)`.
- Alvos de toque de 44 px, foco visível de 3 px com 3:1, fonte mínima de 12 px, entrelinha 1,5, texto alinhado ao início.
- Links que abrem em nova aba avisam no nome acessível e usam `rel="noopener noreferrer"`.
- Contraste é calculado, nunca estimado: `tests/contrast.test.js` mede os temas do CSS e `tools/contrast-check.py` (A11Y.md) gera a matriz do relatório.
