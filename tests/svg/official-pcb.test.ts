import { expect, test } from "bun:test"
import { readFile } from "node:fs/promises"
import { parseEasyEdaPcb, renderEasyEdaSvg } from "lib"

test("renders the official EasyEDA Standard PCB", async () => {
  const source = await readFile(
    "tests/fixtures/easyeda-standard-pcb.json",
    "utf8",
  )
  const svg = renderEasyEdaSvg(parseEasyEdaPcb(source), {
    title: "Official EasyEDA Standard PCB",
  })

  expect(svg).toContain('class="easyeda-document easyeda-pcb"')
  expect(svg).toContain('data-easyeda-shape="PAD"')
  await expect(svg).toMatchSvgSnapshot(import.meta.path)
})
