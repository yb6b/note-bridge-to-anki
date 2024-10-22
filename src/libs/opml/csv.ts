export interface AnkiCsvLineBasic {
  type: "Basic"
  deck: string
  tag: string
  noteType: string
  front: HTMLElement
  back: HTMLElement
}

export interface AnkiCsvLineCloze {
  type: "Cloze"
  deck: string
  tag: string
  noteType: string
  text: HTMLElement
}

export type AnkiCsvLine = AnkiCsvLineBasic | AnkiCsvLineCloze
export interface AnkiCsv {
  header: string
  lines: AnkiCsvLine[]
}

export function ankiCsvToString(csvObj: AnkiCsv): string {
  let result = `${csvObj.header}\n`

  for (const line of csvObj.lines) {
    if (line.type === "Basic") {
      result += `${line.deck}\t${line.noteType}\t${line.tag}\t${line.front.innerHTML}\t${line.back.innerHTML}\n`
    } else if (line.type === "Cloze") {
      result += `${line.deck}\t${line.noteType}\t${line.tag}\t${line.text.innerHTML}\n`
    }
  }
  return result
}

export function baseCsvFileName(prefix: string): string {
  const dateString = new Date().toISOString().slice(0, 10)
  return `${prefix}_${dateString}.csv`
}
