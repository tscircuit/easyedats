import { expect, test } from "bun:test"
import { EasyEdaCustomAttributes, EasyEdaLibrary, EasyEdaShape } from "lib"

test("preserves ordered custom attributes, empty values, and dangling keys", () => {
  const source = "package`R0603`empty``duplicate`first`duplicate`last`dangling`"
  const attributes = new EasyEdaCustomAttributes(source)

  expect(attributes.getString()).toBe(source)
  expect(attributes.size).toBe(5)
  expect(attributes.trailingDelimiter).toBe(true)
  expect(attributes.toArray()).toEqual([
    { key: "package", value: "R0603" },
    { key: "empty", value: "" },
    { key: "duplicate", value: "first" },
    { key: "duplicate", value: "last" },
    { key: "dangling" },
  ])
  expect(attributes.has("dangling")).toBe(true)
  expect(attributes.get("dangling")).toBeUndefined()
  expect(attributes.get("duplicate")).toBe("last")
  expect(attributes.getAll("duplicate")).toEqual(["first", "last"])

  attributes.set("duplicate", "updated")
  expect(attributes.getAll("duplicate")).toEqual(["first", "updated"])
  attributes.append("duplicate", "appended")
  expect(attributes.getAll("duplicate")).toEqual([
    "first",
    "updated",
    "appended",
  ])
  expect(attributes.getString()).toContain("dangling``duplicate`appended`")

  expect(attributes.delete("duplicate")).toBe(true)
  expect(attributes.delete("missing")).toBe(false)
  expect(attributes.toArray()).toEqual([
    { key: "package", value: "R0603" },
    { key: "empty", value: "" },
    { key: "dangling", value: "" },
  ])
})

test("retains delimiter style and rejects unrepresentable values", () => {
  const compact = new EasyEdaCustomAttributes("package`R0603")
  compact.set("package", "R0402").append("value", "10k")
  expect(compact.getString()).toBe("package`R0402`value`10k")
  expect(compact.trailingDelimiter).toBe(false)

  const standard = new EasyEdaCustomAttributes()
  standard.set("package", "C0603")
  expect(standard.getString()).toBe("package`C0603`")
  standard.clear()
  expect(standard.getString()).toBe("")

  expect(() => standard.set("bad`key", "value")).toThrow(
    "key cannot contain the backtick delimiter",
  )
  expect(() => standard.append("key", "bad`value")).toThrow(
    "value cannot contain the backtick delimiter",
  )
})

test("binds custom-attribute edits to LIB field 4 without changing children", () => {
  const source =
    "LIB~10~20~package`R0603`Manufacturer Part``~90~~gge-lib#@$TRACK~1~1~GND~0 0 10 10~gge-track"
  const shape = EasyEdaShape.parse(source)
  if (!(shape instanceof EasyEdaLibrary)) throw new Error("Expected library")

  expect(shape.customAttributes.get("package")).toBe("R0603")
  expect(shape.customAttributes.get("Manufacturer Part")).toBe("")
  expect(shape.getString()).toBe(source)

  shape.customAttributes.set("package", "R0402").set("Supplier Part", "C12345")
  expect(shape.fields[2]).toBe(
    "package`R0402`Manufacturer Part``Supplier Part`C12345`",
  )
  expect(shape.getString()).toEndWith("#@$TRACK~1~1~GND~0 0 10 10~gge-track")

  shape.fields[2] = "package`C0603`"
  expect(shape.customAttributes.get("package")).toBe("C0603")
  shape.customAttributes.clear()
  expect(shape.fields[2]).toBe("")
  expect(shape.getString()).toStartWith("LIB~10~20~~90~~gge-lib#@$")
})
