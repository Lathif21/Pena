import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
	resolve: {
		alias: {
			$features: path.resolve('./src/features'),
			$lib: path.resolve('./src/lib')
		}
	},
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// Target deploy: satu VPS Ubuntu, dijalankan sebagai `node build/index.js`
			// di balik reverse proxy. Adapter dibaca dari sini, bukan svelte.config.js.
			adapter: adapter()
		})
	]
});
