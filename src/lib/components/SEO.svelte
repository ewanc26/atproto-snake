<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { page } from '$app/stores';

    export let title: string = 'ATProto Snake Game';
    export let description: string = 'A classic Snake game built with SvelteKit and ATProto.';
    export let keywords: string = 'snake, game, svelte, sveltekit, atproto, web game';
    export let ogImage: string = '/favicon.png'; // Default Open Graph image

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

    // Reactively update metadata when props or page store changes
    $: {
        title,
        description,
        keywords,
        ogImage,
        $page.url.pathname; // Trigger update on path change
        updateMetadata();
    }

    /**
     * Updates the document's metadata (title, description, keywords, Open Graph image).
     */
    function updateMetadata(): void {
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

<!-- This component does not render any visible HTML -->