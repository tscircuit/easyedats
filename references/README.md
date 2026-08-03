# Downloaded references

Run `bun run download-references` before the complete test suite. The command
downloads two EasyEDA Standard exports from the MIT-licensed SimpleFOCMini
project at an immutable commit and verifies their SHA-256 digests.

The downloaded JSON files are intentionally gitignored. Their provenance,
license, immutable URLs, and expected hashes live in
`scripts/reference-manifest.ts`; only derived SVG visual snapshots are
committed for review.
