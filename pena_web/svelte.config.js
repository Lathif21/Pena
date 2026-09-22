import adapter from '@sveltejs/adapter-node'

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter(),
    alias: {
      $features: 'src/features',
      $lib: 'src/lib'
    }
  }
}

export default config
