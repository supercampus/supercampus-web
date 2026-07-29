export function fixture<T>(value: T): T {
  return structuredClone(value);
}