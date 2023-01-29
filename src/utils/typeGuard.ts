export function isInteger(value: unknown): value is number {
  return Number.isInteger(value);
}

export function isString(value: unknown): value is string {
  return typeof value === 'string' || value instanceof String;
}

export function isFunction(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === 'function' || value instanceof Function;
}
