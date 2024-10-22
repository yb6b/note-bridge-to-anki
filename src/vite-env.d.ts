/// <reference types="vite/client" />

declare module "*.mdx" {
  import type { Component } from "solid-js"
  const SolidComponent: Component
  export default SolidComponent
}
