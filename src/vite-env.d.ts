/// <reference types="vite/client" />

declare module '*.md' {
  import type { Component } from 'solid-js'
  const SolidComponent: Component
  export default SolidComponent
}
