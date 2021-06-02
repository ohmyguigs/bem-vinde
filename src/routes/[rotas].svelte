<!-- src/routes/[rotas].svelte -->
<script context="module">
  export const prerender = true;
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
  import { base } from '$app/paths';
  import { generateAllColorsArray, invertColor, isValidColor } from '../utils';
  const MAXIMUM_COLORS_LOOP_SIZE = 4200;
	export let pageName;
  export let bgColor = invertColor(pageName);
  export let allColors = generateAllColorsArray(MAXIMUM_COLORS_LOOP_SIZE);
  export let count = 0;

  // @ts-ignore
  pageName = pageName ? pageName.startsWith('#') ? pageName : `#${pageName}` : '#000';
  bgColor = bgColor.startsWith('#') ? bgColor : `#${bgColor}`;

  export const notAColorPage = !isValidColor(pageName);

  let interval;
  $: {
    if (notAColorPage) {
      clearInterval(interval);
      interval = setInterval(() => {
        if (count >= MAXIMUM_COLORS_LOOP_SIZE -1) {
          console.log('cabou o programa, rogerinho!');
          return;
        }
        pageName = allColors[count];
        bgColor = invertColor(pageName);

        count++;
      }, 42);
    }
  }

  console.log('render: ', { bgColor, pageName, allColors, notAColorPage })
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
  {#if notAColorPage}
    <h2>Essa página tem uma firula de css que muda</h2>
    <p>O titulo tem bgColor: {bgColor} e text-color: {pageName}</p>
    <p>Passando por {count+1} até o total de {MAXIMUM_COLORS_LOOP_SIZE}</p>
    <p>
      Tente entrar numa pagina que seja um HEX de cor assim:
      <a href="{base}/ff3e00">#ff3e00</a>
    </p>
  {/if}
  {#if !notAColorPage}
    <p>Essas paginas de cor deveriam ser estáticas...</p>
  {/if}
  <p>
    As cores do titulo (input esquerdo) e do fundo (input direito) deveriam ser o exato inverso!
    <br/><br/>
  </p>
  <div class="input-wrapper">
    <input label="cor da rota" type="color" bind:value={pageName}>
  </div>
  <div class="input-wrapper">
    <input label="cor invertida" type="color" bind:value={bgColor}>
  </div>
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
    padding: 5%;
    color: var(--rota-color);
    background-color: var(--rota-bg-color);
    font-size: 2em;
    border-radius: 500px;
  }

  input {
    border: none;
    height: 42px;
    width: 84px;
    background-image:none;
    background-color:transparent;
    -webkit-box-shadow: none;
    -moz-box-shadow: none;
    box-shadow: none;
  }

  .input-wrapper {
    display: inline-block;
  }
</style>

