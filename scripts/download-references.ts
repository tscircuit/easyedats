import { createHash } from "node:crypto"
import { mkdir, readFile, rename, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import { easyEdaReferences } from "./reference-manifest"

const referencesDirectory = resolve(import.meta.dir, "..", "references")

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex")
}

function verify(filename: string, bytes: Uint8Array, expected: string): void {
  const actual = sha256(bytes)
  if (actual !== expected) {
    throw new Error(
      `${filename} SHA-256 mismatch: expected ${expected}, got ${actual}`,
    )
  }
}

async function downloadReference(
  reference: (typeof easyEdaReferences)[number],
): Promise<void> {
  const outputPath = resolve(referencesDirectory, reference.filename)
  try {
    const existing = new Uint8Array(await readFile(outputPath))
    verify(reference.filename, existing, reference.sha256)
    console.log(`Verified ${reference.filename} (${existing.byteLength} bytes)`)
    return
  } catch (error) {
    if (
      !(error instanceof Error) ||
      !("code" in error) ||
      error.code !== "ENOENT"
    ) {
      throw error
    }
  }

  const response = await fetch(reference.url)
  if (!response.ok) {
    throw new Error(
      `${reference.url} (${response.status} ${response.statusText})`,
    )
  }

  const bytes = new Uint8Array(await response.arrayBuffer())
  verify(reference.filename, bytes, reference.sha256)
  const temporaryPath = `${outputPath}.download`
  await writeFile(temporaryPath, bytes)
  await rename(temporaryPath, outputPath)
  console.log(
    `Saved ${reference.filename} (${bytes.byteLength} bytes) from ${reference.source}`,
  )
}

await mkdir(referencesDirectory, { recursive: true })
await Promise.all(easyEdaReferences.map(downloadReference))
