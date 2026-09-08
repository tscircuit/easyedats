import { expect, test } from "bun:test"
import {
  EasyEdaPcbRectangle,
  EasyEdaShape,
  parseEasyEdaPcb,
  renderEasyEdaSvg,
} from "lib"

test("PCB RECT accessors expose layer and stroke width in EasyEDA field order", () => {
  const shape = EasyEdaShape.parse("RECT~3990~2990~10~10~3~gge25~0~1")
  expect(shape).toBeInstanceOf(EasyEdaPcbRectangle)
  if (!(shape instanceof EasyEdaPcbRectangle)) throw new Error("Expected RECT")

  expect(shape.x).toBe(3990)
  expect(shape.y).toBe(2990)
  expect(shape.width).toBe(10)
  expect(shape.height).toBe(10)
  expect(shape.layerId).toBe(3)
  expect(shape.strokeWidth).toBe(1)
  expect(shape.id).toBe("gge25")
})

test("PCB RECT SVG uses the layer field for color and the line-width field for stroke", () => {
  const document = parseEasyEdaPcb(
    JSON.stringify({
      head: "3~1.11.3~",
      shape: ["RECT~10~20~30~8~3~gge-silk-rect~0~1"],
      BBox: { x: 0, y: 0, width: 50, height: 40 },
    }),
  )

  const svg = renderEasyEdaSvg(document, { title: "PCB RECT layer fields" })

  expect(svg).toContain('data-layer="3"')
  expect(svg).toContain('stroke="#ffcc00"')
  expect(svg).toContain('stroke-width="1"')
  expect(svg).not.toContain('data-layer="1"')
  expect(svg).not.toContain('stroke-width="3"')
})
