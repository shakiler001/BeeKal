/**
 * Strips keys whose value is `undefined`.
 *
 * With exactOptionalPropertyTypes, `{ name: undefined }` is a different type
 * from `{}`, and Prisma's update inputs accept the second but not the first.
 * A partial patch naturally produces the first, so it is normalised here
 * rather than cast away — a cast would also hide a genuinely wrong field.
 *
 * The return type matters as much as the runtime behaviour: properties are
 * optional but never `| undefined`, which is exactly the shape Prisma wants.
 */
export type Defined<T> = { [K in keyof T]?: Exclude<T[K], undefined> };

export function defined<T extends Record<string, unknown>>(input: T): Defined<T> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) out[key] = value;
  }
  return out as Defined<T>;
}
