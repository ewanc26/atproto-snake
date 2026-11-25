<script lang="ts">
	// Root layout — initialises OAuth on every page mount, applies global
	// CSS, and sets route-aware SEO metadata via the SEO component.
	import '../app.css';
	import SEO from '$lib/components/SEO.svelte';
	import { page } from '$app/state';
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { initAuth } from '$lib/auth/auth';

	import Footer from '$lib/components/Footer.svelte';
	import Nav from '$lib/components/Nav.svelte';

	let { children }: { children: Snippet } = $props();

	// Initialise auth on mount - processes OAuth callbacks and restores sessions
	onMount(async () => {
		try {
			const agent = await initAuth();
			// If on login page and now authenticated, redirect to game
			if (agent && page.url.pathname === '/login') {
				goto('/game');
			}
		} catch (e) {
			console.error('Auth init error:', e);
		}
	});

	// ── Route-Specific SEO ────────────────────────────────
	const seo = $derived.by(() => {
		if (page.url.pathname === '/game') {
			return {
				title: 'Play Snake - ATProto Snake Game',
				description: 'Play the classic Snake game online, built with SvelteKit.',
				keywords: 'snake game, play snake, online snake, svelte snake'
			};
		}
		if (page.url.pathname === '/login') {
			return {
				title: 'Login - ATProto Snake Game',
				description: 'Login to the ATProto Snake Game.',
				keywords: 'snake game login, atproto login'
			};
		}
		return {
			title: 'ATProto Snake Game',
			description: 'A classic Snake game built with SvelteKit and ATProto.',
			keywords: 'snake, game, svelte, sveltekit, atproto, web game'
		};
	});
</script>

<SEO {...seo} />

<Nav />

<!-- Main content with proper spacing to avoid footer overlap -->
<main class="bg-canvas-950 relative min-h-screen">
	{@render children()}
</main>

<!-- Footer with improved positioning -->
<Footer />
