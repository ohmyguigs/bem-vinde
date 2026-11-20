/**
 * <accessible-pie>
 *
 * Aprimora, no navegador, um gráfico de pizza que já chega pronto no HTML
 * (veja src/lib/pie.js). O custom element não desenha nada: ele só acrescenta
 *
 *  - uma parada de Tab por fatia: Tab e Shift+Tab percorrem todas, então
 *    nenhuma informação fica escondida de quem navega só por Tab (e a
 *    extensão Atalhos Acessíveis consegue gravar um atalho em qualquer fatia).
 *    As setas, Home e End são um atalho a mais, e Esc limpa o destaque;
 *  - destaque da fatia ativa ("explosão" por CSS) ao passar o mouse, tocar ou
 *    focar, com contorno tracejado visível no foco por teclado;
 *  - a linha da legenda correspondente fica marcada (data-focused) quando a
 *    fatia recebe foco por teclado, e (data-active) no mouse;
 *  - uma linha de detalhes (aria-hidden: a fatia focada já é anunciada pelo
 *    próprio nome acessível, e a legenda também é aria-hidden, então não há
 *    fala duplicada).
 */
import { nextIndex } from '../lib/chart-keys.js';

/** Abaixo deste ângulo (graus) a fatia é fina demais para ver o contorno. */
const TINY_ANGLE = 2.5;

export class AccessiblePie extends HTMLElement {
  #ready = false;
  #groups = [];
  #paths = [];
  #items = [];
  #readout = null;
  #rings = null;
  #halo = null;
  #ring = null;
  #focused = -1;

  connectedCallback() {
    if (this.#ready) return;
    this.#ready = true;

    this.#groups = [...this.querySelectorAll('.slice-group')];
    this.#paths = this.#groups.map((group) => group.querySelector('.slice'));
    this.#items = [...this.querySelectorAll('.legend-item')];
    this.#readout = this.querySelector('.pie-readout');
    this.#rings = this.querySelector('.rings');
    this.#halo = this.querySelector('.ring-halo');
    this.#ring = this.querySelector('.ring');

    // Cada fatia é uma parada de Tab (como no gráfico de referência).
    this.#paths.forEach((path) => {
      path.tabIndex = 0;
    });

    this.addEventListener('keydown', this.#onKeydown);
    this.addEventListener('focusin', this.#onFocusin);
    this.addEventListener('focusout', this.#onFocusout);

    const grid = this.querySelector('.pie-grid');
    grid?.addEventListener('pointerover', this.#onPointerover);
    grid?.addEventListener('pointerleave', this.#settle);
  }

  #positionOf(element) {
    const holder = element?.closest?.('.slice-group, .legend-item');
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
    const position = this.#paths.indexOf(event.target);
    if (position < 0) return;
    this.#focused = position;
    this.#activate(position, true);
  };

  #onFocusout = (event) => {
    if (this.#paths.indexOf(event.target) < 0) return;
    if (this.#paths.includes(event.relatedTarget)) return; // o foco continua no gráfico
    this.#focused = -1;
    this.#clear();
  };

  #onKeydown = (event) => {
    const current = this.#paths.indexOf(event.target);
    if (current < 0 || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'Escape') {
      this.#clear();
      return;
    }
    const target = nextIndex(event.key, current, this.#paths.length - 1);
    if (target < 0) return;
    event.preventDefault();
    this.#paths[target].focus();
  };

  /** Volta ao estado do foco (se houver) quando o ponteiro sai da fatia/legenda. */
  #settle = () => {
    if (this.#focused >= 0) this.#activate(this.#focused, true);
    else this.#clear();
  };

  #clear() {
    this.#groups.forEach((group) => group.removeAttribute('data-active'));
    this.#items.forEach((item) => {
      item.removeAttribute('data-active');
      item.removeAttribute('data-focused');
    });
    this.#rings?.removeAttribute('data-visible');
    if (this.#readout) this.#readout.textContent = this.#readout.dataset.default ?? '';
  }

  #activate(position, withRing) {
    const group = this.#groups[position];
    const path = this.#paths[position];
    if (!group || !path) return;

    this.#groups.forEach((other) => other.removeAttribute('data-active'));
    this.#items.forEach((item) => {
      item.removeAttribute('data-active');
      item.removeAttribute('data-focused');
    });
    group.setAttribute('data-active', '');
    this.#items[position]?.setAttribute('data-active', '');
    if (this.#readout) this.#readout.textContent = path.dataset.readout ?? '';

    const showRing = withRing && this.#focused === position && path.matches(':focus-visible');
    // A legenda acompanha o foco por teclado: a linha da fatia focada recebe o mesmo contorno.
    if (showRing) this.#items[position]?.setAttribute('data-focused', '');
    if (showRing && this.#rings && this.#halo && this.#ring) {
      // Fatias minúsculas (1 espécie entre milhares) são um fio quase invisível:
      // o anel vira uma linha-guia do centro até além da borda. As proporções
      // do gráfico não são alteradas.
      let d = path.getAttribute('d');
      if (Number(group.dataset.angle) < TINY_ANGLE) {
        const radians = (Number(group.dataset.mid) * Math.PI) / 180;
        const x = (50 + 48 * Math.cos(radians)).toFixed(3);
        const y = (50 + 48 * Math.sin(radians)).toFixed(3);
        d = `M 50 50 L ${x} ${y}`;
      }
      this.#halo.setAttribute('d', d);
      this.#ring.setAttribute('d', d);
      const style = group.style;
      this.#rings.setAttribute(
        'transform',
        `translate(${style.getPropertyValue('--ex')} ${style.getPropertyValue('--ey')})`,
      );
      this.#rings.setAttribute('data-visible', '');
    } else {
      this.#rings?.removeAttribute('data-visible');
    }
  }
}

if (!customElements.get('accessible-pie')) {
  customElements.define('accessible-pie', AccessiblePie);
}
