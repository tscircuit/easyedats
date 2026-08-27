import { expect, test } from "bun:test"
import { parseEasyEdaPcb, renderEasyEdaSvg } from "lib"

test.failing("renders a PCB HOLE diameter as twice its SVG radius", async () => {
  const document = parseEasyEdaPcb(
    JSON.stringify({
      head: "3~1.11.3~",
      shape: ["HOLE~50~50~4~gge-hole"],
      BBox: { x: 40, y: 40, width: 20, height: 20 },
    }),
  )

  const svg = renderEasyEdaSvg(document)

  await expect(svg).toMatchSvgSnapshot(import.meta.path)

  // EasyEDA stores 4 as the diameter, so the SVG radius must be 2.
  expect(svg).toContain('cx="50" cy="50" r="2"')
})
