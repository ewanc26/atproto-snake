// Vite config — Tailwind v4, SvelteKit, devtools JSON plugin
import devtoolsJson from 'vite-plugin-devtools-json';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			alias: { $lib: 'src/lib' },
			preprocess: vitePreprocess(),
			adapter: adapter({ runtime: 'nodejs22.x' })
		}),
		devtoolsJson()
	],
	server: {
		host: '127.0.0.1',
		port: 5173
	}
});
