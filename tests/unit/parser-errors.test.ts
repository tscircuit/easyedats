import { describe, expect, test } from "bun:test"
import { EasyEdaParseError, parseEasyEdaSource } from "lib"

function captureParseError(callback: () => unknown): EasyEdaParseError {
  try {
    callback()
  } catch (error) {
    expect(error).toBeInstanceOf(EasyEdaParseError)
    if (error instanceof EasyEdaParseError) return error
    throw error
  }
  throw new Error("Expected parsing to fail")
}

describe("structured parser errors", () => {
  test("reports malformed and truncated JSON", () => {
    const error = captureParseError(() => parseEasyEdaSource('{"head":'))

    expect(error.code).toBe("invalid-json")
    expect(error.path).toEqual([])
    expect(error.message).toContain("path $")
  })

  test("reports document paths for invalid field types", () => {
    const error = captureParseError(() =>
      parseEasyEdaSource(
        JSON.stringify({
          head: "3~1.0~",
          shape: ["TRACK~1~1~GND~0 0~gge1", 42],
        }),
      ),
    )

    expect(error.code).toBe("invalid-type")
    expect(error.path).toEqual(["shape", 1])
    expect(error.message).toContain("$.shape[1]")
  })

  test("reports record tokens and missing field positions in strict mode", () => {
    const error = captureParseError(() =>
      parseEasyEdaSource(
        JSON.stringify({ head: "3~1.0~", shape: ["TRACK~1~1"] }),
        { validateRecords: true },
      ),
    )

    expect(error.code).toBe("truncated-record")
    expect(error.path).toEqual(["shape", 0])
    expect(error.recordToken).toBe("TRACK")
    expect(error.fieldIndex).toBe(2)
  })
})

describe("parser safety limits", () => {
  test("limits UTF-8 source bytes", () => {
    const source = JSON.stringify({ head: "3~1.0~", note: "board" })
    const error = captureParseError(() =>
      parseEasyEdaSource(source, { limits: { maxSourceBytes: 10 } }),
    )

    expect(error.code).toBe("limit-exceeded")
    expect(error.message).toContain("bytes")
  })

  test("limits JSON nesting without recursive validation", () => {
    const source = JSON.stringify({
      head: "3~1.0~",
      future: { one: { two: { three: { four: true } } } },
    })
    const error = captureParseError(() =>
      parseEasyEdaSource(source, { limits: { maxJsonDepth: 3 } }),
    )

    expect(error.code).toBe("limit-exceeded")
    expect(error.path.length).toBeGreaterThan(3)
  })

  test("counts top-level and embedded LIB records", () => {
    const source = JSON.stringify({
      head: "3~1.0~",
      shape: [
        "LIB~0~0~~~~0~gge1#@$TRACK~1~1~GND~0 0 1 1~gge2#@$VIA~1~1~2~GND~0.5~gge3",
      ],
    })
    const error = captureParseError(() =>
      parseEasyEdaSource(source, { limits: { maxShapes: 2 } }),
    )

    expect(error.code).toBe("limit-exceeded")
    expect(error.path).toEqual(["shape", 0, "children", 1])
    expect(error.recordToken).toBe("VIA")
  })

  test("rejects invalid limit options", () => {
    const error = captureParseError(() =>
      parseEasyEdaSource("{}", { limits: { maxShapes: 0 } }),
    )

    expect(error.code).toBe("invalid-options")
    expect(error.path).toEqual(["options", "limits", "maxShapes"])
  })
})
