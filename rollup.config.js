const typescript = require('@rollup/plugin-typescript');
const resolve = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const copy = require('rollup-plugin-copy');
const replace = require('@rollup/plugin-replace');

// Rollup plugin to keep React components as source for development
const keepSource = () => ({
  name: 'keep-source',
  generateBundle(options, bundle) {
    // Don't bundle React components, just copy source files
    Object.keys(bundle).forEach(key => {
      if (key.includes('react') && bundle[key].isEntry) {
        delete bundle[key];
      }
    });
  }
});

module.exports = [
  // Core library build - CJS (Node): allow fs usage
  {
    input: 'src/core/index.ts',
    output: [
      {
        file: 'dist/index.js',
        format: 'cjs',
        sourcemap: true,
      },
    ],
    plugins: [
      replace({ preventAssignment: true, values: { __BROWSER__: 'false' } }),
      resolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: './dist',
      }),
      copy({
        targets: [
          { src: 'kanji/**/*', dest: 'dist/kanji' },
          { src: 'kvg-index.json', dest: 'dist' },
        ],
      }),
    ],
    external: ['react', 'react-dom'],
  },
  // Core library build - ESM (Browser): strip fs branches
  {
    input: 'src/core/index.ts',
    output: [
      {
        file: 'dist/index.esm.js',
        format: 'esm',
        sourcemap: true,
      },
    ],
    plugins: [
      replace({ preventAssignment: true, values: { __BROWSER__: 'true' } }),
      resolve({ preferBuiltins: false }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
      }),
      copy({
        targets: [
          { src: 'kanji/**/*', dest: 'dist/kanji' },
          { src: 'kvg-index.json', dest: 'dist' },
        ],
      }),
    ],
    external: ['react', 'react-dom'],
  },
  // React components build  
  {
    input: 'src/components/index.ts',
    output: [
      {
        file: 'dist/react.js',
        format: 'cjs',
        sourcemap: true,
        globals: {
          'react': 'React',
          'react-dom': 'ReactDOM',
        },
      },
      {
        file: 'dist/react.esm.js',
        format: 'esm',
        sourcemap: true,
      },
    ],
    plugins: [
      replace({ preventAssignment: true, values: { 'process.env.NODE_ENV': JSON.stringify('production') } }),
      resolve({ preferBuiltins: false }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: './dist',
      }),
    ],
    external: ['react', 'react-dom', 'react/jsx-runtime'],
  },
];
