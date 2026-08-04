# Downloaded references

Run `bun run download-references` before the complete test suite. The command
downloads EasyEDA Standard exports from immutable commits and verifies their
SHA-256 digests. The corpus currently includes:

- the MIT-licensed SimpleFOCMini schematic and PCB; and
- the CC BY 4.0-licensed Open_Core0 v2.0 PCB, a 2.64 MB stress fixture with
  1,236 top-level shapes and 4,673 total records after expanding footprints.

The downloaded JSON files are intentionally gitignored. Their provenance,
license, immutable URLs, and expected hashes live in
`scripts/reference-manifest.ts`; only derived SVG visual snapshots are
committed for review.

## Open_Core0 attribution

[Open_Core0 v2.0](https://github.com/OpenStickCommunity/Hardware/blob/3b61a1bfe8dacc6df09d17030d7a35a02a8d437a/Boards/GP2040-CE%20Official%20Controllers/Open_Core0/Source%20files/PCB%20-%20Open_Core0%20v2.0.json)
is © 2023 [TheTrain](https://github.com/TheTrainGoes) and is
[licensed under CC BY 4.0](https://github.com/OpenStickCommunity/Hardware/blob/3b61a1bfe8dacc6df09d17030d7a35a02a8d437a/Boards/GP2040-CE%20Official%20Controllers/Open_Core0/README.md#L11-L13).
The downloaded JSON is tested unchanged. The committed SVG is a generated
visual-test snapshot created by easyedats.
