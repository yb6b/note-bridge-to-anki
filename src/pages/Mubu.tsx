import {
  ankiCsvToString,
  baseCsvFileName,
  transformMubuToanki,
} from "@/libs/opml"
import { downloadAsFile, readTextFile } from "@/libs/utils"
import { Button, FloatingLabel, Form } from "solid-bootstrap"
import { createSignal } from "solid-js"

export default function Mubu() {
  const [getCsv, setCsv] = createSignal("")

  const onchange = async (e: any) => {
    const files: FileList = e.target.files
    if (files.length === 0) return
    try {
      const opmlText = await readTextFile(files[0])
      const csvText = ankiCsvToString(transformMubuToanki(opmlText))
      setCsv(csvText)
    } catch (e) {
      console.error(e)
      alert("OPML文件读取失败，请检查文件格式")
      return
    }
  }

  return (
    <>
      <h2>幕布转Anki.CSV文件</h2>
      <div class="input-group mb-3">
        <label class="input-group-text" for="inputGroupFile02">
          打开幕布OPML文件
        </label>
        <input
          type="file"
          class="form-control"
          id="inputGroupFile02"
          onchange={onchange}
        />
      </div>
      <FloatingLabel
        label="处理后的CSV文件"
        controlId="floatingTextarea"
        class="mb-3"
      >
        <Form.Control
          as="textarea"
          value={getCsv()}
          style={{ height: "12rem" }}
          wrap="off"
        />
      </FloatingLabel>
      <Button
        variant="primary"
        disabled={!getCsv()}
        onClick={() => {
          downloadAsFile(getCsv(), baseCsvFileName("mubu2anki"))
        }}
      >
        下载
      </Button>
      <p class="text-muted small mt-3">
        你的幕布文档需要按一定规则编写，请参考
        <a
          href="https://mubu.com/doc/3gH3h_wGgCe"
          rel="noopener noreferrer"
          target="_blank"
        >
          学习骇客的设计
        </a>
        。
      </p>
    </>
  )
}
