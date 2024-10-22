import * as utils from "@/libs/utils"
import type { AnkiCsv, AnkiCsvLineBasic, AnkiCsvLineCloze } from "./csv"

export type ClozeTypes = "yellow" | "underline" | "mark" | "bold" | "delete"

export interface MubuToAnkiOptions {
  clozeStyle?: ClozeTypes[]
  clozeOrder?: "for" | "back" | "random" | "same"
}

const csvHeader = `#separator:Tab
#html:true
#tags:Mubu
#columns:牌组名\t模板名\t标签\t问题/划线\t答案/背面额外
#deck column:1
#notetype column:2
#tags column:3
`

/** 
借鉴学习骇客的设计，但代码重新实现
@link https://mubu.com/doc/3gH3h_wGgCe

幕布的opml格式大致如下：
```xml
<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>mubu2anki 范文</title>
  </head>
  <body>
    <outline text="极简示范" _mubu_text="<🙈……>" _note="" _mubu_note="">
      <outline text="第01章" _mubu_text="%3Cspan%3E%E7%AC%AC01%E7%AB%A0%3C/span%3E" _note="" _mubu_note="">
        <outline text="第01节" _mubu_text="%3Cspan%3E%E7%AC%AC01%E8%8A%82%3C/span%3E" _note="" _mubu_note="">
          <outline text="这里是问题？？" _mubu_text="<🙈……>" _note="" _mubu_note="">
            <outline text="这里是答案1" _mubu_text="<🙈……>" _note="" _mubu_note=""/>
          </outline>
        </outline>
      </outline>
    </outline>
  </body>
</opml>
```

而转出的anki所用的Document形如：

```json
{
 "header": "#seperator:Tab\n#tags:MB",
 "lines": [
   {
     "type": "Basic",
     "front": <Document object>,
     "back": <Document object>,
     "backExtra": <Document object>,
     "deck": "a",
     "tag": "b"
   },
   {
     "type": "Cloze",
     "text": <Document object>,
     "deck": "a",
     "tag": "b"
   }
 ]
}
```
 */
export function transformMubuToanki(opmlContent: string): AnkiCsv {
  const opmlDocument = utils.xmlStringToXmlDocument(opmlContent)
  removeCompletedOutlines(opmlDocument)

  const ankiCsv: AnkiCsv = {
    header: csvHeader,
    lines: [],
  }
  utils.selectorAllForEach(
    opmlDocument,
    "body>outline>outline>outline>outline",
    (node) => {
      if (isBasic(node)) {
        const basicCsvItem: AnkiCsvLineBasic = {
          type: "Basic",
          deck: "掌握",
          noteType: "问答题",
          tag: getTagFromParent(node),
          front: transformOutline(node),
          back: transformOutlineChildren(node),
        }
        basicCsvItem.tag +=
          getTagFromTagNodes(basicCsvItem.front) +
          getTagFromTagNodes(basicCsvItem.back)

        ankiCsv.lines.push(basicCsvItem)
        return
      }
      // 其余的都是划线或阅读题
      const clozeCsvItem: AnkiCsvLineCloze = {
        type: "Cloze",
        deck: "了解",
        noteType: "填空题",
        tag: getTagFromParent(node),
        text: transformOutline(node),
      }
      clozeCsvItem.tag += getTagFromTagNodes(clozeCsvItem.text)
      ankiCsv.lines.push(clozeCsvItem)

      // TODO: 填空题的格式
    },
  )
  return ankiCsv
}

function removeCompletedOutlines(opmlDocument: XMLDocument) {
  utils.selectorAllForEach(opmlDocument, 'outline[_completed="true"]', (node) =>
    node.remove(),
  )
}

/**
 * 按照 `_mubu_text` `_mubu_note` `_mubu_images` 的顺序解析Html并组合成列表
 */
