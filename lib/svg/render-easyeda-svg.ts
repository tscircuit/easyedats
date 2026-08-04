import {
  type EasyEdaDocument,
  type EasyEdaJsonValue,
  EasyEdaSchematicList,
} from "../document"
import type { EasyEdaPoint } from "../entities/field-helpers"
import { EasyEdaLibrary } from "../entities/library"
import type { EasyEdaShape } from "../entities/shape"
import { EasyEdaSvgNode, type EasyEdaSvgNodeData } from "../entities/svg-node"

export interface EasyEdaSvgOptions {
  backgroundColor?: string
  height?: number
  padding?: number
  schematicIndex?: number
  showHiddenLayers?: boolean
  title?: string
  width?: number
}

interface SvgBounds {
  x: number
  y: number
  width: number
  height: number
}

interface RenderContext {
  document: EasyEdaDocument
  layerColors: Map<number, string>
  hiddenLayers: Set<number>
  showHiddenLayers: boolean
}

const DEFAULT_PCB_LAYER_COLORS = new Map<number, string>([
  [1, "#ff4d4d"],
  [2, "#4d79ff"],
  [3, "#ffcc00"],
  [4, "#66cc33"],
  [10, "#ff4dff"],
  [11, "#c0c0c0"],
  [12, "#ffffff"],
])

const SAFE_SVG_NODE_NAMES = new Set([
  "circle",
  "ellipse",
  "g",
  "line",
  "path",
  "polygon",
  "polyline",
  "rect",
  "text",
  "tspan",
])

const SAFE_SVG_NODE_ATTRIBUTES = new Map<string, string>([
  ["class", "class"],
  ["cx", "cx"],
  ["cy", "cy"],
  ["d", "d"],
  ["dominant-baseline", "dominant-baseline"],
  ["dominantBaseline", "dominant-baseline"],
  ["fill", "fill"],
  ["fill-opacity", "fill-opacity"],
  ["fill-rule", "fill-rule"],
  ["fillOpacity", "fill-opacity"],
  ["fillRule", "fill-rule"],
  ["font-family", "font-family"],
  ["font-size", "font-size"],
  ["font-style", "font-style"],
  ["font-weight", "font-weight"],
  ["fontFamily", "font-family"],
  ["fontSize", "font-size"],
  ["fontStyle", "font-style"],
  ["fontWeight", "font-weight"],
  ["height", "height"],
  ["id", "id"],
  ["opacity", "opacity"],
  ["pathLength", "pathLength"],
  ["points", "points"],
  ["r", "r"],
  ["rx", "rx"],
  ["ry", "ry"],
  ["stroke", "stroke"],
  ["stroke-dasharray", "stroke-dasharray"],
  ["stroke-dashoffset", "stroke-dashoffset"],
  ["stroke-linecap", "stroke-linecap"],
  ["stroke-linejoin", "stroke-linejoin"],
  ["stroke-miterlimit", "stroke-miterlimit"],
  ["stroke-opacity", "stroke-opacity"],
  ["stroke-width", "stroke-width"],
  ["strokeDasharray", "stroke-dasharray"],
  ["strokeDashoffset", "stroke-dashoffset"],
  ["strokeLinecap", "stroke-linecap"],
  ["strokeLinejoin", "stroke-linejoin"],
  ["strokeMiterlimit", "stroke-miterlimit"],
  ["strokeOpacity", "stroke-opacity"],
  ["strokeWidth", "stroke-width"],
  ["text-anchor", "text-anchor"],
  ["textAnchor", "text-anchor"],
  ["transform", "transform"],
  ["vector-effect", "vector-effect"],
  ["vectorEffect", "vector-effect"],
  ["width", "width"],
  ["x", "x"],
  ["x1", "x1"],
  ["x2", "x2"],
  ["y", "y"],
  ["y1", "y1"],
  ["y2", "y2"],
])

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
}

function number(value: string | number | undefined): number | undefined {
  if (value === undefined || value === "") return undefined
  const parsed = Number.parseFloat(String(value))
  return Number.isFinite(parsed) ? parsed : undefined
}

