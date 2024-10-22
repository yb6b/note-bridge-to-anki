import { defineConfig } from "vite"
import solid from "vite-plugin-solid"
import mdx from "@mdx-js/rollup"
import rehypeHighlight from "rehype-highlight"

export default defineConfig({
  plugins: [
    mdx({
      jsxImportSource: "solid-jsx",
      //jsx: true,
      rehypePlugins: [rehypeHighlight],
      baseUrl: "/note-bridge-to-anki",
    }),
    solid(),
  ],
  base: "/note-bridge-to-anki",
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  build: {
    rollupOptions: {
      external: ["open"],
    },
  },
})
