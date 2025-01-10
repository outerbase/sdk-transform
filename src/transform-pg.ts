import type { FieldDef, QueryArrayResult } from "pg";
import { transformArrayBasedResult } from "./transform";
import { ColumnType } from "./type";

export function setPgParser(pgTypes: any) {
  pgTypes.setTypeParser(pgTypes.builtins.TIME, (timeStr: any) => timeStr);
  pgTypes.setTypeParser(pgTypes.builtins.TIMESTAMP, (timeStr: any) => timeStr);
  pgTypes.setTypeParser(
    pgTypes.builtins.TIMESTAMPTZ,
    (timeStr: any) => timeStr
  );
  pgTypes.setTypeParser(pgTypes.builtins.DATE, (timeStr: any) => timeStr);
  pgTypes.setTypeParser(pgTypes.builtins.TIME, (timeStr: any) => timeStr);
  pgTypes.setTypeParser(pgTypes.builtins.JSON, (json: any) => json);
  pgTypes.setTypeParser(pgTypes.builtins.JSONB, (json: any) => json);
}

export function transformPgResult(pgResult: any) {
  const r = pgResult as QueryArrayResult;

  return {
    ...transformArrayBasedResult<FieldDef>({
      headers: r.fields,
      headersMapper: (header) => ({
        name: header.name,
        originalType: header.dataTypeID.toString(),
        type: ColumnType.TEXT,
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
