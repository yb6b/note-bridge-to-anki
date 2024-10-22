/* @refresh reload */
import { render } from "solid-js/web"
import "highlight.js/styles/atom-one-light.css"

import App from "./App"

const root = document.getElementById("root")

render(() => <App />, root!)
