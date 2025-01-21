import { ColumnHeader } from "./type";

interface ArrayBasedTransformProps<HeaderType> {
  rows: unknown[][];
  headers: HeaderType[];
  headersMapper: (
    header: HeaderType,
    headerIdx: number
  ) => {
    name: string;
    type?: number;
    originalType: string | null;
    schema?: string | undefined;
    table?: string | undefined;
    originalName?: string | undefined;
    primaryKey?: boolean | undefined;
    columnId?: number | undefined; // for Postgres
    tableId?: number | undefined; // for Postgres
  };
  transformValue?: (value: unknown, header: ColumnHeader) => unknown;
}

export function transformArrayBasedResult<HeaderType>({
  headers,
  headersMapper,
  rows,
  transformValue,
}: ArrayBasedTransformProps<HeaderType>) {
  // Building the headers
  const usedColumnName = new Set();

  const headerMap: ColumnHeader[] = headers.map((header, headerIdx) => {
    const {
      name,
      type,
      originalType,
      schema,
      table,
      originalName,
      primaryKey,
      columnId,
      tableId,
    } = headersMapper(header, headerIdx);
    let finalColumnName = name;

    // We got the duplicated column name, let try to find it a new name
    if (usedColumnName.has(finalColumnName)) {
      // If there is table name, let use it as prefix
      for (let i = 1; i < 100; i++) {
        if (usedColumnName.has(finalColumnName)) {
          finalColumnName = `${name}${i}`;
        } else {
          break;
        }
      }
    }

    // Hope we don't run into this situation.
    if (usedColumnName.has(finalColumnName)) {
      throw new Error("Cannot find unique column name");
    }

    usedColumnName.add(finalColumnName);
    return {
      name: finalColumnName,
      displayName: name,
      type,
      originalType,
      schema,
      table,
      originalName,
      primaryKey,
      columnId,
      tableId,
    };
  });

  // Mapping the data
  const data = rows.map((row) => {
    return headerMap.reduce((acc, header, index) => {
      acc[header.name] = transformValue
        ? transformValue(row[index], header)
        : row[index];
      return acc;
    }, {} as Record<string, unknown>);
  });

  return {
    rows: data,
    headers: headerMap,
  };
}
