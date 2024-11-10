import * as utils from '@/libs/utils'

export interface AnkiBasicCard {
  type: 'basic'
  deck: string
  tag: string
  model: string
  front: HTMLElement
  back: HTMLElement
}

export interface AnkiClozeCard {
  type: 'cloze'
  deck: string
  tag: string
  model: string
  text: HTMLElement
  back: HTMLElement
}

export type AnkiCard = AnkiBasicCard | AnkiClozeCard
export interface AnkiCards {
  header?: string
  filename?: string
  lines: AnkiCard[]
}

export var csvHeader = `#separator:Tab
#html:true
#tags:Mubu
#columns:牌组名\t模板名\t标签\t问题/划线\t答案/背面额外
#deck column:1
#notetype column:2
#tags column:3
`
export function ankiCardsToString(cards: AnkiCards): string {
  let result = cards.header || csvHeader
  result += '\n'

  for (const line of cards.lines) {
    if (line.type === 'basic') {
      result += `${line.deck}\t${line.model}\t${line.tag}\t${line.front.innerHTML}\t${line.back.innerHTML}\n`
    } else if (line.type === 'cloze') {
      result += `${line.deck}\t${line.model}\t${line.tag}\t${line.text.innerHTML}\t${line.back.innerHTML}\n`
    }
  }
  return result
}

export function baseCsvFileName(prefix: string): string {
  const dateString = new Date().toISOString().slice(0, 10)
  return `${utils.escapeFilename(prefix)}_${dateString}.csv`
}