function formatNumber(value: number): string {
  if (Object.is(value, -0)) return "0"
  return Number(value.toFixed(6)).toString()
}

function pointString(points: readonly EasyEdaPoint[]): string {
  return points
    .map(({ x, y }) => `${formatNumber(x)},${formatNumber(y)}`)
    .join(" ")
}

function parsePointList(value: string | undefined): EasyEdaPoint[] {
  if (!value) return []
  const values = value.trim().split(/[ ,]+/).map(Number)
  if (values.length < 2 || values.some((item) => !Number.isFinite(item))) {
    return []
  }

  const result: EasyEdaPoint[] = []
  for (let index = 0; index + 1 < values.length; index += 2) {
    result.push({ x: values[index] ?? 0, y: values[index + 1] ?? 0 })
  }
  return result
}

function color(value: string | undefined, fallback: string): string {
  if (!value || value === "none" || value === "transparent") return fallback
  return value
}

function fill(value: string | undefined): string {
  if (!value || value === "none" || value === "transparent") return "none"
  return value
}

function shapeAttributes(shape: EasyEdaShape): string {
  const id = shape.getString().match(/(?:gge|frame_)[A-Za-z0-9_-]+/)?.[0]
  return `data-easyeda-shape="${escapeXml(shape.token)}"${id ? ` data-easyeda-id="${escapeXml(id)}"` : ""}`
}

function strokeFields(
  fields: readonly string[],
  startIndex: number,
  fallback = "#880000",
): { color: string; width: number } {
  for (let index = startIndex; index < fields.length; index += 1) {
    const value = fields[index]
    if (value?.startsWith("#") || value?.startsWith("rgb")) {
      return {
        color: value,
        width: number(fields[index + 1]) ?? 1,
      }
    }
  }
  return { color: fallback, width: 1 }
}

function layerColor(
  context: RenderContext,
  layerId: number | undefined,
): string {
  if (layerId === undefined) return "#c0c0c0"
  return (
    context.layerColors.get(layerId) ??
    DEFAULT_PCB_LAYER_COLORS.get(layerId) ??
    "#c0c0c0"
  )
}

function isLayerVisible(
  context: RenderContext,
  layerId: number | undefined,
): boolean {
  return (
    context.showHiddenLayers ||
    layerId === undefined ||
    !context.hiddenLayers.has(layerId)
  )
}

function svgNodeLayerId(value: unknown): number | undefined {
  return typeof value === "string" || typeof value === "number"
    ? number(value)
    : undefined
}

function isSafeSvgNodeAttributeValue(value: string): boolean {
  return !/url\s*\(|javascript\s*:|data\s*:/i.test(value)
}

function renderSvgNodeData(
  value: unknown,
  context: RenderContext,
  inheritedLayerId: number | undefined,
  rootAttributes = "",
  depth = 0,
): string | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value) || depth > 64)
    return undefined
  const node = value as EasyEdaSvgNodeData
  if (
    typeof node.nodeName !== "string" ||
    !SAFE_SVG_NODE_NAMES.has(node.nodeName) ||
    (node.nodeType !== undefined && node.nodeType !== 1)
  ) {
    return undefined
  }

  const sourceAttributes =
    node.attrs && typeof node.attrs === "object" && !Array.isArray(node.attrs)
      ? node.attrs
      : {}
  const layerId =
    svgNodeLayerId(node.layerid) ??
    svgNodeLayerId(sourceAttributes.layerid) ??
    inheritedLayerId
  if (!isLayerVisible(context, layerId)) return undefined

  const attributes: string[] = []
  const emittedAttributes = new Map<string, string>()
  for (const [sourceName, sourceValue] of Object.entries(sourceAttributes)) {
    const attributeName = SAFE_SVG_NODE_ATTRIBUTES.get(sourceName)
    if (
      !attributeName ||
      (typeof sourceValue !== "string" &&
        typeof sourceValue !== "number" &&
        typeof sourceValue !== "boolean")
    ) {
      continue
    }
    const value = String(sourceValue)
    if (!isSafeSvgNodeAttributeValue(value)) continue
    emittedAttributes.set(attributeName, value)
  }

  const fillValue = emittedAttributes.get("fill")
  const strokeValue = emittedAttributes.get("stroke")
  const defaultColor = layerColor(context, layerId)
  if (
    (node.nodeName === "line" || node.nodeName === "polyline") &&
    strokeValue === undefined
  ) {
    emittedAttributes.set("stroke", defaultColor)
    if (fillValue === undefined) emittedAttributes.set("fill", "none")
  } else if (fillValue === "none" && strokeValue === undefined) {
    emittedAttributes.set("stroke", defaultColor)
  } else if (
    fillValue === undefined &&
    (strokeValue === undefined || strokeValue === "none") &&
    node.nodeName !== "g"
  ) {
    emittedAttributes.set("fill", defaultColor)
  }

  if (rootAttributes) attributes.push(rootAttributes)
  attributes.push(`data-easyeda-node="${escapeXml(node.nodeName)}"`)
  if (layerId !== undefined) {
    attributes.push(`data-layer="${formatNumber(layerId)}"`)
  }
  for (const [name, value] of emittedAttributes) {
    attributes.push(`${name}="${escapeXml(value)}"`)
  }

  const children = Array.isArray(node.childNodes)
    ? node.childNodes
        .map((child) =>
          renderSvgNodeData(child, context, layerId, "", depth + 1),
        )
        .filter((child): child is string => child !== undefined)
    : []
  const text =
    (node.nodeName === "text" || node.nodeName === "tspan") &&
    typeof node.textContent === "string"
      ? escapeXml(node.textContent)
      : ""
  const content = `${text}${children.join("")}`
  const startTag = `<${node.nodeName} ${attributes.join(" ")}`
  return content ? `${startTag}>${content}</${node.nodeName}>` : `${startTag}/>`
}

