import { round3 } from './format.js';

/** Ponto na circunferência. 0° aponta para a direita; ângulos crescem no sentido horário (eixo y do SVG vai para baixo). */
export function polar(cx, cy, radius, degrees) {
  const radians = (degrees * Math.PI) / 180;
  return { x: cx + radius * Math.cos(radians), y: cy + radius * Math.sin(radians) };
}

/** Caminho SVG de uma fatia de pizza entre dois ângulos. */
export function arcPath(cx, cy, radius, startDeg, endDeg) {
  const sweep = endDeg - startDeg;
  if (sweep >= 359.999) {
    // Fatia única: um círculo completo (um arco de 360° degenera).
    return `M ${cx - radius} ${cy} A ${radius} ${radius} 0 1 1 ${cx + radius} ${cy} A ${radius} ${radius} 0 1 1 ${cx - radius} ${cy} Z`;
  }
  const start = polar(cx, cy, radius, startDeg);
  const end = polar(cx, cy, radius, endDeg);
  const largeArc = sweep > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${round3(start.x)} ${round3(start.y)} A ${radius} ${radius} 0 ${largeArc} 1 ${round3(end.x)} ${round3(end.y)} Z`;
}

/**
 * Calcula as fatias de uma pizza. Os ângulos usam o valor absoluto de cada
 * item sobre a soma dos valores; itens com valor 0 não geram fatia.
 *
 * @param {{value:number}[]} items
 */
export function computeSlices(items, { cx = 50, cy = 50, radius = 42, explode = 3, labelRadius = 26 } = {}) {
  const sum = items.reduce((acc, item) => acc + item.value, 0);
  let cursor = -90; // começa no topo
  const slices = [];
  items.forEach((item, index) => {
    if (!(item.value > 0) || !(sum > 0)) return;
    const angle = (item.value / sum) * 360;
    const start = cursor;
    const end = cursor + angle;
    const mid = start + angle / 2;
    cursor = end;
    const offset = polar(0, 0, explode, mid);
    const label = polar(cx, cy, labelRadius, mid);
    slices.push({
      index,
      item,
      start,
      end,
      mid,
      angle,
      d: arcPath(cx, cy, radius, start, end),
      ex: round3(offset.x),
      ey: round3(offset.y),
      labelX: round3(label.x),
      labelY: round3(label.y),
    });
  });
  return slices;
}
