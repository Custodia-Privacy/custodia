import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import reactHooks from "eslint-plugin-react-hooks";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // Re-declare react-hooks plugin so our rule overrides below can
    // reference its rules. ESLint flat config requires the plugin to
    // be bound within the same object as the rule overrides, even when
    // extended configs (eslint-config-next) already registered it.
    plugins: {
      "react-hooks": reactHooks,
    },
    // Project-level rule overrides.
    //
    // These are all downgraded from `error` to `warn` — not because the
    // signal is worthless, but because they flag patterns (not bugs) that
    // are sprinkled across the codebase and would block every deploy if
    // treated as fatal. We surface them as warnings so new instances stay
    // visible and discouraged. Cleanup tracked in the backlog.
    //
    //   no-explicit-any: code-smell lint (~100 instances in tests, agents,
    //     scanner glue). Not a correctness bug.
    //
    //   react-hooks/set-state-in-effect: React 19 compiler rule. Flags
    //     setState called synchronously inside useEffect. Common and
    //     valid pattern for initializing derived state from server data.
    //     The compiler would love us to rewrite to derived-state-inline
    //     or reducer patterns, but that's a refactor, not a fix.
    //
    //   react-hooks/purity: React 19 compiler rule. Flags impure calls
    //     "during render". Has known false positives on event-handler
    //     closures defined in the component body (e.g. Date.now() inside
    //     an onClick handler registered via const fn = () => {...}).
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
    },
  },
]);

export default eslintConfig;
