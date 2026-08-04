# easyedats

TypeScript-first parser, serializer, and SVG renderer for EasyEDA source files.

The first release targets the open ASCII format exported by **EasyEDA
Standard**: a JSON document whose `head`, `canvas`, `layers`, and `shape`
records use compact `~`-delimited strings. It supports both schematic and PCB
documents, parses known shape commands into classes, and preserves unknown
commands and top-level properties so files remain round-trippable.

Both legacy exports with a compact string `head` and modern Standard exports
with an object `head` are supported. Multi-sheet schematic bundles
(`docType: 5`) parse as `EasyEdaSchematicList` roots.

EasyEDA Pro uses a separate archive and multi-file format. Pro support is not
claimed yet; it can be added under a separate module without changing the
Standard API.

## Install

```sh
bun add github:tscircuit/easyedats
```

## Parse and serialize

```ts
import {
  EasyEdaTrack,
  parseEasyEdaPcb,
  parseEasyEdaSource,
} from "easyedats"

const document = parseEasyEdaSource(source)

for (const shape of document.shapes) {
  console.log(shape.token, shape.getString())
}

const pcb = parseEasyEdaPcb(source)
const firstTrack = pcb.shapes.find(
  (shape): shape is EasyEdaTrack => shape instanceof EasyEdaTrack,
)

if (firstTrack) firstTrack.width = 2

const updatedSource = pcb.getString()
```

`parseEasyEdaSource(source, options)` applies conservative source-size, JSON
depth, shape-count, sheet-count, and record-length limits. Set
`validateRecords: true` to reject truncated known records as well. Parse failures
are `EasyEdaParseError` instances with a stable `code`, JSON `path`, and—when
applicable—the record token, missing field index, and JSON source position.

`getString()` returns the original bytes when nothing changed. After a
mutation it emits deterministic two-space JSON while retaining unknown data.

## Generate SVG

```ts
import { parseEasyEdaSource, renderEasyEdaSvg } from "easyedats"

const document = parseEasyEdaSource(source)
const svg = renderEasyEdaSvg(document, {
  highlightedNets: ["GND"],
  selectedShapeIds: ["gge42"],
  title: "Motor controller",
})
```

`renderEasyEdaSvg()` produces deterministic, standalone SVG for schematics,
PCB layouts, symbols, and footprints. For a schematic list it renders the
first sheet by default; pass `schematicIndex` to select another sheet. Imported
`SVGNODE` artwork is rendered through an explicit element and attribute
allowlist; scripts, event handlers, inline styles, and URL references are not
copied into the output.

Raster `data:` images are rendered by default. Remote images are omitted to
keep SVG generation private and deterministic; pass `remoteImagePolicy:
"allow"` to permit HTTP(S) sources. Use `renderEasyEdaSvgWithDiagnostics()` to
receive the SVG together with structured reports for unsupported records,
partial rendering, malformed geometry, and blocked image sources.

## CLI

The Bun-powered CLI supports file paths or `-` for standard input/output:

```sh
bunx easyedats inspect board.json
bunx easyedats validate board.json
bunx easyedats normalize board.json normalized.json
bunx easyedats round-trip board.json
bunx easyedats svg board.json board.svg
```

`validate` enables strict record checks and prints structured parser failures to
standard error. `normalize` emits deterministic two-space JSON, while
`round-trip` verifies both exact-source and normalized stability.

## API shape

- `parseEasyEdaSource(source)` selects a schematic, schematic-symbol, PCB,
  PCB-footprint, or generic document root based on the `head` document type.
- `parseEasyEdaSchematic(source)` and `parseEasyEdaPcb(source)` validate the
  expected root type.
- `parseEasyEdaSchematicSymbol(source)` and
  `parseEasyEdaPcbFootprint(source)` cover Standard library documents.
- `parseEasyEdaSchematicList(source)` parses modern multi-sheet schematic
  exports and exposes their documents through `list.sheets`.
- `renderEasyEdaSvg(document, options)` and its
  `serializeEasyEdaToSvg` alias render parsed geometry.
- `renderEasyEdaSvgWithDiagnostics(document, options)` reports unsupported and
  partially rendered records without affecting lossless serialization.
- `EasyEdaDocument#getChildren()` exposes the head, canvas, layers, and shapes
  for generic tree walking.
- Documents provide `append*`, `insert*`, `remove*`, and `move*` methods for
  shapes and layers; schematic lists provide the corresponding sheet methods.
- Registered shape classes expose typed accessors for common fields.
- `EasyEdaSvgNode#svgData` exposes the JSON tree stored by `SVGNODE` records.
- `EasyEdaLibrary#customAttributes` provides ordered, lossless access to the
  backtick-delimited `c_para` keys and values used by symbols and footprints.
- `EasyEdaUnknownShape` preserves unrecognized commands verbatim.
- Embedded `LIB` records expose their nested shapes through
  `EasyEdaLibrary#getChildren()` and provide matching child mutation methods.

Collection insertions accept indexes from zero through the current length.
Removal and movement require an existing index, and move destinations describe
the final position of the item.

## Development

Remaining format and renderer coverage is tracked in
[CHECKLIST.md](CHECKLIST.md).

```sh
bun install
bun run download-references
bun test
bun run typecheck
bun run format:check
```

The small canonical fixtures are the schematic and PCB examples linked from the
[EasyEDA Standard format documentation](https://docs.easyeda.com/en/DocumentFormat/1-Common-Information/index.html).
The complete suite also downloads hash-verified files from immutable Git
commits: the MIT-licensed SimpleFOCMini schematic and PCB, plus the CC BY
4.0-licensed Open_Core0 v2.0 PCB used as a 2.64 MB stress fixture. Those
third-party JSON files remain gitignored; their committed `.snap.svg` baselines
make visual changes reviewable.

Update the SVG baselines intentionally with:

```sh
bun run test:update-svg
```

## Format notes

EasyEDA Standard uses several nested delimiters:

- `~` separates record fields.
- `` ` `` separates custom attribute keys and values.
- `^^` joins compound sections such as pins and net flags.
- `#@$` separates the child records embedded in a symbol or footprint.

This library only splits delimiters at the level it currently models. The raw
field content remains available, preventing accidental loss of nested or
future syntax.
