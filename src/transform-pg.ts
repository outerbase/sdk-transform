import type { FieldDef, QueryArrayResult } from "pg";
import { transformArrayBasedResult } from "./transform";
import { ColumnType, ResultSet } from "./type";

const BUILTIN_TIME = 1083;
const BUILTIN_TIMESTAMP = 1114;
const BUILTIN_TIMESTAMPTZ = 1184;
const BUILTIN_DATE = 1082;
const BUILTIN_JSON = 114;
const BUILTIN_JSONB = 3802;

export function setPgParser(pgTypes: any) {
  pgTypes.setTypeParser(BUILTIN_TIME, (timeStr: any) => timeStr);
  pgTypes.setTypeParser(BUILTIN_TIMESTAMP, (timeStr: any) => timeStr);
  pgTypes.setTypeParser(BUILTIN_TIMESTAMPTZ, (timeStr: any) => timeStr);
  pgTypes.setTypeParser(BUILTIN_DATE, (timeStr: any) => timeStr);
  pgTypes.setTypeParser(BUILTIN_JSON, (json: any) => json);
  pgTypes.setTypeParser(BUILTIN_JSONB, (json: any) => json);
}

export function transformPgResult(pgResult: any): ResultSet {
  const r = pgResult as QueryArrayResult;

  return {
    ...transformArrayBasedResult<FieldDef>({
      headers: r.fields,
      headersMapper: (header) => ({
        name: header.name,
        originalType: header.dataTypeID.toString(),
        type: ColumnType.TEXT,
        columnId: header.columnID,
        tableId: header.tableID,
      }),
      rows: pgResult.rows,
    }),
    stat: {
      queryDurationMs: 0,
      rowsAffected: r.rowCount,
      rowsRead: r.rowCount,
      rowsWritten: 0,
    },
  };
}
