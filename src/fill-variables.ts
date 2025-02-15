import { SupportedDialect, Token } from "./type";
import { escapeSqlValue } from "./escapeSqlValue";
import { tokenizeSql } from "./tokenize-sql";

export function fillVariables(
  sql: string,
  variables: object,
  dialect: SupportedDialect
): string {
  const tokens = tokenizeSql(sql, dialect).map((token) => {
    let placeholder = "";
    if (token.type === "PLACEHOLDER") {
      placeholder = token.value.slice(1);
    } else if (token.type === "OUTERBASE_PLACEHOLDER") {
      placeholder = token.value.slice(2, -2);
    }
    if (placeholder === "") return token;

    const variableValue = variables[placeholder];

    if (variableValue === undefined) return token;

    return {
      type: token.type,
      value: escapeSqlValue(variableValue),
    };
  });
  return tokens.map((token) => token.value).join("");
}
