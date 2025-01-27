import { hex } from "./bit-operation";

export function escapeSqlValue(value: unknown) {
  if (value === undefined) return "DEFAULT";
  if (value === null) return "NULL";
  if (typeof value === "string") return escapeSqlString(value);
  if (typeof value === "number") return value.toString();
  if (typeof value === "bigint") return value.toString();
  if (value instanceof ArrayBuffer) return escapeSqlBinary(value);
  if (Array.isArray(value))
    return escapeSqlBinary(Uint8Array.from(value).buffer);
  // eslint-disable-next-line @typescript-eslint/no-base-to-string
  throw new Error(value.toString() + " is unrecongize type of value");
}

export function escapeSqlString(str: string) {
  return `'${str.replace(/'/g, `''`)}'`;
}

export function escapeSqlBinary(value: ArrayBuffer) {
  return `x'${hex(value)}'`;
}
