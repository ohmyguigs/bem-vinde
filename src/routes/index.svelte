<!-- src/routes/index.svelte -->
<script>
  import { base } from '$app/paths';
  export const prerender = true;

  let count = 0;
  function handleClick() {
    if (count >= 42) {
      count = 42;
      alert('nossa cara, você gosta mesmo de abacates, acho que 42 ta bom...');
    } else {
      count += 1;
    }
  }
</script>

<svelte:head>
	<title>Bem vinde</title>
</svelte:head>

<div id="index--container">
  <h1>Olar e bem vinde ao meu site!</h1>
  <p>teste de rota <a href="{base}/come-🥑-bem">come-🥑-bem</a>, que funciona até com emoji</p>
  <br/>
  <button on:click={handleClick}>
    Come {count} {count === 1 ? 'abacate' : 'abacates'} 🥑✨
  </button>
  <br/><br><br>
  <p>tente ir para <a href="{base}/FF0000">alguma pagina</a>, que seja um HEX de cor como #FF0000</p>
</div>

<style>
  #index--container {
    text-align: center;
    margin: auto;
    padding: auto;
    vertical-align: baseline;
  }

  h1 {
    color: purple;
		font-size: 2em;
  }
</style>
