<script lang="ts">
	// SEO: manages <title> and meta tags (description, keywords, OG image).
	// Restores original metadata when the component unmounts so page changes
	// in a SPA don't leave stale tags behind.
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/state';

	let {
		title = 'ATProto Snake Game',
		description = 'A classic Snake game built with SvelteKit and ATProto.',
		keywords = 'snake, game, svelte, sveltekit, atproto, web game',
		ogImage = 'https://ewancroft.uk/embed/main.png' // Default Open Graph image
	}: { title?: string; description?: string; keywords?: string; ogImage?: string } = $props();

	let originalTitle: string;
	let originalDescription: HTMLMetaElement | null;
	let originalKeywords: HTMLMetaElement | null;
	let originalOgImage: HTMLMetaElement | null;

	onMount(() => {
		// Store original metadata to restore on component unmount
		originalTitle = document.title;
		originalDescription = document.querySelector('meta[name="description"]');
		originalKeywords = document.querySelector('meta[name="keywords"]');
		originalOgImage = document.querySelector('meta[property="og:image"]');

		updateMetadata();
	});

	// Reactively update metadata when props or the current path change
	$effect(() => {
		void page.url.pathname; // Trigger update on path change
		updateMetadata();
	});

	/**
	 * Updates the document's metadata (title, description, keywords, Open Graph image).
	 */
	function updateMetadata(): void {
		// Ensure this runs only in the browser
		if (typeof document === 'undefined') {
			return;
		}

		document.title = title;

		let metaDescription = document.querySelector('meta[name="description"]');
		if (!metaDescription) {
			metaDescription = document.createElement('meta');
			metaDescription.setAttribute('name', 'description');
			document.head.appendChild(metaDescription);
		}
		metaDescription.setAttribute('content', description);

		let metaKeywords = document.querySelector('meta[name="keywords"]');
		if (!metaKeywords) {
			metaKeywords = document.createElement('meta');
			metaKeywords.setAttribute('name', 'keywords');
			document.head.appendChild(metaKeywords);
		}
		metaKeywords.setAttribute('content', keywords);

		let metaOgImage = document.querySelector('meta[property="og:image"]');
		if (!metaOgImage) {
			metaOgImage = document.createElement('meta');
			metaOgImage.setAttribute('property', 'og:image');
			document.head.appendChild(metaOgImage);
		}
		metaOgImage.setAttribute('content', ogImage);
	}

	onDestroy(() => {
		// Ensure this runs only in the browser
		if (typeof document === 'undefined') {
			return;
		}

		// Restore original metadata when component is destroyed
		document.title = originalTitle;
		if (originalDescription) {
			document.head.appendChild(originalDescription);
		} else {
			document.querySelector('meta[name="description"]')?.remove();
		}
		if (originalKeywords) {
			document.head.appendChild(originalKeywords);
		} else {
			document.querySelector('meta[name="keywords"]')?.remove();
		}
		if (originalOgImage) {
			document.head.appendChild(originalOgImage);
		} else {
			document.querySelector('meta[property="og:image"]')?.remove();
		}
	});
</script>
