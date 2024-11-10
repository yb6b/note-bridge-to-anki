import { defineStore, acceptHMRUpdate } from 'pinia'
import * as utils from '@/libs/utils'
import * as basicCards from '@/libs/basic-cards'

//#region 定义选项

// 区分问答题和挖空题的策略
export const distinguishStrategies = [
  {
    title: '问答题的题目以两个问号结尾（不限中英文问号）??',
    value: 'question',
  },
  {
    title: '全部看作问答题，不生成挖空题',
    value: 'basic',
  },
  {
    title: '尝试识别成挖空题，无法识别的当作问答题',
    value: 'cloze',
  },
] as const

export type DistinguishStrategy =
  (typeof distinguishStrategies)[number]['value']

export const multipleClozeStrategies = [
  { title: '合并成单个挖空题 {{c1::foo}} {{c1::bar}}', value: 'single' },
  { title: '生成多个挖空题 {{c1::foo}} {{c2::bar}}', value: 'multiple' },
] as const

export type MultipleClozeStrategy =
  (typeof multipleClozeStrategies)[number]['value']

export const clozeSourceFormatColors = [
  ['红', 'red'],
  ['黄', 'yellow'],
  ['蓝', 'blue'],
  ['绿', 'green'],
  ['紫', 'purple'],
] as const
export type ClozeColors = (typeof clozeSourceFormatColors)[number][1]

export const clozeSourceFormatDecorations = [
  ['加粗', 'bold', 'font-weight-bold', 'b, .bold'],
  ['斜体', 'italic', 'font-italic', 'i, .italic'],
  [
    '下划线',
    'underline',
    'text-decoration-underline',
    '.zm span.underline,.zm u',
  ],
  ['删除线', 'strike', 'text-decoration-line-through', 'del, .strikethrough'],
  ['高亮', 'highlight', 'bg-yellow-accent-2', 'mark, .highlight-yellow'],
] as const
export type ClozeDecorations = (typeof clozeSourceFormatDecorations)[number][1]
const decorationMapToSelector = new Map(
  clozeSourceFormatDecorations.map(v => [v[1], v[3]]),
)

//#endregion

//#region 定义Store

export interface MubuOpmlState {
  /** 文件内容 */
  text: string
  /** 文件名 */
  filename: string
  /** opml 对象 */
  xml: XMLDocument | null
  /** 解析后的卡片 */
  cards: basicCards.AnkiCards | null
  /** 从第几层开始解析 */
  depth: number
  // TODO: 从文件名和历史记录推测
  /** 选中的卡组 */
  deck: string
  /** 标签来源 */
  tags: { parent: boolean; mubuTags: boolean }
  /** 问答题的卡牌模板 */
  basicM: string
  /** 区分问答题和挖空题的策略  */
  disting: DistinguishStrategy
  /** 挖空题的卡牌模板 */
  clozeM: string
  /** 如何处理一题多挖空？ */
  multiCloze: MultipleClozeStrategy
  /** 哪些部分看作挖空？(颜色) */
  color: ClozeColors[]
  /** 哪些部分看作挖空？(排版) */
  decoration: ClozeDecorations[]
}

