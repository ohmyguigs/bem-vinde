<!-- src/routes/index.svelte -->
<script>
  import { base } from '$app/paths';
  export const prerender = true;
  import Navigation from '../components/navigation.svelte';

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
  <Navigation base={base} />
</div>

<style>
  html {
    background-color: teal;
    box-sizing: border-box;
    /* Prevent adjustments of font size after orientation changes in iOS */
    -webkit-text-size-adjust: 100%;
    word-break: normal;
    -moz-tab-size: 4;
    tab-size: 4;
  }

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