function pathOrPolygon(
  value: string | undefined,
  attributes: string,
): string | undefined {
  if (!value) return undefined
  if (/^\s*[Mm]/.test(value)) {
    return `<path d="${escapeXml(value)}" ${attributes}/>`
  }
  const points = parsePointList(value)
  if (points.length === 0) return undefined
  return `<polygon points="${pointString(points)}" ${attributes}/>`
}

function renderSchematicShape(
  shape: EasyEdaShape,
  context: RenderContext,
): string[] {
  const fields = shape.fields
  const attributes = shapeAttributes(shape)

  if (shape instanceof EasyEdaLibrary) {
    return [
      `<g ${attributes}>`,
      ...shape.children.flatMap((child) => renderShape(child, context)),
      "</g>",
    ]
  }

  if (shape.token === "R") {
    const x = number(fields[0])
    const y = number(fields[1])
    const width = number(fields[4])
    const height = number(fields[5])
    if (
      x === undefined ||
      y === undefined ||
      width === undefined ||
      height === undefined
    )
      return []
    return [
      `<rect ${attributes} x="${formatNumber(x)}" y="${formatNumber(y)}" width="${formatNumber(width)}" height="${formatNumber(height)}" rx="${formatNumber(number(fields[2]) ?? 0)}" ry="${formatNumber(number(fields[3]) ?? 0)}" fill="${escapeXml(fill(fields[9]))}" stroke="${escapeXml(color(fields[6], "#880000"))}" stroke-width="${formatNumber(number(fields[7]) ?? 1)}"/>`,
    ]
  }

  if (shape.token === "E" || shape.token === "C") {
    const x = number(fields[0])
    const y = number(fields[1])
    const radiusX = number(fields[2])
    const radiusY = shape.token === "C" ? radiusX : number(fields[3])
    if (
      x === undefined ||
      y === undefined ||
      radiusX === undefined ||
      radiusY === undefined
    )
      return []
    const styleStart = shape.token === "C" ? 3 : 4
    const stroke = strokeFields(fields, styleStart)
    const fillField = fields[styleStart + 3]
    return [
      `<ellipse ${attributes} cx="${formatNumber(x)}" cy="${formatNumber(y)}" rx="${formatNumber(radiusX)}" ry="${formatNumber(radiusY)}" fill="${escapeXml(fill(fillField))}" stroke="${escapeXml(stroke.color)}" stroke-width="${formatNumber(stroke.width)}"/>`,
    ]
  }

  if (shape.token === "PL" || shape.token === "PG") {
    const points = parsePointList(fields[0])
    if (points.length === 0) return []
    const tag = shape.token === "PG" ? "polygon" : "polyline"
    return [
      `<${tag} ${attributes} points="${pointString(points)}" fill="${escapeXml(shape.token === "PG" ? fill(fields[4]) : "none")}" stroke="${escapeXml(color(fields[1], "#880000"))}" stroke-width="${formatNumber(number(fields[2]) ?? 1)}" stroke-linecap="round" stroke-linejoin="round"/>`,
    ]
  }

  if (shape.token === "PT" || shape.token === "A" || shape.token === "PI") {
    const path = fields[0]
    if (!path) return []
    const stroke = strokeFields(fields, 1)
    const fillColor = fields.find(
      (value, index) =>
        index > 1 && value !== stroke.color && value?.startsWith("#"),
    )
    return [
      `<path ${attributes} d="${escapeXml(path)}" fill="${escapeXml(shape.token === "A" ? "none" : fill(fillColor))}" stroke="${escapeXml(stroke.color)}" stroke-width="${formatNumber(stroke.width)}" stroke-linecap="round" stroke-linejoin="round"/>`,
    ]
  }

  if (shape.token === "L" || shape.token === "BE") {
    const offset = shape.token === "BE" ? 1 : 0
    const x1 = number(fields[offset])
    const y1 = number(fields[offset + 1])
    const x2 = number(fields[offset + 2])
    const y2 = number(fields[offset + 3])
    if (
      x1 === undefined ||
      y1 === undefined ||
      x2 === undefined ||
      y2 === undefined
    )
      return []
    const stroke = strokeFields(fields, offset + 4)
    return [
      `<line ${attributes} x1="${formatNumber(x1)}" y1="${formatNumber(y1)}" x2="${formatNumber(x2)}" y2="${formatNumber(y2)}" stroke="${escapeXml(stroke.color)}" stroke-width="${formatNumber(stroke.width)}"/>`,
    ]
  }

  if (shape.token === "W" || shape.token === "B") {
    const points = parsePointList(fields[0])
    if (points.length === 0) return []
    return [
      `<polyline ${attributes} points="${pointString(points)}" fill="none" stroke="${escapeXml(color(fields[1], shape.token === "W" ? "#008800" : "#0000ff"))}" stroke-width="${formatNumber(number(fields[2]) ?? 1)}" stroke-linecap="round" stroke-linejoin="round"/>`,
    ]
  }

  if (shape.token === "J") {
    const x = number(fields[0])
    const y = number(fields[1])
    if (x === undefined || y === undefined) return []
    return [
      `<circle ${attributes} cx="${formatNumber(x)}" cy="${formatNumber(y)}" r="${formatNumber(number(fields[2]) ?? 2.5)}" fill="${escapeXml(color(fields[3], "#cc0000"))}"/>`,
    ]
  }

  if (shape.token === "O") {
    const x = number(fields[0])
    const y = number(fields[1])
    if (x === undefined || y === undefined) return []
    return [
      `<path ${attributes} d="M ${formatNumber(x - 3)} ${formatNumber(y - 3)} L ${formatNumber(x + 3)} ${formatNumber(y + 3)} M ${formatNumber(x + 3)} ${formatNumber(y - 3)} L ${formatNumber(x - 3)} ${formatNumber(y + 3)}" fill="none" stroke="#cc0000" stroke-width="1"/>`,
    ]
  }

  if (shape.token === "T" || shape.token === "N") {
    const isText = shape.token === "T"
    const x = number(fields[isText ? 1 : 0])
    const y = number(fields[isText ? 2 : 1])
    if (x === undefined || y === undefined) return []
    const rotation = number(fields[isText ? 3 : 2]) ?? 0
    const text = fields[isText ? 11 : 4] ?? ""
    const fontSize =
      number((fields[isText ? 6 : 10] ?? "").replace("pt", "")) ??
      (isText ? 9 : 7)
    const anchor =
      isText && fields[0] === "C"
        ? "middle"
        : isText && fields[0] === "R"
          ? "end"
          : "start"
    return [
      `<text ${attributes} x="${formatNumber(x)}" y="${formatNumber(y)}" fill="${escapeXml(color(fields[isText ? 4 : 3], "#000080"))}" font-family="Arial, sans-serif" font-size="${formatNumber(fontSize)}" text-anchor="${anchor}"${rotation === 0 ? "" : ` transform="rotate(${formatNumber(rotation)} ${formatNumber(x)} ${formatNumber(y)})"`}>${escapeXml(text)}</text>`,
    ]
  }

  if (shape.token === "P") {
    const sections = shape.getString().split("^^")
    const path = sections[2]?.split("~")[0]
    const labelFields = sections[3]?.split("~")
    const label = labelFields?.[4]
    const labelX = number(labelFields?.[1])
    const labelY = number(labelFields?.[2])
    const result: string[] = [`<g ${attributes}>`]
    if (path) {
      result.push(
        `<path d="${escapeXml(path)}" fill="none" stroke="${escapeXml(color(sections[2]?.split("~")[1], "#880000"))}" stroke-width="1"/>`,
      )
    }
    if (label && labelX !== undefined && labelY !== undefined) {
      result.push(
        `<text x="${formatNumber(labelX)}" y="${formatNumber(labelY)}" fill="#0000ff" font-family="Arial, sans-serif" font-size="7">${escapeXml(label)}</text>`,
      )
    }
    result.push("</g>")
    return result
  }

  if (shape.token === "F") {
    const sections = shape.getString().split("^^")
    const labelFields = sections[2]?.split("~")
    const x = number(shape.fields[1])
    const y = number(shape.fields[2])
    const result = [`<g ${attributes}>`]
    if (labelFields?.[0] && x !== undefined && y !== undefined) {
      result.push(
        `<text x="${formatNumber(x)}" y="${formatNumber(y - 4)}" fill="${escapeXml(color(labelFields[1], "#000080"))}" font-family="Arial, sans-serif" font-size="8" text-anchor="middle">${escapeXml(labelFields[0])}</text>`,
      )
    }
    for (const section of sections.slice(3)) {
      if (section.startsWith("PL~")) {
        const values = section.split("~")
        const points = parsePointList(values[1])
        if (points.length > 0) {
          result.push(
            `<polyline points="${pointString(points)}" fill="none" stroke="${escapeXml(color(values[2], "#000000"))}" stroke-width="${formatNumber(number(values[3]) ?? 1)}"/>`,
          )
        }
      }
    }
    result.push("</g>")
    return result
  }

  if (shape.token === "AR") {
    const path = fields.find((value) => /^\s*[Mm]/.test(value))
    if (!path) return []
    const stroke = strokeFields(fields, 0)
    return [
      `<path ${attributes} d="${escapeXml(path)}" fill="none" stroke="${escapeXml(stroke.color)}" stroke-width="${formatNumber(stroke.width)}"/>`,
    ]
  }

  return []
}

