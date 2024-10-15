import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import mdx from '@mdx-js/rollup';

export default defineConfig({
  plugins: [
    mdx({ jsxImportSource: 'solid-jsx' }),
    solid()],
  base: '',
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
