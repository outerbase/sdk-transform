import type { ResultSet as TursoResultSet } from "@libsql/client";
import { ColumnType, type ColumnHeader, type ResultSet } from "./type";
import { transformArrayBasedResult } from "./transform";

function convertSqliteType(type: string | undefined): ColumnType {
  // https://www.sqlite.org/datatype3.html
  if (type === undefined) return ColumnType.BLOB;

  type = type.toUpperCase();

  if (type.includes("CHAR")) return ColumnType.TEXT;
  if (type.includes("TEXT")) return ColumnType.TEXT;
  if (type.includes("CLOB")) return ColumnType.TEXT;
  if (type.includes("STRING")) return ColumnType.TEXT;

  if (type.includes("INT")) return ColumnType.INTEGER;

  if (type.includes("BLOB")) return ColumnType.BLOB;

  if (
    type.includes("REAL") ||
    type.includes("DOUBLE") ||
    type.includes("FLOAT")
  )
    return ColumnType.REAL;

  return ColumnType.TEXT;
}

export function transformTursoResult(tursoResult: any): ResultSet {
  const raw = tursoResult as TursoResultSet;

  return {
    ...transformArrayBasedResult<string>({
      rows: raw.rows as unknown as unknown[][],
      headers: raw.columns,
      headersMapper: (header, headerIdx) => ({
        name: header,
        type: convertSqliteType(raw.columnTypes[headerIdx]),
        originalType: raw.columnTypes[headerIdx],
      }),
      transformValue: (value) => {
        if (value instanceof Uint8Array || value instanceof ArrayBuffer) {
          return Array.from(new Uint8Array(value));
        }

        return value;
      },
    }),
    stat: {
      rowsAffected: raw.rowsAffected,
      rowsRead: null,
      rowsWritten: null,
      queryDurationMs: 0,
    },
    lastInsertRowid:
      raw.lastInsertRowid === undefined
        ? undefined
        : Number(raw.lastInsertRowid),
  };
}
