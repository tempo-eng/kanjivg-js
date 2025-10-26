import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import json from '@rollup/plugin-json';
import { readFileSync } from 'fs';

const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));

export default [
  // Bundled browser bundle (with data included)
  {
    input: 'src/bundled.ts',
    output: [
      {
        file: 'dist/bundled.js',
        format: 'cjs',
        sourcemap: true,
        inlineDynamicImports: true,
      },
      {
        file: 'dist/bundled.esm.js',
        format: 'esm',
        sourcemap: true,
        inlineDynamicImports: true,
      },
    ],
    plugins: [
      resolve({
        browser: true,
      }),
      commonjs(),
      json(),
      typescript({
        tsconfig: './tsconfig.json',
      }),
    ],
    external: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
  },
  // Browser-only bundle (no Node.js modules, no data)
  {
    input: 'src/browser.ts',
    output: [
      {
        file: 'dist/browser.js',
        format: 'cjs',
        sourcemap: true,
        inlineDynamicImports: true,
      },
      {
        file: 'dist/browser.esm.js',
        format: 'esm',
        sourcemap: true,
        inlineDynamicImports: true,
      },
    ],
    plugins: [
      resolve({
        browser: true,
      }),
      commonjs(),
      json(),
      typescript({
        tsconfig: './tsconfig.json',
      }),
    ],
    external: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime', '../data/kanjivg-data.json', './data/kanjivg-data.json'],
  },
  // Core bundle (without React)
  {
    input: 'src/core.ts',
    output: [
      {
        file: 'dist/core.js',
        format: 'cjs',
        sourcemap: true,
      },
      {
        file: 'dist/core.esm.js',
        format: 'esm',
        sourcemap: true,
      },
    ],
    plugins: [
      resolve({
        browser: true,
      }),
      commonjs(),
      json(),
      typescript({
        tsconfig: './tsconfig.json',
      }),
    ],
    external: ['fs', 'path', 'url', 'node:fs', 'node:path', 'node:url', '../data/kanjivg-data.json', './data/kanjivg-data.json'],
  },
  // Full bundle (with React)
  {
    input: 'src/index.ts',
    output: [
      {
        file: packageJson.main,
        format: 'cjs',
        sourcemap: true,
      },
      {
        file: packageJson.module,
        format: 'esm',
        sourcemap: true,
      },
    ],
    plugins: [
      resolve({
        browser: true,
      }),
      commonjs(),
      json(),
      typescript({
        tsconfig: './tsconfig.json',
      }),
    ],
    external: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'fs', 'path', 'url', 'node:fs', 'node:path', 'node:url', '../data/kanjivg-data.json', './data/kanjivg-data.json'],
  },
  {
    input: 'dist/index.d.ts',
    output: [{ file: 'dist/index.d.ts', format: 'esm' }],
    plugins: [dts()],
    external: [/\.css$/],
  },
];
