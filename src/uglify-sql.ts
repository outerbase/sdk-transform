import { Token } from "./type";

export function uglifySql(tokens: Token[]): string {
  return tokens
    .map((token) => {
      if (token.type === "WHITESPACE") return " ";
      return token.value;
    })
    .join("");
}