export const useMubuOpmlStore = defineStore('mubu_opml_config', {
  state: (): MubuOpmlState => ({
    text: '',
    filename: '',
    xml: null,
    cards: null,
    depth: 4,
    deck: '',
    tags: { parent: true, mubuTags: true },
    basicM: '',
    disting: 'cloze',
    clozeM: '',
    multiCloze: 'single',
    color: clozeSourceFormatColors.map(v => v[1]),
    decoration: clozeSourceFormatDecorations.map(v => v[1]),
  }),
  getters: {
    /** 已经读取到了文件 */
    ok(): boolean {
      return this.text.length > 0
    },
    baseName(): string {
      return utils.escapeFilename(
        this.cards?.filename || utils.baseFilename(this.filename),
      )
    },
    count(): number {
      return this.cards?.lines.length || 0
    },
  },
  actions: {
    /** 清除临时数据 */
    clean() {
      this.xml = null
      this.filename = ''
      this.text = ''
      this.cards = null
      this.deck = ''
    },

    /**
     * 读取File对象，判断格式是否正确.
     * 如果正确解析, 返回void, 否则返回错误消息string
     */
    async read(file: File) {
      if (!file.name.toLowerCase().endsWith('.opml')) {
        this.clean()
        return '请选择 *.opml 文件'
      }
      const text = await utils.readFileAsText(file)
      try {
        this.xml = utils.xmlStringToXmlDocument(text)
        validateOpml(this.xml)
        this.text = text
        this.filename = file.name
        this.deck = this.baseName
      } catch (error) {
        if (error instanceof Error) {
          this.clean()
          return error.message
        }
      }
    },
    /** 根据配置,提取卡片数据 */
    extract() {
      const { xml } = this
      if (!xml) {
        throw new Error('请先读取文件')
      }
      const result: basicCards.AnkiCards = {
        header: basicCards.csvHeader,
        filename: extractFilename(xml),
        lines: [],
      }
      for (const matchNode of scanXml(xml, this.depth)) {
        const question = transformOutline(matchNode)
        const children = transformChildrenOutlines(matchNode)

        const card: basicCards.AnkiCard = isClozeQuestion(question, this)
          ? makeClozeCard(question, children, this)
          : makeBasicCard(question, children, this)

        card.tag = extractTags(this, matchNode)
        result.lines.push(card)
      }

      this.cards = result
      return result
    },

    /** 生成 AnkiCsv 的字符串 */
    csvStr(): string {
      let { cards } = this
      if (!cards) {
        cards = this.extract()
      }
      return basicCards.ankiCardsToString(cards)
    },

    /** 发送到Anki软件 */
    async send() {
      if (!this.cards) return
      // 检查deck是否存在
      utils.createDeck(this.deck)
      //  检查model是否存在

      try {
        await utils.yanki.note.addNotes({
          notes: this.cards.lines.map(c => {
            const fields: Record<string, string> =
              c.type === 'basic'
                ? { front: c.front.innerHTML, back: c.back.innerHTML }
                : { text: c.text.innerHTML, back: c.back.innerHTML }
            return {
              deckName: this.deck,
              modelName: c.model,
              fields,
            }
          }),
        })
      } catch (e) {
        if (e instanceof Error) {
          if (e.message.includes('duplicate')) {
            return
          }
        }
      }
    },
  },
  persist: {
    omit: ['filename', 'xml', 'text', 'cards'],
  },
})
//#endregion

//#region 方法实现

function extractFilename(xml: XMLDocument) {
  const titleNode = xml.querySelector('head > title')
  let title = titleNode?.textContent || 'Mubu'
  return basicCards.baseCsvFileName(title)
}

function* scanXml(xml: XMLDocument, depth: number) {
  let selector = 'body'
  for (let i = 0; i < depth; i++) {
    selector += '>outline'
  }
  const nodes = utils.selectorAll(xml, selector)
  for (const node of nodes) {
    yield node
  }
}

function validateOpml(xml: XMLDocument) {
  const querySelectors = [
    'opml > head > title',
    'opml > body > outline',
    'outline[text]',
  ]
  for (const selector of querySelectors) {
    if (!utils.hasQueryElement(xml, selector))
      throw new TypeError('OPML文件格式错误')
  }
}

//#region 提取标签

function extractTags(state: MubuOpmlState, card: Element) {
  let tags = ''
  if (state.tags.parent) {
    tags += getTagsFromParent(card, state.depth)
  }
  if (state.tags.mubuTags) {
    // 会添加两种标签之间的空格
    tags += getTagsFromMubu(card)
  }
  return tags.trim()
}

function getTagsFromParent(node: Element, depth: number): string {
  const parentCount = depth - 1
  const result = Array(parentCount).map(() => '')
  let tmpNode: Node | null = node
  for (let i = 0; i < parentCount; i++) {
    tmpNode = tmpNode.parentNode
    if (!tmpNode) throw new SyntaxError(`幕布OPML文件需要至少${depth}个层级`)
    result[parentCount - i - 1] =
      //@ts-ignore
      tmpNode.getAttribute('text')?.replace(/\s/g, '_') || ''
  }
  return result.join('::')
}

function getTagsFromMubu(node: Element) {
  let result = ''
  utils.selectorAllForEach(node, 'span.tag', tagNode => {
    const tag = tagNode.textContent
    if (tag && tag[0] === '#') {
      result += ` ${tag.slice(1)}`
    }
  })
  return result
}

//#endregion

//#region 转换Outline元素

function transformChildrenOutlines(parentNode: Element) {
  const children = parentNode.childNodes
  const result = utils.createElement('article')
  for (const node of children) {
    if (node.nodeType === Node.TEXT_NODE) continue
    const htmlNode = transformOutline(node as Element)
    if (!htmlNode) continue
    if (node.hasChildNodes()) {
      htmlNode.appendChild(transformChildrenOutlines(node as Element))
    }
    result.appendChild(htmlNode)
  }
  return result
}

