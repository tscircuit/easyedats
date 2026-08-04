# Support checklist

This tracks the remaining work toward a dependable EasyEDA parser, serializer,
and SVG renderer. Checked items describe the current implementation; unchecked
items are additional support we still need.

## P0: EasyEDA Standard fidelity

- [x] Parse legacy compact-string and modern object document heads.
- [x] Parse Standard schematics, schematic lists, symbols, PCBs, and footprints.
- [x] Preserve unknown top-level fields, shape tokens, field order, and delimiters.
- [x] Return the exact original source when an unmodified document is serialized.
- [x] Parse `#@$` child records embedded in `LIB` symbols and footprints.
- [ ] Model and serialize every documented `^^` compound section, especially pins
  and net flags, without requiring consumers to edit raw fields.
- [x] Model custom-attribute `` ` `` key/value sections with lossless editing.
- [x] Add first-class insert, remove, and reorder APIs for shapes, layers, sheets,
  and `LIB` children.
- [ ] Add structured parse errors with document paths, record tokens, and field
  positions.
- [ ] Define safe limits and useful errors for malformed JSON, truncated records,
  excessive nesting, and unexpectedly large inputs.
- [ ] Cover Standard project archives and standalone library export containers.

## P0: SVG fidelity

- [x] Render common schematic wires, symbols, pins, labels, buses, and primitives.
- [x] Render common PCB tracks, arcs, pads, vias, holes, regions, pours, and text.
- [x] Select a sheet when rendering a multi-sheet schematic list.
- [x] Keep deterministic SVG baselines for canonical and real-world inputs.
- [x] Render `SVGNODE` content used for imported vector graphics and board artwork
  with a safe SVG element and attribute allowlist.
- [ ] Apply every symbol and footprint rotation, mirror, origin, and layer-side
  transform exactly as EasyEDA does.
- [ ] Match EasyEDA layer order, visibility, colors, and front/back mirroring; add
  caller-selectable layer filtering and per-layer SVG output.
- [ ] Support copper-pour cutouts, keepouts, thermal reliefs, custom pad paths,
  plated/non-plated slots, and all solid-region subtypes.
- [ ] Match text anchors, rotation, mirroring, line spacing, font fallback, and
  hidden-text behavior.
- [ ] Render embedded images safely, including data URLs and remote-image policy.
- [ ] Complete dimension arrows, path commands, fill rules, and curve bounds.
- [ ] Calculate geometry-based bounds without relying on the EasyEDA `BBox` or
  unrelated numeric metadata.
- [ ] Add optional net highlighting and component/footprint selection metadata.

## P1: Typed model and semantics

- [ ] Audit every documented Standard shape token against a typed entity and a
  focused parse/mutate/serialize fixture.
- [ ] Expose typed layer IDs, net names, pad numbers, component attributes, and
  design-rule fields instead of raw string indexes where practical.
- [ ] Build a connectivity graph for schematic nets and PCB copper.
- [ ] Link schematic components and pins to PCB footprints and pads.
- [ ] Report unsupported tokens and partially rendered features without making
  lossless round trips fail.
- [ ] Add optional conversion to and from Circuit JSON after format fidelity is
  stable.

## P1: Corpus and regression coverage

- [x] Hash-pin externally downloaded fixtures and record source/license provenance.
- [x] Test official small fixtures and real-world schematic/PCB exports.
- [x] Stress-test the 2.64 MB Open_Core0 v2.0 PCB: 1,236 top-level shapes and
  4,673 total records after expanding its 147 footprints.
- [ ] Add real-world symbol, footprint, multi-sheet, non-English, image-bearing,
  and four-or-more-layer board fixtures.
- [ ] Add mutation snapshots for each entity rather than round-trip-only coverage.
- [ ] Add property-based tests for delimiter-heavy values and randomized unknown
  fields.
- [ ] Add fuzzing for parser crashes and serializer data loss.
- [ ] Establish parse, serialize, and SVG-render performance/memory budgets for
  1 MB, 10 MB, and pathological files.

## P2: Other EasyEDA formats and tooling

- [ ] Add a separate EasyEDA Pro module for its JSON-lines documents, libraries,
  and archive formats; do not silently interpret Pro data as Standard.
- [ ] Support EasyEDA API/export envelopes such as raw component-response wrappers
  where useful, while keeping the core parser independent of network access.
- [ ] Provide a CLI for inspect, validate, normalize, round-trip, and SVG rendering.
- [ ] Verify the package in Bun, Node.js ESM, and browser bundlers.
- [ ] Add package build/export validation, generated API docs, changelog, and a
  release workflow before the first npm publication.
