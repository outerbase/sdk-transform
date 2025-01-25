import { transformArrayBasedResult } from "./transform";
import { ResultSet } from "./type";

interface StarbaseResult {
  columns: string[];
  rows: unknown[][];
  meta: {
    rows_read: number;
    rows_written: number;
  };
}

export function transformStarbaseResult(data: StarbaseResult): ResultSet {
  return {
    ...transformArrayBasedResult({
      headers: data.columns,
      headersMapper: (header) => ({
        name: header,
        originalType: null,
        type: undefined,
      }),
      rows: data.rows,
    }),
    stat: {
      queryDurationMs: 0,
      rowsAffected: data.meta.rows_written,
      rowsRead: data.meta.rows_read,
      rowsWritten: data.meta.rows_written,
    },
  };
}
