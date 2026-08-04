# Contributing

Download the pinned real-world fixtures before running the complete suite:

```sh
bun run download-references
bun test
```

Do not commit downloaded third-party EasyEDA files unless their license
explicitly allows redistribution and doing so adds review value. Add external
fixtures to `scripts/reference-manifest.ts` with an immutable source commit,
license provenance, and SHA-256 digest.

Parser changes should retain exact unmodified round trips. Geometry changes
should include semantic assertions and an SVG visual baseline; update those
baselines with `bun run test:update-svg`, then inspect the `.snap.svg` diff
before committing it.
