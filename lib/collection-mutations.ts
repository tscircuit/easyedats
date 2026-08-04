function describeIndex(index: number): string {
  return String(index)
}

function assertIndex(
  collectionName: string,
  index: number,
  maximum: number,
  operation: "insert" | "access",
): void {
  if (Number.isInteger(index) && index >= 0 && index <= maximum) return
  const range = maximum < 0 ? "an empty collection" : `0 through ${maximum}`
  const verb = operation === "insert" ? "insert into" : "access"
  throw new RangeError(
    `Cannot ${verb} EasyEDA ${collectionName} at index ${describeIndex(index)}; expected ${range}`,
  )
}

export function insertAt<T, U extends T>(
  items: T[],
  index: number,
  item: U,
  collectionName: string,
): U {
  assertIndex(collectionName, index, items.length, "insert")
  items.splice(index, 0, item)
  return item
}

export function removeAt<T>(
  items: T[],
  index: number,
  collectionName: string,
): T {
  assertIndex(collectionName, index, items.length - 1, "access")
  return items.splice(index, 1)[0] as T
}

export function moveWithin<T>(
  items: T[],
  fromIndex: number,
  toIndex: number,
  collectionName: string,
): void {
  assertIndex(collectionName, fromIndex, items.length - 1, "access")
  assertIndex(collectionName, toIndex, items.length - 1, "access")
  if (fromIndex === toIndex) return
  const item = items.splice(fromIndex, 1)[0] as T
  items.splice(toIndex, 0, item)
}
