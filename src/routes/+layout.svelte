<script lang="ts">
    import '../app.css';
    import SEO from '$lib/components/SEO.svelte';
    import { page } from '$app/stores';

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

<footer class="fixed bottom-0 left-0 w-full bg-gray-800 text-white py-4 text-center z-10 text-sm opacity-25">
    <p>&copy; {new Date().getFullYear()} created by <a href="https://bsky.app/profile/did:plc:ofrbh253gwicbkc5nktqepol" class="text-green-400 hover:underline">@ewancroft.uk</a></p>
    <p>(<a href="https://github.com/ewanc26/atproto-snake" target="_blank" rel="noopener noreferrer" class="text-green-400 hover:underline">source code</a> under MIT) - <a href="https://ewancroft.uk" target="_blank" rel="noopener noreferrer" class="text-green-400 hover:underline">main website</a></p>
</footer>