function renderPcbShape(shape: EasyEdaShape, context: RenderContext): string[] {
  const fields = shape.fields
  const attributes = shapeAttributes(shape)

  if (shape instanceof EasyEdaLibrary) {
    return [
      `<g ${attributes}>`,
      ...shape.children.flatMap((child) => renderShape(child, context)),
      "</g>",
    ]
  }

  if (shape.token === "TRACK") {
    const layerId = number(fields[1])
    const points = parsePointList(fields[3])
    if (!isLayerVisible(context, layerId) || points.length === 0) return []
    return [
      `<polyline ${attributes} data-layer="${layerId ?? ""}" points="${pointString(points)}" fill="none" stroke="${escapeXml(layerColor(context, layerId))}" stroke-width="${formatNumber(number(fields[0]) ?? 1)}" stroke-linecap="round" stroke-linejoin="round"/>`,
    ]
  }

  if (shape.token === "ARC") {
    const layerId = number(fields[1])
    if (!isLayerVisible(context, layerId) || !fields[3]) return []
    return [
      `<path ${attributes} data-layer="${layerId ?? ""}" d="${escapeXml(fields[3])}" fill="none" stroke="${escapeXml(layerColor(context, layerId))}" stroke-width="${formatNumber(number(fields[0]) ?? 1)}" stroke-linecap="round"/>`,
    ]
  }

  if (shape.token === "RECT") {
    const x = number(fields[0])
    const y = number(fields[1])
    const width = number(fields[2])
    const height = number(fields[3])
    const layerId = number(fields[7])
    if (
      x === undefined ||
      y === undefined ||
      width === undefined ||
      height === undefined ||
      !isLayerVisible(context, layerId)
    )
      return []
    const rotation = number(fields[6]) ?? 0
    return [
      `<rect ${attributes} data-layer="${layerId ?? ""}" x="${formatNumber(x)}" y="${formatNumber(y)}" width="${formatNumber(width)}" height="${formatNumber(height)}" fill="${escapeXml(fill(fields[8]))}" stroke="${escapeXml(layerColor(context, layerId))}" stroke-width="${formatNumber(number(fields[4]) ?? 1)}"${rotation === 0 ? "" : ` transform="rotate(${formatNumber(rotation)} ${formatNumber(x)} ${formatNumber(y)})"`}/>`,
    ]
  }

  if (shape.token === "CIRCLE") {
    const x = number(fields[0])
    const y = number(fields[1])
    const radius = number(fields[2])
    const layerId = number(fields[4])
    if (
      x === undefined ||
      y === undefined ||
      radius === undefined ||
      !isLayerVisible(context, layerId)
    )
      return []
    return [
      `<circle ${attributes} data-layer="${layerId ?? ""}" cx="${formatNumber(x)}" cy="${formatNumber(y)}" r="${formatNumber(radius)}" fill="none" stroke="${escapeXml(layerColor(context, layerId))}" stroke-width="${formatNumber(number(fields[3]) ?? 1)}"/>`,
    ]
  }

  if (shape.token === "PAD") {
    const x = number(fields[1])
    const y = number(fields[2])
    const width = number(fields[3])
    const height = number(fields[4])
    const layerId = number(fields[5])
    if (
      x === undefined ||
      y === undefined ||
      width === undefined ||
      height === undefined ||
      !isLayerVisible(context, layerId)
    )
      return []
    const rotation = number(fields[10]) ?? 0
    const transform =
      rotation === 0
        ? ""
        : ` transform="rotate(${formatNumber(rotation)} ${formatNumber(x)} ${formatNumber(y)})"`
    const padColor = layerColor(context, layerId)
    let pad: string
    if (fields[0] === "ELLIPSE") {
      pad = `<ellipse cx="${formatNumber(x)}" cy="${formatNumber(y)}" rx="${formatNumber(width / 2)}" ry="${formatNumber(height / 2)}" fill="${escapeXml(padColor)}"${transform}/>`
    } else if (
      fields[0] === "POLYGON" &&
      parsePointList(fields[9]).length > 0
    ) {
      pad = `<polygon points="${pointString(parsePointList(fields[9]))}" fill="${escapeXml(padColor)}"${transform}/>`
    } else {
      pad = `<rect x="${formatNumber(x - width / 2)}" y="${formatNumber(y - height / 2)}" width="${formatNumber(width)}" height="${formatNumber(height)}" rx="${fields[0] === "OVAL" ? formatNumber(Math.min(width, height) / 2) : "0"}" fill="${escapeXml(padColor)}"${transform}/>`
    }
    const holeRadius = number(fields[8])
    return [
      `<g ${attributes} data-layer="${layerId ?? ""}">`,
      pad,
      ...(holeRadius && holeRadius > 0
        ? [
            `<circle cx="${formatNumber(x)}" cy="${formatNumber(y)}" r="${formatNumber(holeRadius)}" fill="#111111"/>`,
          ]
        : []),
      "</g>",
    ]
  }

  if (shape.token === "VIA") {
    const x = number(fields[0])
    const y = number(fields[1])
    const diameter = number(fields[2])
    if (x === undefined || y === undefined || diameter === undefined) return []
    return [
      `<g ${attributes}><circle cx="${formatNumber(x)}" cy="${formatNumber(y)}" r="${formatNumber(diameter / 2)}" fill="#c0c0c0"/><circle cx="${formatNumber(x)}" cy="${formatNumber(y)}" r="${formatNumber(number(fields[4]) ?? diameter / 4)}" fill="#111111"/></g>`,
    ]
  }

  if (shape.token === "HOLE") {
    const x = number(fields[0])
    const y = number(fields[1])
    const radius = number(fields[2])
    if (x === undefined || y === undefined || radius === undefined) return []
    return [
      `<circle ${attributes} cx="${formatNumber(x)}" cy="${formatNumber(y)}" r="${formatNumber(radius)}" fill="#111111" stroke="#d0d0d0" stroke-width="0.5"/>`,
    ]
  }

  if (shape.token === "SOLIDREGION" || shape.token === "COPPERAREA") {
    const isCopperArea = shape.token === "COPPERAREA"
    const layerId = number(fields[isCopperArea ? 1 : 0])
    const geometry = fields[isCopperArea ? 3 : 2]
    if (!isLayerVisible(context, layerId)) return []
    const rendered = pathOrPolygon(
      geometry,
      `${attributes} data-layer="${layerId ?? ""}" fill="${escapeXml(layerColor(context, layerId))}" fill-opacity="0.45" stroke="${escapeXml(layerColor(context, layerId))}" stroke-width="${formatNumber(isCopperArea ? (number(fields[0]) ?? 1) : 0.5)}"`,
    )
    return rendered ? [rendered] : []
  }

  if (shape.token === "TEXT") {
    const x = number(fields[1])
    const y = number(fields[2])
    const layerId = number(fields[6] ?? fields[4])
    if (x === undefined || y === undefined || !isLayerVisible(context, layerId))
      return []
    const rotation = number(fields[4]) ?? 0
    const fontSize =
      number(fields[8]) ?? Math.max(1, (number(fields[3]) ?? 1) * 6)
    return [
      `<text ${attributes} data-layer="${layerId ?? ""}" x="${formatNumber(x)}" y="${formatNumber(y)}" fill="${escapeXml(layerColor(context, layerId))}" font-family="Arial, sans-serif" font-size="${formatNumber(fontSize)}"${rotation === 0 ? "" : ` transform="rotate(${formatNumber(rotation)} ${formatNumber(x)} ${formatNumber(y)})"`}>${escapeXml(fields[9] ?? "")}</text>`,
    ]
  }

  if (shape.token === "DIMENSION") {
    const layerId = number(fields[0])
    const path = fields[1]
    if (!path || !isLayerVisible(context, layerId)) return []
    return [
      `<path ${attributes} data-layer="${layerId ?? ""}" d="${escapeXml(path)}" fill="none" stroke="${escapeXml(layerColor(context, layerId))}" stroke-width="0.5"/>`,
    ]
  }

  return []
}

