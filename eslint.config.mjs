import globals from "globals";
import js from "@eslint/js";
import { defineConfig } from "eslint/config";

export default defineConfig([
  // Core recommended rules (includes no-undef, no-unused-vars, etc.)
  js.configs.recommended,

  // Node backend files
  {
    files: ["backend/**/*.js"],
    languageOptions: {
      sourceType: "commonjs",
      globals: { ...globals.node },
    },
  },

  // Browser/frontend files
  {
    files: ["pages/**/*.js", "public/**/*.js"],
    languageOptions: {
      sourceType: "commonjs",
      globals: { ...globals.browser },
    },
  },
]);