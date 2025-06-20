<script lang="ts">
    import '../app.css';
    import SEO from '$lib/components/SEO.svelte';
    import { getStores } from '$app/stores';
    const { page } = getStores();

    import Footer from '$lib/components/Footer.svelte';

    let title = 'ATProto Snake Game';
    let description = 'A classic Snake game built with SvelteKit and ATProto.';
    let keywords = 'snake, game, svelte, sveltekit, atproto, web game';

    $: {
        if ($page.url.pathname === '/game') {
            title = 'Play Snake - ATProto Snake Game';
            description = 'Play the classic Snake game online, built with SvelteKit.';
            keywords = 'snake game, play snake, online snake, svelte snake';
        } else if ($page.url.pathname === '/login') {
            title = 'Login - ATProto Snake Game';
            description = 'Login to the ATProto Snake Game.';
            keywords = 'snake game login, atproto login';
        } else {
            title = 'ATProto Snake Game';
            description = 'A classic Snake game built with SvelteKit and ATProto.';
            keywords = 'snake, game, svelte, sveltekit, atproto, web game';
        }
    }
</script>

<SEO {title} {description} {keywords} />

<slot />

<Footer />