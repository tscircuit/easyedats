# easyedats contributor notes

- Preserve unknown fields, property order, record order, and delimiters.
- Keep `getString()` deterministic; unmodified reference files must round-trip
  exactly.
- Give documented shape commands dedicated `EasyEdaShape` subclasses and
  register them in `lib/entities/register-all.ts`.
- Run `bun run download-references` before the complete test suite.
- Add semantic assertions and SVG snapshots for geometry changes.
- Before publishing, run `bun test`, `bun run typecheck`, `bun run
  format:check`, and `bun run lint`.