function transformOutline(outlineNode: Element): HTMLElement {
  const handleAttrbute = (attributeName: string) => {
    let raw = outlineNode.getAttribute(attributeName)
    if (!raw) return null

    // 幕布转义了几个属性
    raw = utils.decodeUriComponent(raw)

    const tmpHtml = utils.createElement('div')
    tmpHtml.className = attributeName
    tmpHtml.innerHTML = raw
    return tmpHtml
  }
  const result = utils.createElement('p')
  // biome-ignore lint:FP style
  ;['_mubu_text', '_mubu_note', '_mubu_images']
    .map(handleAttrbute)
    .filter(Boolean)
    //@ts-ignore
    .forEach(e => result.appendChild(e))

  transformFormula(result)
  transformImg(result)
  return result
}

function transformFormula(node: HTMLElement) {
  utils.selectorAllForEach(
    node as unknown as Document,
    'span.formula',
    formulaNode => {
      let formulaDataRaw = formulaNode.getAttribute('data-raw')
      if (!formulaDataRaw) return
      formulaDataRaw = utils.decodeUriComponent(formulaDataRaw)
      const ankiMathjax = utils.createElement('anki-mathjax')
      ankiMathjax.textContent = formulaDataRaw
      formulaNode.replaceWith(ankiMathjax)
    },
  )
}

function transformImg(node: HTMLElement) {
  utils.selectorAllForEach(
    //@ts-ignore
    node,
    'div._mubu_images',
    divNode => {
      // [{"id":"U1dqnR9LJD",
      //   "oh":1169,
      //   "ow":1708,
      //   "uri":"document_image/12558_07867727-736a-430e-f99c-8650adbbb213.png",
      //   "w":400}]
      const imageDataSrc = divNode.getAttribute('_mubu_images')
      if (!imageDataSrc) return

      let imageData: object[]
      try {
        imageData = JSON.parse(imageDataSrc)
        //@ts-ignore validate Json schema
        imageData[0].uri.charAt()
      } catch (error) {
        return
      }
      divNode.innerHTML = ''
      for (const image of imageData) {
        //@ts-ignore
        const { uri, w } = image
        const mubuImgeUrl = `https://api2.mubu.com/v3/${uri}`
        const imgNode = utils.createElement('img') as HTMLImageElement
        imgNode.setAttribute('src', mubuImgeUrl)
        imgNode.className = 'document_image'
        if (w) imgNode.width = w
        divNode.appendChild(imgNode)
      }
    },
  )
}
//#endregion

//#region 制卡

function isClozeQuestion(question: HTMLElement, state: MubuOpmlState) {
  switch (state.disting) {
    case 'question': {
      let text = question.textContent
      if (!text) return false
      text = text.trim()
      return !(text.endsWith('??') || text.endsWith('？？'))
    }
    case 'cloze': {
      //  尝试识别成挖空题，无法识别的当作问答题
      return hasClozeNodes(question, state)
    }
    case 'basic': {
      // 全部看作问答题，不生成挖空题
      return false
    }
    default:
      let _: never
  }
}

function hasClozeNodes(node: HTMLElement, state: MubuOpmlState) {
  for (const color of state.color) {
    if (utils.hasQueryElement(node, `span.text-color-${color}`)) return true
  }
  for (const decoration of state.decoration) {
    const selector = decorationMapToSelector.get(decoration)!
    if (utils.hasQueryElement(node, selector)) return true
  }
  return false
}

/** @throws {Error} 无法识别的挖空题 */
function makeClozeCard(
  question: HTMLElement,
  children: HTMLElement,
  state: MubuOpmlState,
) {
  let count = 1

  const changeNode = (node: Element) => {
    const innerHTML = node.innerHTML
    node.innerHTML = `{{c${count}::${innerHTML}}}`
    if (state.multiCloze === 'multiple') count++
  }

  for (const color of state.color) {
    utils.selectorAllForEach(question, `span.text-color-${color}`, changeNode)
  }

  for (const decoration of state.decoration) {
    const selector = decorationMapToSelector.get(decoration)
    if (!selector) continue
    utils.selectorAllForEach(question, selector, changeNode)
  }

  const clozeCard: basicCards.AnkiClozeCard = {
    type: 'cloze',
    deck: state.deck,
    model: state.clozeM,
    text: question,
    back: children,
    tag: '',
  }
  return clozeCard
}

function makeBasicCard(
  question: HTMLElement,
  children: HTMLElement,
  state: MubuOpmlState,
) {
  const result: basicCards.AnkiBasicCard = {
    type: 'basic',
    deck: state.deck,
    model: state.basicM,
    front: question,
    back: children,
    tag: '',
  }
  return result
}

//#endregion

//#endregion

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useMubuOpmlStore, import.meta.hot))
}