function renderShape(shape: EasyEdaShape, context: RenderContext): string[] {
  if (shape instanceof EasyEdaSvgNode) {
    const data = shape.svgData
    if (!data) return []
    const rendered = renderSvgNodeData(
      data,
      context,
      shape.layerId,
      shapeAttributes(shape),
    )
    return rendered ? [rendered] : []
  }
  return context.document.kind === "pcb" ||
    context.document.kind === "pcb-footprint"
    ? renderPcbShape(shape, context)
    : renderSchematicShape(shape, context)
}

function readBounds(
  value: EasyEdaJsonValue | undefined,
): SvgBounds | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return undefined
  const x = number(
    typeof value.x === "number" || typeof value.x === "string"
      ? value.x
      : undefined,
  )
  const y = number(
    typeof value.y === "number" || typeof value.y === "string"
      ? value.y
      : undefined,
  )
  const width = number(
    typeof value.width === "number" || typeof value.width === "string"
      ? value.width
      : undefined,
  )
  const height = number(
    typeof value.height === "number" || typeof value.height === "string"
      ? value.height
      : undefined,
  )
  if (
    x === undefined ||
    y === undefined ||
    width === undefined ||
    height === undefined ||
    width <= 0 ||
    height <= 0
  )
    return undefined
  return { x, y, width, height }
}

