import { expect, test } from "bun:test"
import { parseEasyEdaPcb, renderEasyEdaSvg } from "lib"

const source = JSON.stringify({
  head: { docType: "3", editorVersion: "6.5.38" },
  canvas:
    "CA~100~100~#000000~yes~#FFFFFF~10~100~100~line~1~mm~1~45~visible~1~0~0~0~yes",
  layers: [
    "3~TopSilkLayer~#FFCC00~true~false~true",
    "19~3DModel~#66CCFF~false~false~false",
  ],
  shape: [
    `SVGNODE~${JSON.stringify({
      gId: "gge-visible",
      nodeName: "path",
      nodeType: 1,
      layerid: "3",
      attrs: {
        d: "M 10 10 L 90 10 L 50 80 Z",
        href: "javascript:alert(1)",
        id: "gge-visible",
        onclick: "alert(1)",
        stroke: "none",
        style: "fill: red",
      },
    })}`,
    `SVGNODE~${JSON.stringify({
      gId: "gge-group",
      nodeName: "g",
      nodeType: 1,
      layerid: "3",
      attrs: { id: "gge-group" },
      childNodes: [
        null,
        "not-an-element",
        {
          nodeName: "path",
          nodeType: 1,
          attrs: {
            d: "M 20 20 L 80 20",
            fill: "url(https://example.com/paint)",
            stroke: "#00FF00",
          },
        },
        {
          nodeName: "script",
          nodeType: 1,
          textContent: "alert(1)",
        },
        {
          nodeName: "text",
          nodeType: 1,
          attrs: { x: "25", y: "40" },
          textContent: "Safe <artwork> & text",
        },
      ],
    })}`,
    `SVGNODE~${JSON.stringify({
      gId: "gge-hidden-outline",
      nodeName: "g",
      nodeType: 1,
      layerid: "19",
      attrs: { id: "gge-hidden-outline" },
      childNodes: [
        {
          nodeName: "polyline",
          nodeType: 1,
          attrs: { fill: "none", points: "10 90 90 90" },
        },
      ],
    })}`,
  ],
  BBox: { x: 0, y: 0, width: 100, height: 100 },
})

test("safely renders supported SVG node trees", async () => {
  const document = parseEasyEdaPcb(source)
  const svg = renderEasyEdaSvg(document, { title: "SVG node artwork" })

  expect(svg).toContain('data-easyeda-shape="SVGNODE"')
  expect(svg).toContain('data-easyeda-node="path"')
  expect(svg).toContain('fill="#FFCC00"')
  expect(svg).toContain("Safe &lt;artwork&gt; &amp; text")
  expect(svg).not.toContain("gge-hidden-outline")
  expect(svg).not.toContain("onclick")
  expect(svg).not.toContain("javascript:")
  expect(svg).not.toContain("style=")
  expect(svg).not.toContain("url(")
  expect(svg).not.toContain("<script")
  await expect(svg).toMatchSvgSnapshot(import.meta.path)

  const withHiddenLayers = renderEasyEdaSvg(document, {
    showHiddenLayers: true,
  })
  expect(withHiddenLayers).toContain("gge-hidden-outline")
  expect(withHiddenLayers).toContain('stroke="#66CCFF"')
})
