<!-- src/components/navigation.svelte -->
<script>
  import { invertColor } from '../utils'
  export const prerender = true;
  export let base = '';
  const removeHash = hex => hex.replace('#', '');
  let colors = [];
  const MAX_COLORS = 4200;
  while (colors.length < MAX_COLORS) {
    do {
      var randomColor = Math.floor((Math.random()*16777215)+1);
      // @ts-ignore
    } while (colors.indexOf("#" + ("000000" + randomColor.toString(16)).slice(-6)) >= 0);
    colors.push("#" + ("000000" + randomColor.toString(16)).slice(-6));
  }

  const H1_COlOR_FALLBACK = '#fabdaf';
  let hoveredColor = H1_COlOR_FALLBACK;
  function enter(color) {
		hoveredColor = invertColor(color) || H1_COlOR_FALLBACK;
	}

	function leave() {
		hoveredColor = H1_COlOR_FALLBACK;
	}

</script>

<h1 style="--navigation-h1-color: {hoveredColor};">
  ~ C O R E S - A L E A T Ó R I A S ? ~
</h1>
<div id="navigation--container">
  {#each colors as color}
    <div
      class="relative"
      style="--navigation-color-link-size: 20px;">
      <a
        class="navigation--color-link grow"
        href={`${base}/${removeHash(color)}`}
        style="--navigation-link-color: {color}"
        aria-label={`link for color ${color}`}
        on:mouseenter={() => enter(color)}
        on:mouseleave={leave}
      >{color}</a>
    </div>
  {/each}
</div>

<style>
  #navigation--container {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;

    width: 94%;
    height: 64%;
    text-align: center;
    padding: 0;
    margin: 3%;
    vertical-align: baseline;
  }

  h1 {
    color: var(--navigation-h1-color);
		font-size: 2em;
    margin: 0;
  }

  .relative {
    position: relative;
  }

  .navigation--color-link {
    display: block;
    height: var(--navigation-color-link-size);
    width: var(--navigation-color-link-size);
    border-radius: 500px;
    background-color: var(--navigation-link-color);
    border: none;
    /* hides the actual link text */
    color: transparent;
  }

  .navigation--color-link::after {
    content: '';
    background-color: var(--navigation-link-color);
    border-radius: 500px;
    visibility: hidden;
    position: absolute;
    top: 0;
    left: 0;
    z-index: -1;
    height: var(--navigation-color-link-size);
    width: var(--navigation-color-link-size);
    transition: all .42s ease-in-out;
  }

  .navigation--color-link:hover::after {
    transform: scale(111);
    max-width: 100vh;
    max-height: 100vh;
    visibility: visible;
    z-index: -1;
  }

  /* .grow { transition: all .2s ease-in-out; }
  .grow:hover { transform: scale(2); } */
</style>
