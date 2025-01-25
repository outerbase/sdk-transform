import type { QueryResult, FieldPacket } from "mysql2";

import { ColumnType, ResultSet } from "./type";
import { transformArrayBasedResult } from "./transform";

enum MySQLType {
  MYSQL_TYPE_DECIMAL,
  MYSQL_TYPE_TINY,
  MYSQL_TYPE_SHORT,
  MYSQL_TYPE_LONG,
  MYSQL_TYPE_FLOAT,
  MYSQL_TYPE_DOUBLE,
  MYSQL_TYPE_NULL,
  MYSQL_TYPE_TIMESTAMP,
  MYSQL_TYPE_LONGLONG,
  MYSQL_TYPE_INT24,
  MYSQL_TYPE_DATE,
  MYSQL_TYPE_TIME,
  MYSQL_TYPE_DATETIME,
  MYSQL_TYPE_YEAR,
  MYSQL_TYPE_NEWDATE /**< Internal to MySQL. Not used in protocol */,
  MYSQL_TYPE_VARCHAR,
  MYSQL_TYPE_BIT,
  MYSQL_TYPE_TIMESTAMP2,
  MYSQL_TYPE_DATETIME2 /**< Internal to MySQL. Not used in protocol */,
  MYSQL_TYPE_TIME2 /**< Internal to MySQL. Not used in protocol */,
  MYSQL_TYPE_TYPED_ARRAY /**< Used for replication only */,
  MYSQL_TYPE_INVALID = 243,
  MYSQL_TYPE_BOOL = 244 /**< Currently just a placeholder */,
  MYSQL_TYPE_JSON = 245,
  MYSQL_TYPE_NEWDECIMAL = 246,
  MYSQL_TYPE_ENUM = 247,
  MYSQL_TYPE_SET = 248,
  MYSQL_TYPE_TINY_BLOB = 249,
  MYSQL_TYPE_MEDIUM_BLOB = 250,
  MYSQL_TYPE_LONG_BLOB = 251,
  MYSQL_TYPE_BLOB = 252,
  MYSQL_TYPE_VAR_STRING = 253,
  MYSQL_TYPE_STRING = 254,
  MYSQL_TYPE_GEOMETRY = 255,
}

const mapDataName: Record<number, string> = {
  0x00: "DECIMAL", // aka DECIMAL
  0x01: "TINY", // aka TINYINT, 1 byte
  0x02: "SHORT", // aka SMALLINT, 2 bytes
  0x03: "LONG", // aka INT, 4 bytes
  0x04: "FLOAT", // aka FLOAT, 4-8 bytes
  0x05: "DOUBLE", // aka DOUBLE, 8 bytes
  0x06: "NULL", // NULL (used for prepared statements, I think)
  0x07: "TIMESTAMP", // aka TIMESTAMP
  0x08: "LONGLONG", // aka BIGINT, 8 bytes
  0x09: "INT24", // aka MEDIUMINT, 3 bytes
  0x0a: "DATE", // aka DATE
  0x0b: "TIME", // aka TIME
  0x0c: "DATETIME", // aka DATETIME
  0x0d: "YEAR", // aka YEAR, 1 byte (don't ask)
  0x0e: "NEWDATE", // aka ?
  0x0f: "VARCHAR", // aka VARCHAR (?)
  0x10: "BIT", // aka BIT, 1-8 byte
  0xf5: "JSON",
  0xf6: "NEWDECIMAL", // aka DECIMAL
  0xf7: "ENUM", // aka ENUM
  0xf8: "SET", // aka SET
  0xf9: "TINY_BLOB", // aka TINYBLOB, TINYTEXT
  0xfa: "MEDIUM_BLOB", // aka MEDIUMBLOB, MEDIUMTEXT
  0xfb: "LONG_BLOB", // aka LONGBLOG, LONGTEXT
  0xfc: "BLOB", // aka BLOB, TEXT
  0xfd: "VAR_STRING", // aka VARCHAR, VARBINARY
  0xfe: "STRING", // aka CHAR, BINARY
  0xff: "GEOMETRY", // aka GEOMETRY
};

