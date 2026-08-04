import { expect, test } from "bun:test"
import {
  parseEasyEdaPcb,
  parseEasyEdaSchematic,
  renderEasyEdaSvg,
  renderEasyEdaSvgWithDiagnostics,
} from "lib"

const onePixelPng =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="

test("renders safe data images and applies an explicit remote-image policy", async () => {
  const document = parseEasyEdaSchematic(
    JSON.stringify({
      head: "1~1.11.3~",
      shape: [
        `I~10~15~40~20~10~${onePixelPng}~gge-image-data`,
        "I~60~15~30~20~0~https://example.com/board.png~gge-image-remote",
        "I~60~45~30~20~0~javascript:alert(1)~gge-image-script",
        "P~show~0~1~0~0~~gge-pin",
        "FUTURE~preserved~gge-future",
      ],
      BBox: { x: 0, y: 0, width: 100, height: 80 },
    }),
  )

  const result = renderEasyEdaSvgWithDiagnostics(document, {
    title: "Safe embedded images",
  })
  expect(result.svg).toContain(onePixelPng)
  expect(result.svg).not.toContain("https://example.com/board.png")
  expect(result.svg).not.toContain("javascript:")
  expect(result.diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
    "image-source-blocked",
    "image-source-blocked",
    "partial-render",
    "unsupported-shape",
  ])
  expect(result.diagnostics.at(-1)?.documentPath).toEqual(["shape", 4])
  await expect(result.svg).toMatchSvgSnapshot(import.meta.path)

  const remoteAllowed = renderEasyEdaSvg(document, {
    remoteImagePolicy: "allow",
  })
  expect(remoteAllowed).toContain("https://example.com/board.png")
  expect(remoteAllowed).not.toContain("javascript:")
})

test("adds opt-in PCB net highlighting and shape-selection metadata", () => {
  const document = parseEasyEdaPcb(
    JSON.stringify({
      head: "3~1.11.3~",
      shape: [
        "TRACK~1~1~GND~0 0 20 0~gge-ground-track",
        "TRACK~1~1~VCC~0 10 20 10~gge-power-track",
        "PAD~ELLIPSE~10~0~4~4~1~GND~1~0~~0~gge-ground-pad",
      ],
      BBox: { x: 0, y: -5, width: 25, height: 20 },
    }),
  )

  const svg = renderEasyEdaSvg(document, {
    highlightedNets: ["GND"],
    selectedShapeIds: ["gge-ground-pad"],
  })

  expect(svg).toContain('data-easyeda-net="GND"')
  expect(svg).toContain('data-easyeda-net-highlighted="true"')
  expect(svg).toContain('data-easyeda-selected="true"')
  expect(svg).toContain('class="easyeda-selected easyeda-net-highlighted"')
  expect(svg).toContain(".easyeda-net-highlighted")
  expect(svg).not.toContain(
    'data-easyeda-id="gge-power-track" data-easyeda-net="VCC" data-easyeda-net-highlighted',
  )
})
