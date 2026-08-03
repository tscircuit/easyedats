# easyedats

TypeScript-first parser and serializer for EasyEDA source files.

The first release targets the open ASCII format exported by **EasyEDA
Standard**: a JSON document whose `head`, `canvas`, `layers`, and `shape`
records use compact `~`-delimited strings. It supports both schematic and PCB
documents, parses known shape commands into classes, and preserves unknown
commands and top-level properties so files remain round-trippable.

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

`getString()` returns the original bytes when nothing changed. After a
mutation it emits deterministic two-space JSON while retaining unknown data.

## API shape

- `parseEasyEdaSource(source)` returns `EasyEdaSchematic`, `EasyEdaPcb`, or a
  generic `EasyEdaDocument` based on the `head` document type.
- `parseEasyEdaSchematic(source)` and `parseEasyEdaPcb(source)` validate the
  expected root type.
- `EasyEdaDocument#getChildren()` exposes the head, canvas, layers, and shapes
  for generic tree walking.
- Registered shape classes expose typed accessors for common fields.
- `EasyEdaUnknownShape` preserves unrecognized commands verbatim.
- Embedded `LIB` records expose their nested shapes through
  `EasyEdaLibrary#getChildren()`.

## Development

```sh
bun install
bun test
bun run typecheck
bun run format:check
```

The canonical fixtures are the schematic and PCB examples linked from the
[EasyEDA Standard format documentation](https://docs.easyeda.com/en/DocumentFormat/1-Common-Information/index.html).

## Format notes

EasyEDA Standard uses several nested delimiters:

- `~` separates record fields.
- `` ` `` separates custom attribute keys and values.
- `^^` joins compound sections such as pins and net flags.
- `#@$` separates the child records embedded in a symbol or footprint.

This library only splits delimiters at the level it currently models. The raw
field content remains available, preventing accidental loss of nested or
future syntax.
