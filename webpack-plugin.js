/**
 * Webpack plugin for kvg-js
 * Automatically copies kanji SVG files and index files to the public directory
 */

const { cpSync, mkdirSync, existsSync } = require('fs');
const { join } = require('path');

class KvgJsPlugin {
  constructor(options = {}) {
    this.options = options;
  }

  apply(compiler) {
    const pluginName = 'KvgJsPlugin';

    compiler.hooks.beforeCompile.tap(pluginName, (compilationParams) => {
      // Only run once
      if (this.done) return;
      this.done = true;

      // Get the public directory (usually 'public' or 'build')
      const publicDir = this.options.publicDir || 'public';
      
      try {
        // Create public directory if it doesn't exist
        if (!existsSync(publicDir)) {
          mkdirSync(publicDir, { recursive: true });
        }

        // Copy kanji directory
        const kanjiSrc = join(process.cwd(), 'node_modules/kvg-js/dist/kanji');
        const kanjiDest = join(publicDir, 'kanji');
        
        if (existsSync(kanjiSrc)) {
          cpSync(kanjiSrc, kanjiDest, { recursive: true });
          console.log('✓ Copied kanji files to public/');
        }

        // Copy index files
        const indexSrc = join(process.cwd(), 'node_modules/kvg-js/dist/kvg-index.json');
        const indexDest = join(publicDir, 'kvg-index.json');
        
        if (existsSync(indexSrc)) {
          cpSync(indexSrc, indexDest);
          console.log('✓ Copied kvg-index.json');
        }

        const radicalSrc = join(process.cwd(), 'node_modules/kvg-js/radical-index.json');
        const radicalDest = join(publicDir, 'radical-index.json');
        
        if (existsSync(radicalSrc)) {
          cpSync(radicalSrc, radicalDest);
          console.log('✓ Copied radical-index.json');
        }
      } catch (error) {
        console.warn('Could not copy kvg-js files:', error);
      }
    });
  }
}

module.exports = KvgJsPlugin;

