/**
 * <chart-settings>
 *
 * Duas preferências de quem usa os gráficos, guardadas só neste navegador
 * (localStorage; nada é enviado a lugar nenhum):
 *
 *   data-setting="patterns"  padrões de preenchimento nas fatias (ligado por padrão)
 *   data-setting="motion"    animações do site (ligado por padrão)
 *
 * Cada preferência é um switch nativo (button role="switch"). O nome do
 * controle nunca muda; só o estado (aria-checked) muda. Se o sistema
 * operacional pede movimento reduzido, o switch de animações fica desligado e
 * indisponível: a preferência do sistema vale mais do que um padrão do site.
 *
 * O script inline do <head> aplica as classes salvas antes da primeira pintura.
 */
const SETTINGS = {
  patterns: { className: 'no-patterns', storageKey: 'ohmyguigs:patterns', followsSystemMotion: false },
  motion: { className: 'no-motion', storageKey: 'ohmyguigs:motion', followsSystemMotion: true },
};

export class ChartSettings extends HTMLElement {
  connectedCallback() {
    const root = document.documentElement;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.querySelectorAll('[data-setting]').forEach((button) => {
      const setting = SETTINGS[button.dataset.setting];
      if (!setting) return;
      const lockedBySystem = setting.followsSystemMotion && reducedMotion;
      const state = button.querySelector('[data-state]');
      const note = button.closest('.setting')?.querySelector('[data-os-note]');

      const sync = () => {
        const on = !lockedBySystem && !root.classList.contains(setting.className);
        button.setAttribute('aria-checked', String(on));
        if (state) state.textContent = on ? 'Ligado' : 'Desligado';
      };

      if (lockedBySystem) {
        button.setAttribute('aria-disabled', 'true');
        if (note) {
          note.hidden = false;
          // O aviso passa a fazer parte da descrição do controle.
          note.id ||= `${button.dataset.setting}-os-note`;
          button.setAttribute('aria-describedby', `${button.getAttribute('aria-describedby') ?? ''} ${note.id}`.trim());
        }
      }
      sync();

      button.addEventListener('click', () => {
        if (lockedBySystem) return;
        const off = root.classList.toggle(setting.className);
        try {
          localStorage.setItem(setting.storageKey, off ? '0' : '1');
        } catch {
          /* armazenamento indisponível: a preferência vale só nesta visita */
        }
        sync();
      });
    });
  }
}

if (!customElements.get('chart-settings')) {
  customElements.define('chart-settings', ChartSettings);
}
