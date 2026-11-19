---
name: a11y
description: Regras de acessibilidade (WCAG 2.2 AA) do protocolo A11Y.md. Use ao criar ou revisar qualquer interface deste site: HTML, CSS, Web Components, gráficos, navegação, formulários, cores e animações.
---

# A11Y.md: acessibilidade como pré-condição

Fonte: https://github.com/fecarrico/A11Y.md. Perfil adotado neste projeto: **Standard, WCAG 2.2 AA**.

## Como usar

1. Leia `A11Y.md` (nesta pasta, cópia fixada na versão **2.5.0**, de 2026-10-21). É o núcleo normativo.
2. Carregue um guia de referência **somente** quando a interface tiver aquele componente. A tabela do §2.1 do `A11Y.md` diz qual. Os guias ficam no repositório de origem, em
   `https://raw.githubusercontent.com/fecarrico/A11Y.md/main/docs/pt-BR/references/guide-<nome>.md`.
3. Os templates de ciclo de vida (`REPORT.md`, `EXCEPTIONS.md`, `A11Y-DECISIONS.md`) estão em
   `https://raw.githubusercontent.com/fecarrico/A11Y.md/main/docs/pt-BR/templates/`.
4. O gate estático é `https://raw.githubusercontent.com/fecarrico/A11Y.md/main/tools/verify-a11y.py` (`python3 verify-a11y.py .`). O verificador de contraste é `tools/contrast-check.py`, no mesmo repositório.

## Memória do projeto

- `A11Y-DECISIONS.md` (raiz): decisões entre alternativas igualmente conformes. Leia antes de criar componentes.
- `EXCEPTIONS.md` (raiz): desvios aceitos (hoje, nenhum).
- `REPORT.md` (raiz): evidências e o que ainda depende de teste humano.

## Atualizar a cópia

Se o A11Y.md mudar, baixe de novo o arquivo `docs/pt-BR/A11Y.md`, atualize a versão acima e no `REPORT.md` (campo *Versão do padrão*) e reveja as entradas que a mudança afeta.
