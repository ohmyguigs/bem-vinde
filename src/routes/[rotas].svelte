<!-- src/routes/[rotas].svelte -->
<script context="module">
	/**
	 * @type {import('@sveltejs/kit').Load}
	 */
	export async function load({ page, fetch, session, context }) {
    console.log('load with rotas: ', page.params['rotas'])
    return {
      props: {
        pageName: page.params['rotas'],
      }
    };
  };
</script>

<script>
	export let pageName;
  function padZero(str, len) {
    len = len || 2;
    var zeros = new Array(len).join('0');
    return (zeros + str).slice(-len);
  }
  function invertColor(hex) {
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
  export let bgColor = invertColor(pageName);

  // @ts-ignore
  pageName = pageName ? pageName.startsWith('#') ? pageName : `#${pageName}` : '#000';
  bgColor = bgColor.startsWith('#') ? bgColor : `#${bgColor}`;

  console.log('render: ', { bgColor, pageName })
</script>

<svelte:head>
	<title>Bem vinde a {pageName}</title>
</svelte:head>

<div
  id="rotas--container"
  style="--rota-color: {pageName};--rota-bg-color: {bgColor}">
  <h1>
    Olar e bem vinde a pagina {pageName}
  </h1>
  <p>
    Tente entrar numa pagina que seja um HEX de cor assim:
    <a href="/ff3e00">#ff3e00</a>
  </p>
  <p>
    Deveria carregar o titulo com a cor da rota e o fundo da cor invertida!
    <br/><br/>
    <input label="cor da rota" type="color" bind:value={pageName} style="height: 50px;">
    <input label="cor invertida" type="color" bind:value={bgColor} style="height: 50px;">
  </p>
</div>

<style>
  #rotas--container {
    text-align: center;
    margin: auto;
    padding: auto;
    vertical-align: baseline;
  }

  h1 {
    margin: 0 20%;
    color: var(--rota-color);
    background-color: var(--rota-bg-color);
    font-size: 2em;
    border-radius: 500px;
  }
</style>

