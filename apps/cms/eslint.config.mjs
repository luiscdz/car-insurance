// @ts-check
import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
  {
    ignores: [
      'dist/',
      'build/',
      'coverage/',
      '.strapi/',
      '.tmp/',
      'types/generated/',
      'public/',
      'src/admin/',
      'database/migrations/',
    ],
  },
  eslint.configs.recommended,
  tseslint.configs.strict,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
);
