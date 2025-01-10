export interface ResultStat {
  rowsAffected: number;
  rowsRead: number | null;
  rowsWritten: number | null;
  queryDurationMs: number | null;
}

export enum ColumnType {
  TEXT = 1,
  INTEGER = 2,
  REAL = 3,
  BLOB = 4,
}

export interface ColumnHeader {
  /**
   * The key of row data that this column represents.
   */
  name: string;

  /**
   * The display name of the column. This is the name that should be used when displaying the column to the user.
   */
  displayName: string;

  /**
   * The original type of the column returned from database driver.
   */
  originalType: string | null;

  /**
   * Provide hint to the client on how to render the column.
   * If not provided, the client should infer the type from the data.
   */
  type?: ColumnType;
}

export interface ResultSet {
  rows: Record<string, unknown>[];
  headers: ColumnHeader[];
  stat: ResultStat;
  lastInsertRowid?: number;
}
