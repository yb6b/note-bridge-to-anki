import Navbar from "@/layouts/Navbar"
import { ErrorBoundary, lazy } from "solid-js"

import { HashRouter, Route } from "@solidjs/router"

const Mubu = lazy(() => import("@/pages/Mubu.tsx"))
const DemoMd = lazy(() => import("@/pages/docs.mdx"))

export default function App() {
  return (
    <>
      <HashRouter root={Navbar}>
        <Route path="/" component={Mubu} />
        <Route path="/docs" component={DemoMd} />
      </HashRouter>
    </>
  )
}