function fallbackBounds(document: EasyEdaDocument): SvgBounds {
  const points: EasyEdaPoint[] = []
  const visit = (shape: EasyEdaShape): void => {
    if (shape instanceof EasyEdaLibrary) {
      for (const child of shape.children) visit(child)
      return
    }
    for (const field of shape.fields) {
      points.push(...parsePointList(field))
    }
  }
  for (const shape of document.shapes) visit(shape)
  if (points.length === 0) {
    return {
      x: 0,
      y: 0,
      width: document.canvas?.viewBoxWidth ?? 100,
      height: document.canvas?.viewBoxHeight ?? 100,
    }
  }
  const xs = points.map((point) => point.x)
  const ys = points.map((point) => point.y)
  const minX = Math.min(...xs)
  const minY = Math.min(...ys)
  return {
    x: minX,
    y: minY,
    width: Math.max(1, Math.max(...xs) - minX),
    height: Math.max(1, Math.max(...ys) - minY),
  }
}

function resolveDocument(
  source: EasyEdaDocument,
  schematicIndex: number,
): EasyEdaDocument {
  if (!(source instanceof EasyEdaSchematicList)) return source
  const document = source.sheets[schematicIndex]
  if (!document) {
    throw new Error(
      `EasyEDA schematic index ${schematicIndex} is out of range (${source.sheets.length} sheets)`,
    )
  }
  return document
}

