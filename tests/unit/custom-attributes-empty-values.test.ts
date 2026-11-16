import { test } from "bun:test"
import assert from "node:assert/strict"
import { EasyEdaCustomAttributes } from "../../lib/custom-attributes"
import { EasyEdaLibrary } from "../../lib/entities/library"

for (const [label, mutate, expected] of [
  [
    "replace",
    (a: EasyEdaCustomAttributes) => a.set("package", ""),
    [{ key: "package", value: "" }],
  ],
  [
    "append",
    (a: EasyEdaCustomAttributes) => a.append("empty", ""),
    [
      { key: "package", value: "R0603" },
      { key: "empty", value: "" },
    ],
  ],
  [
    "insert with set",
    (a: EasyEdaCustomAttributes) => a.set("empty", ""),
    [
      { key: "package", value: "R0603" },
      { key: "empty", value: "" },
    ],
  ],
] as const) {
  test(`compact ${label} retains a final explicit empty value`, () => {
    const attributes = new EasyEdaCustomAttributes("package`R0603")
    mutate(attributes)
    assert.deepEqual(attributes.toArray(), expected)
    assert.deepEqual(
      new EasyEdaCustomAttributes(attributes.getString()).toArray(),
      expected,
    )
    assert.equal(attributes.trailingDelimiter, true)
  })
}

test("setting the last duplicate to empty preserves earlier duplicates", () => {
  const attributes = new EasyEdaCustomAttributes("key`first`key`last")
  attributes.set("key", "")
  assert.deepEqual(attributes.getAll("key"), ["first", ""])
  assert.equal(attributes.get("key"), "")
  assert.equal(attributes.getString(), "key`first`key``")
})

test("deleting a trailing attribute preserves the newly final empty value", () => {
  const attributes = new EasyEdaCustomAttributes("empty``tail`value")
  assert.equal(attributes.delete("tail"), true)
  assert.equal(attributes.getString(), "empty``")
  assert.deepEqual(attributes.toArray(), [{ key: "empty", value: "" }])
})

test("compact empty key and value survive a round trip", () => {
  const attributes = new EasyEdaCustomAttributes("package`R0603")
  attributes.append("", "")
  assert.deepEqual(
    new EasyEdaCustomAttributes(attributes.getString()).toArray(),
    [
      { key: "package", value: "R0603" },
      { key: "", value: "" },
    ],
  )
})

test("Unicode keys retain explicitly empty values", () => {
  const attributes = new EasyEdaCustomAttributes("型号`电容")
  attributes.set("型号", "")
  assert.equal(
    new EasyEdaCustomAttributes(attributes.getString()).get("型号"),
    "",
  )
})

test("appending an empty duplicate retains order and multiplicity", () => {
  const attributes = new EasyEdaCustomAttributes("key`first")
  attributes.append("key", "")
  assert.deepEqual(attributes.getAll("key"), ["first", ""])
})

test("updating an interior value to empty does not add an unnecessary terminator", () => {
  const attributes = new EasyEdaCustomAttributes("first`one`last`two")
  attributes.set("first", "")
  assert.equal(attributes.getString(), "first``last`two")
  assert.equal(attributes.trailingDelimiter, false)
  assert.deepEqual(attributes.toArray(), [
    { key: "first", value: "" },
    { key: "last", value: "two" },
  ])
})

test("nonempty compact mutations retain the existing delimiter style", () => {
  const attributes = new EasyEdaCustomAttributes("package`R0603")
  attributes.set("package", "R0402").append("value", "10k")
  assert.equal(attributes.getString(), "package`R0402`value`10k")
  assert.equal(attributes.trailingDelimiter, false)
})

test("deleting a compact final item retains nonempty compact style", () => {
  const attributes = new EasyEdaCustomAttributes("first`one`last`two")
  attributes.delete("last")
  assert.equal(attributes.getString(), "first`one")
})

test("empty default attributes serialize an explicitly empty value", () => {
  const attributes = new EasyEdaCustomAttributes()
  attributes.set("empty", "")
  assert.equal(attributes.getString(), "empty``")
  assert.equal(attributes.get("empty"), "")
})