function mapDataType(columnType: number): ColumnType {
  // List of all column type
  // https://dev.mysql.com/doc/dev/mysql-server/latest/field__types_8h_source.html
  if (columnType === MySQLType.MYSQL_TYPE_JSON) {
    return ColumnType.TEXT;
  } else if (
    [
      MySQLType.MYSQL_TYPE_TINY,
      MySQLType.MYSQL_TYPE_SHORT,

      MySQLType.MYSQL_TYPE_LONGLONG,
      MySQLType.MYSQL_TYPE_INT24,
      MySQLType.MYSQL_TYPE_BIT,
    ].includes(columnType)
  ) {
    return ColumnType.INTEGER;
  } else if (
    [
      MySQLType.MYSQL_TYPE_LONG,
      MySQLType.MYSQL_TYPE_FLOAT,
      MySQLType.MYSQL_TYPE_DOUBLE,
    ].includes(columnType)
  ) {
    return ColumnType.REAL;
  } else if (
    [MySQLType.MYSQL_TYPE_DECIMAL, MySQLType.MYSQL_TYPE_NEWDECIMAL].includes(
      columnType
    )
  ) {
    return ColumnType.REAL;
  } else if (
    [
      MySQLType.MYSQL_TYPE_GEOMETRY,
      MySQLType.MYSQL_TYPE_MEDIUM_BLOB,
      MySQLType.MYSQL_TYPE_LONG_BLOB,
    ].includes(columnType)
  ) {
    return ColumnType.TEXT;
  } else if ([MySQLType.MYSQL_TYPE_DATE].includes(columnType)) {
    return ColumnType.TEXT;
  } else if (
    [MySQLType.MYSQL_TYPE_TIME, MySQLType.MYSQL_TYPE_TIME2].includes(columnType)
  ) {
    return ColumnType.TEXT;
  } else if (
    [
      MySQLType.MYSQL_TYPE_DATETIME,
      MySQLType.MYSQL_TYPE_DATETIME2,
      MySQLType.MYSQL_TYPE_TIMESTAMP,
      MySQLType.MYSQL_TYPE_TIMESTAMP2,
    ].includes(columnType)
  ) {
    return ColumnType.TEXT;
  }

  return ColumnType.TEXT;
}

interface ColumnDefinition {
  _buf: Buffer;
  _orgTableLength: number;
  _orgTableStart: number;
  _orgNameLength: number;
  _orgNameStart: number;
  type: number;
  typeName: string;
  name: string;
  flags: number;
}

export function transformMySQLResult(mysqlResult: any): ResultSet {
  const typedResult = mysqlResult as [QueryResult, FieldPacket[]];
  const [result, fieldsets] = typedResult;

  // If it is not an array, it means
  // it is not a SELECT statement
  if (!Array.isArray(result)) {
    return {
      headers: [],
      rows: [],
      stat: {
        queryDurationMs: null,
        rowsAffected: result.affectedRows,
        rowsRead: null,
        rowsWritten: null,
      },
      lastInsertRowid: result.insertId,
    };
  }

  return {
    ...transformArrayBasedResult({
      rows: result as unknown as unknown[][],
      headers: fieldsets,
      headersMapper: (header) => {
        const field = header as unknown as ColumnDefinition;

        const tableName = field._orgTableLength
          ? field._buf
              .subarray(
                field._orgTableStart,
                field._orgTableStart + field._orgTableLength
              )
              .toString()
          : undefined;

        const databaseNameLength = field._buf[13];
        const databaseName =
          databaseNameLength > 0
            ? field._buf.subarray(14, 14 + databaseNameLength).toString()
            : undefined;

        const fieldName = field._orgNameLength
          ? field._buf
              .subarray(
                field._orgNameStart,
                field._orgNameStart + field._orgNameLength
              )
              .toString()
          : undefined;

        return {
          name: field.name,
          type: mapDataType(field.type),
          originalType: mapDataName[field.type],
          schema: databaseName,
          table: tableName,
          originalName: fieldName,
          primaryKey: !!(field.flags & 0x2),
        };
      },
      transformValue(value, header) {
        if (header.originalType === "json") {
          return JSON.stringify(value as string);
        } else if (
          header.originalType === "blob" ||
          header.originalType === "medium_blob" ||
          header.originalType === "long_blob" ||
          header.originalType === "tiny_blob"
        ) {
          if (typeof value === "string") {
            return value;
          } else {
            return [...new Uint8Array(value as Buffer)];
          }
        } else if (header.originalType === "geometry") {
          const point = value as { x: number; y: number };
          if (!Array.isArray(point) && point.x !== undefined) {
            return `POINT(${point.x} ${point.y})`;
          } else {
            return value;
          }
        } else {
          return value;
        }
      },
    }),
    lastInsertRowid: undefined,
    stat: {
      queryDurationMs: null,
      rowsAffected: null,
      rowsRead: null,
      rowsWritten: null,
    },
  };
}
