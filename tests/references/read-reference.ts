import { readFile } from "node:fs/promises"
import { resolve } from "node:path"

export async function readReference(filename: string): Promise<string> {
  try {
    return await readFile(
      resolve(import.meta.dir, "..", "..", "references", filename),
      "utf8",
    )
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      throw new Error(
        `Missing ${filename}; run \`bun run download-references\` before tests`,
      )
    }
    throw error
  }
}