export function renderEasyEdaSvg(
  source: EasyEdaDocument,
  options: EasyEdaSvgOptions = {},
): string {
  const schematicIndex = options.schematicIndex ?? 0
  const document = resolveDocument(source, schematicIndex)
  const rawBounds =
    readBounds(document.getProperty("BBox")) ?? fallbackBounds(document)
  const padding =
    options.padding ??
    Math.max(5, Math.max(rawBounds.width, rawBounds.height) * 0.02)
  const bounds = {
    x: rawBounds.x - padding,
    y: rawBounds.y - padding,
    width: rawBounds.width + padding * 2,
    height: rawBounds.height + padding * 2,
  }
  const aspectRatio = bounds.width / bounds.height
  const width = options.width ?? Math.min(1200, Math.max(320, bounds.width * 2))
  const height = options.height ?? width / aspectRatio
  const layerColors = new Map<number, string>()
  const hiddenLayers = new Set<number>()
  for (const layer of document.layers) {
    if (layer.id !== undefined && layer.color)
      layerColors.set(layer.id, layer.color)
    if (layer.id !== undefined && layer.fields[2] === "false")
      hiddenLayers.add(layer.id)
  }
  const context: RenderContext = {
    document,
    layerColors,
    hiddenLayers,
    showHiddenLayers: options.showHiddenLayers ?? false,
  }
  const backgroundColor =
    options.backgroundColor ??
    document.canvas?.backgroundColor ??
    (document.kind === "pcb" || document.kind === "pcb-footprint"
      ? "#000000"
      : "#ffffff")
  const title =
    options.title ??
    (source instanceof EasyEdaSchematicList
      ? String(
          source.schematics[schematicIndex]?.getProperty("title") ??
            "EasyEDA schematic",
        )
      : `EasyEDA ${document.kind}`)
  const shapes = document.shapes.flatMap((shape) => renderShape(shape, context))

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${formatNumber(width)}" height="${formatNumber(height)}" viewBox="${formatNumber(bounds.x)} ${formatNumber(bounds.y)} ${formatNumber(bounds.width)} ${formatNumber(bounds.height)}" role="img" aria-label="${escapeXml(title)}" class="easyeda-document easyeda-${escapeXml(document.kind)}" data-renderer="easyedats">`,
    `<title>${escapeXml(title)}</title>`,
    `<rect class="easyeda-background" x="${formatNumber(bounds.x)}" y="${formatNumber(bounds.y)}" width="${formatNumber(bounds.width)}" height="${formatNumber(bounds.height)}" fill="${escapeXml(backgroundColor)}"/>`,
    `<g class="easyeda-shapes" stroke-linecap="round" stroke-linejoin="round">`,
    ...shapes,
    "</g>",
    "</svg>",
  ].join("\n")
}

export const serializeEasyEdaToSvg = renderEasyEdaSvg
