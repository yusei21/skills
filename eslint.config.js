const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
    {
        ignores: ['.opencode/dist/**', '.cursor/**', 'node_modules/**', '.venv/**', 'venv/**', 'coverage/**', 'workflows/**/*.workflow.*', '.claude/workflows/**']
    },
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'commonjs',
            globals: {
                ...globals.node,
                ...globals.es2022
            }
        },
        rules: {
            'no-unused-vars': ['error', {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_',
                caughtErrorsIgnorePattern: '^_'
            }],
            'no-undef': 'error',
            'eqeqeq': 'warn',
            'prefer-const': 'warn',
            'no-var': 'warn',
            'no-console': 'off',
            'complexity': ['warn', 20],
            'max-depth': ['warn', 5],
            'max-params': ['warn', 6],
            // New in @eslint/js 10's recommended set; kept as errors.
            'preserve-caught-error': 'error',
            'no-useless-assignment': 'error'
        }
    },
    {
        // Eval scenarios and graders are copied verbatim into the eval corpora
        // (docker/context-profiles/complex-corpus-v4.json); editing them here
        // would desync the corpus, so this one style rule is off for them.
        files: ['docker/context-profiles/complex-eval/**', 'docker/gateguard-effectiveness/scenarios/**'],
        rules: {
            'no-useless-assignment': 'off'
        }
    },
    {
        files: ['**/*.mjs'],
        languageOptions: {
            sourceType: 'module'
        }
    },
    {
        files: ['docker/context-profiles/complex-eval/**/recurring-incident/**/*.js'],
        languageOptions: {
            sourceType: 'module'
        }
    }
];
