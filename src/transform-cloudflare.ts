import { transformArrayBasedResult } from "./transform";

interface CloudflareResult {
  results: {
    columns: string[];
    rows: unknown[][];
  };
  meta: {
    duration: number;
    changes: number;
    last_row_id: number;
    rows_read: number;
    rows_written: number;
  };
}

export function transformCloudflareD1(cloudflareResult: any) {
  const result = cloudflareResult as CloudflareResult;

  return {
    ...transformArrayBasedResult({
      rows: result.results.rows,
      headers: result.results.columns,
      headersMapper: (header) => ({
        name: header,
        type: null,
        originalType: null,
      }),
    }),
    stat: {
      rowsAffected: result.meta.changes,
      rowsRead: result.meta.rows_read,
      rowsWritten: result.meta.rows_written,
      queryDurationMs: result.meta.duration,
    },
    lastInsertRowid: result.meta.last_row_id,
  };
}
