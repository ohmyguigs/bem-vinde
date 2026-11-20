/**
 * Atalhos de teclado dos gráficos (além do Tab, que passa por todos os itens):
 * setas, Home e End trocam de item, dando a volta nas pontas.
 *
 * Devolve o índice do item que deve receber o foco, ou -1 para uma tecla sem efeito.
 */
export function nextIndex(key, current, last) {
  switch (key) {
    case 'ArrowRight':
    case 'ArrowDown':
      return current === last ? 0 : current + 1;
    case 'ArrowLeft':
    case 'ArrowUp':
      return current === 0 ? last : current - 1;
    case 'Home':
      return 0;
    case 'End':
      return last;
    default:
      return -1;
  }
}
