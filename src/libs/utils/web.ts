export const xmlStringToXmlDocument = (xml: string) =>
  parseDocumentFromString(xml, "text/xml")
export const htmlStringToHtmlDocument = (html: string) =>
  parseDocumentFromString(html, "text/html")

function parseDocumentFromString(
  xml: string,
  type: DOMParserSupportedType,
): Document {
  const parser = new DOMParser()
  const result = parser.parseFromString(xml, type)
  if (result.getElementsByTagName("parsererror").length === 1) {
    throw new SyntaxError(
      `Invalid XML: ${result.querySelector("parsererror div")?.textContent}`,
    )
  }
  return result
}

// 从File对象中读取文件内容
export function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      resolve(reader.result as string)
    }
    reader.onerror = (event) => {
      reject(event)
    }
    reader.readAsText(file)
  })
}

export function downloadAsFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
  const href = URL.createObjectURL(blob)
  const linkElement = document.createElement("a")
  linkElement.href = href
  linkElement.download = filename
  linkElement.click()
  URL.revokeObjectURL(linkElement.href)
}

export function decodeHtmlEntities(str: string): string {
  const element = document.createElement("div")
  element.innerHTML = str
  return element.textContent || ""
}

export const selectorAll = (node: Element | Document, selectors: string) =>
  node.querySelectorAll(selectors)

export function selectorAllForEach(
  homeNode: Element | Document,
  selectors: string,
  handler: (element: Element) => unknown,
) {
  const nodes = selectorAll(homeNode, selectors)
  if (nodes.length === 0) return
  for (const node of nodes) {
    handler(node)
  }
}

export const decodeUriComponent = (str: string) => decodeURIComponent(str)

export const createElement = (tagName: string) =>
  document.createElement(tagName)