function transformOutline(opmlNode: Element) {
  const handleAttrbute = (attributeName: string) => {
    let raw = opmlNode.getAttribute(attributeName)
    if (!raw) return null

    // 幕布转义了几个属性
    raw = utils.decodeUriComponent(raw)

    const tmpHtml = utils.createElement("div")
    tmpHtml.className = attributeName
    tmpHtml.innerHTML = raw
    return tmpHtml
  }

  const result = utils.createElement("p")
  // biome-ignore lint:FP style
  ;["_mubu_text", "_mubu_note", "_mubu_images"]
    .map(handleAttrbute)
    .filter(Boolean)
    //@ts-ignore
    .forEach((e) => result.appendChild(e))

  transformFormula(result)
  transformImg(result)
  return result
}

function transformOutlineChildren(parentNode: Element) {
  const children = parentNode.childNodes
  const result = utils.createElement("article")
  for (const node of children) {
    if (node.nodeType === Node.TEXT_NODE) continue
    const htmlNode = transformOutline(node as Element)
    if (!htmlNode) continue
    result.appendChild(htmlNode)
  }
  return result
}

function transformFormula(node: HTMLElement) {
  utils.selectorAllForEach(
    node as unknown as Document,
    "span.formula",
    (formulaNode) => {
      let formulaDataRaw = formulaNode.getAttribute("data-raw")
      if (!formulaDataRaw) return
      formulaDataRaw = utils.decodeUriComponent(formulaDataRaw)
      const ankiMathjax = utils.createElement("anki-mathjax")
      ankiMathjax.textContent = formulaDataRaw
      formulaNode.replaceWith(ankiMathjax)
    },
  )
}

function transformImg(node: HTMLElement) {
  utils.selectorAllForEach(
    //@ts-ignore
    node,
    "div._mubu_images",
    (divNode) => {
      // [{"id":"U1dqnR9LJD",
      //   "oh":1169,
      //   "ow":1708,
      //   "uri":"document_image/12558_07867727-736a-430e-f99c-8650adbbb213.png",
      //   "w":400}]
      const imageDataSrc = divNode.getAttribute("_mubu_images")
      if (!imageDataSrc) return

      let imageData: object[]
      try {
        imageData = JSON.parse(imageDataSrc)
        //@ts-ignore validate Json schema
        imageData[0].uri.charAt()
      } catch (error) {
        return
      }
      divNode.innerHTML = ""
      for (const image of imageData) {
        //@ts-ignore
        const { uri, w } = image
        const mubuImgeUrl = `https://api2.mubu.com/v3/${uri}`
        const imgNode = document.createElement("img")
        imgNode.setAttribute("src", mubuImgeUrl)
        imgNode.className = "document_image"
        if (w) imgNode.width = w
        divNode.appendChild(imgNode)
      }
    },
  )
}

/** 获取节点本身的标签，需要_mubu_text解析后的文档 */
function getTagFromTagNodes(node: HTMLElement) {
  let result = ""
  utils.selectorAllForEach(node, "span.tag", (tagNode) => {
    const tag = tagNode.textContent
    if (tag && tag[0] === "#") {
      result += ` ${tag.slice(1)}`
    }
  })
  return result
}

/** 根据opml节点的层级获取标签 */
function getTagFromParent(node: Element) {
  const result = ["A0TAG", "", "", ""]
  let tmpNode: Node | null = node
  for (let i = 0; i < 3; i++) {
    tmpNode = tmpNode.parentNode
    if (!tmpNode) throw new SyntaxError("幕布OPML文件需要至少4个层级")
    //@ts-ignore
    result[3 - i] = tmpNode.getAttribute("text")?.replace(/\s/g, "") || ""
  }
  return result.join("::")
}

/** 该Outline节点是问答题类型 */
function isBasic(opmlNode: Element) {
  const text = opmlNode.getAttribute("text")
  if (!text) return false
  return (
    (text.includes("??") || text.includes("？？")) && opmlNode.hasChildNodes()
  )
}