for (const source of [
  "empty``",
  "dangling`",
  "dangling",
  "package`R0603",
  "package`R0603`",
]) {
  test(`unmodified source remains exact: ${JSON.stringify(source)}`, () => {
    const attributes = new EasyEdaCustomAttributes(source)
    attributes.toArray()
    assert.equal(attributes.getString(), source)
    assert.equal(attributes.delete("absent"), false)
    assert.equal(attributes.getString(), source)
  })
}

test("a final dangling key is not reinterpreted as an empty value", () => {
  const attributes = new EasyEdaCustomAttributes("package`R0603`dangling`")
  attributes.set("package", "R0402")
  assert.deepEqual(attributes.toArray(), [
    { key: "package", value: "R0402" },
    { key: "dangling" },
  ])
  assert.equal(attributes.getString(), "package`R0402`dangling`")
})

test("appending after a dangling key retains existing empty-fill semantics", () => {
  const attributes = new EasyEdaCustomAttributes("dangling`")
  attributes.append("new", "value")
  assert.deepEqual(attributes.toArray(), [
    { key: "dangling", value: "" },
    { key: "new", value: "value" },
  ])
})

test("standard nonempty values retain their trailing delimiter", () => {
  const attributes = new EasyEdaCustomAttributes("package`R0603`")
  attributes.set("package", "R0402")
  assert.equal(attributes.getString(), "package`R0402`")
})

test("clear and deletion of the final pair keep the empty-source representation", () => {
  const attributes = new EasyEdaCustomAttributes("package`R0603")
  attributes.set("package", "")
  assert.equal(attributes.delete("package"), true)
  assert.equal(attributes.getString(), "")
  attributes.set("again", "").clear()
  assert.equal(attributes.size, 0)
  assert.equal(attributes.getString(), "")
})

for (const operation of ["set", "append"] as const) {
  test(`${operation} still rejects unrepresentable delimiters`, () => {
    const attributes = new EasyEdaCustomAttributes("package`R0603")
    assert.throws(
      () => attributes[operation]("bad`key", ""),
      /key cannot contain/,
    )
    assert.throws(
      () => attributes[operation]("key", "bad`value"),
      /value cannot contain/,
    )
    assert.equal(attributes.getString(), "package`R0603")
  })
}

const libSource = "LIB~10~20~package`R0603~90~~gge-lib#@$UNKNOWN~raw~child"

for (const operation of ["set", "append"] as const) {
  test(`LIB-bound ${operation} preserves empty values and unrelated bytes`, () => {
    const library = new EasyEdaLibrary({ source: libSource })
    library.customAttributes[operation]("package", "")
    const serialized = library.getString()
    const reparsed = new EasyEdaLibrary({ source: serialized })
    assert.equal(reparsed.customAttributes.get("package"), "")
    assert.equal(reparsed.fields[0], "10")
    assert.equal(reparsed.fields[1], "20")
    assert.deepEqual(reparsed.fields.slice(3), ["90", "", "gge-lib"])
    assert.equal(reparsed.children[0]?.getString(), "UNKNOWN~raw~child")
    assert.equal(serialized, reparsed.getString())
  })
}

test("LIB-bound deletion preserves a final empty value", () => {
  const library = new EasyEdaLibrary({
    source: libSource.replace("package`R0603", "empty``tail`value"),
  })
  library.customAttributes.delete("tail")
  const reparsed = new EasyEdaLibrary({ source: library.getString() })
  assert.equal(reparsed.customAttributes.get("empty"), "")
  assert.equal(reparsed.customAttributes.size, 1)
  assert.equal(reparsed.children[0]?.getString(), "UNKNOWN~raw~child")
})

test("LIB-bound reads and ordinary edits retain existing compact behavior", () => {
  const library = new EasyEdaLibrary({ source: libSource })
  assert.equal(library.getString(), libSource)
  library.customAttributes.set("package", "R0402")
  assert.equal(library.getString(), libSource.replace("R0603", "R0402"))
})
