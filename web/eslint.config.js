// Reglas de dependencia entre features (docs/arquitectura.md, sección 4).
import tseslint from "typescript-eslint";

export default tseslint.config(
  { files: ["src/**/*.{ts,tsx}"], languageOptions: { parser: tseslint.parser } },
  {
    files: ["src/features/**/*.{ts,tsx}", "src/app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{ regex: "^@/features/[^/]+/.+", message: "Importa solo desde el index.ts de la feature." }],
      }],
    },
  },
  {
    files: ["src/shared/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{ regex: "^@/(features|app)(/|$)", message: "shared no depende de features ni de app." }],
      }],
    },
  },
);
