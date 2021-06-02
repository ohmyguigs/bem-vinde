// HEX COLOR HELPERS
function padZero(str, len) {
  len = len || 2;
  var zeros = new Array(len).join('0');
  return (zeros + str).slice(-len);
}

export const isValidColor = (hex) => {
  if (hex.indexOf('#') === 0) {
    hex = hex.slice(1);
  }
  // convert 3-digit hex to 6-digits.
  if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  return /[a-fA-F0-9]{6}/g.test(hex)
}

export const invertColor = (hex) => {
  if (hex.indexOf('#') === 0) {
      hex = hex.slice(1);
  }
  // convert 3-digit hex to 6-digits.
  if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  if (hex.length !== 6) {
      // throw new Error('Invalid HEX color.');
      // not to fail, return defaul color for bg
      return '#FFFFFF';
  }
  // invert color components
  var r = (255 - parseInt(hex.slice(0, 2), 16)).toString(16),
      g = (255 - parseInt(hex.slice(2, 4), 16)).toString(16),
      b = (255 - parseInt(hex.slice(4, 6), 16)).toString(16);
  // pad each with zeros and return
  return '#' + padZero(r) + padZero(g) + padZero(b);
}

export const generateAllColorsArray = (max) => {
  const ceiling = 1000000;
  var maximum = max > ceiling ? ceiling : max;
  var colors = [];
  var count = 0;

  while (colors.length < maximum) {
      // do {
          count += 1;
          colors.push("#" + ("000000" + count.toString(16)).slice(-6));
          // var color = Math.floor((Math.random()*1000000)+1);
      // } while (colors.indexOf(color) >= 0);
      // colors.push("#" + ("000000" + color.toString(16)).slice(-6));
  }
  console.log(`generated ${colors.length} colors!`);
  return colors;
}