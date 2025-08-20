import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Relax TypeScript rules for deployment
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-unsafe-function-type": "warn",

      // Relax Next.js rules
      "@next/next/no-html-link-for-pages": "warn",

      // Relax React rules
      "react-hooks/exhaustive-deps": "warn",

      // General JavaScript rules
      "no-var": "warn"
    }
  }
];

export default eslintConfig;