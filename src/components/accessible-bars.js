/**
 * <accessible-bars>
 *
 * Aprimora, no navegador, um gráfico de barras ou de colunas que já chega
 * pronto no HTML (veja src/lib/bars.js). Mesmo padrão das pizzas
 * (<accessible-pie>), sem desenhar nada:
 *
 *  - uma parada de Tab por barra: Tab e Shift+Tab percorrem todas, na ordem
 *    em que aparecem, sem pular nem repetir informação. As setas, Home e End
 *    são um atalho a mais, e Esc limpa o destaque;
 *  - a barra focada ou sob o mouse ganha destaque, e a linha correspondente
 *    (o rótulo da barra, ou a linha da legenda nas colunas) acende junto:
 *    data-focused no foco por teclado, data-active no mouse e no foco.
 *
 * O nome acessível de cada barra já traz rótulo, valor e posição, e o rótulo,
 * o valor e a legenda visíveis são aria-hidden, então nada é lido duas vezes.
 */
import { nextIndex } from '../lib/chart-keys.js';

export class AccessibleBars extends HTMLElement {
  #ready = false;
  #bars = [];
  #holders = [];
  #rows = [];
  #focused = -1;

  connectedCallback() {
    if (this.#ready) return;
    this.#ready = true;

    this.#bars = [...this.querySelectorAll('.bar')];
    // Quem recebe data-active: a linha da barra ou a coluna.
    this.#holders = [...this.querySelectorAll('.bar-row, .bar-col')];
    // Quem acende como "legenda": o rótulo da barra ou a linha da legenda das colunas.
    this.#rows = [...this.querySelectorAll('.bar-row, .legend-item')];

    // Cada barra é uma parada de Tab (como cada fatia da pizza).
    this.#bars.forEach((bar) => {
      bar.tabIndex = 0;
    });

    this.addEventListener('keydown', this.#onKeydown);
    this.addEventListener('focusin', this.#onFocusin);
    this.addEventListener('focusout', this.#onFocusout);
    this.addEventListener('pointerover', this.#onPointerover);
    this.addEventListener('pointerleave', this.#settle);
  }

  #positionOf(element) {
    const holder = element?.closest?.('.bar-row, .bar-col, .legend-item');
    if (!holder || !this.contains(holder)) return -1;
    return Number(holder.dataset.position);
  }

  #onPointerover = (event) => {
    const position = this.#positionOf(event.target);
    if (position < 0) {
      this.#settle();
      return;
    }
    this.#activate(position, false);
  };

  #onFocusin = (event) => {
    const position = this.#bars.indexOf(event.target);
    if (position < 0) return;
    this.#focused = position;
    this.#activate(position, true);
  };

  #onFocusout = (event) => {
    if (this.#bars.indexOf(event.target) < 0) return;
    if (this.#bars.includes(event.relatedTarget)) return; // o foco continua no gráfico
    this.#focused = -1;
    this.#clear();
  };

  #onKeydown = (event) => {
    const current = this.#bars.indexOf(event.target);
    if (current < 0 || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'Escape') {
      this.#clear();
      return;
    }
    const target = nextIndex(event.key, current, this.#bars.length - 1);
    if (target < 0) return;
    event.preventDefault();
    this.#bars[target].focus();
  };

  /** Volta ao estado do foco (se houver) quando o ponteiro sai da barra. */
  #settle = () => {
    if (this.#focused >= 0) this.#activate(this.#focused, true);
    else this.#clear();
  };

  #clear() {
    for (const element of [...this.#holders, ...this.#rows]) {
      element.removeAttribute('data-active');
      element.removeAttribute('data-focused');
    }
  }

  #activate(position, keyboard) {
    const bar = this.#bars[position];
    if (!bar) return;
    this.#clear();
    this.#holders[position]?.setAttribute('data-active', '');
    this.#rows[position]?.setAttribute('data-active', '');
    // A legenda acompanha o foco por teclado: a linha da barra focada recebe o mesmo contorno pontilhado.
    if (keyboard && this.#focused === position && bar.matches(':focus-visible')) {
      this.#rows[position]?.setAttribute('data-focused', '');
    }
  }
}

if (!customElements.get('accessible-bars')) {
  customElements.define('accessible-bars', AccessibleBars);
}
