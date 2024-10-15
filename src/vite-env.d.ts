/// <reference types="vite/client" />

declare module '*.md' {
    import type { Component } from 'solid-js'
    const Component: Component
    export default Component
}
