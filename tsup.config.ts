import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  clean: true,
  minify: true,
  treeshake: true,
  dts: true,
  format: ["cjs"], // 👈 Node
});
