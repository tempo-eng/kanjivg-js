/**
 * KanjiVG Core Library
 * 
 * Core functionality without React dependencies for browser usage
 */

// Core classes
export { KanjiVG } from './kanjivg';
export { SVGRenderer } from './svg-renderer';
export { DataLoader } from './data-loader';

// Import for internal use
import { KanjiVG } from './kanjivg';

// Auto-loading functionality
let defaultKanjiVG: KanjiVG | null = null;

/**
 * Get the default KanjiVG instance with auto-loaded data
 * This function automatically loads the bundled dataset
 */
export async function getKanjiVG(): Promise<KanjiVG> {
  if (defaultKanjiVG) {
    return defaultKanjiVG;
  }
  
  const data = await loadBundledData();
  defaultKanjiVG = new KanjiVG(data);
  return defaultKanjiVG;
}

/**
 * Create a KanjiVG instance with custom data
 * @param data - The kanji data object
 * @returns A new KanjiVG instance
 */
export function createKanjiVG(data: any): KanjiVG {
  return new KanjiVG(data);
}

/**
 * Load the bundled kanji data asynchronously
 * This function automatically loads the data files included in the package
 */
async function loadBundledData(): Promise<any> {
  // In a browser environment, we'll need to fetch the data
  // In Node.js, we can use require/import
  if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
    // Browser environment - try multiple possible paths
    const possiblePaths = [
      '../data/kanjivg-data.json', // From dist directory
      './data/kanjivg-data.json',    // From current directory
      '/data/kanjivg-data.json'     // Absolute path
    ];
    
    for (const dataPath of possiblePaths) {
      try {
        const response = await fetch(dataPath);
        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        // Continue to next path
        continue;
      }
    }
    
    throw new Error(`Failed to load data from any of these paths: ${possiblePaths.join(', ')}`);
  } else {
    // Node.js environment (including Jest)
    const fs = await import('fs');
    const path = await import('path');
    
    // Define __dirname for ES modules
    let __dirname: string;
    if (typeof (global as any).__dirname !== 'undefined') {
      // Try to use global __dirname first (CommonJS)
      __dirname = (global as any).__dirname;
    } else {
      // Fallback for ES modules
      const { fileURLToPath } = await import('url');
      __dirname = path.default.dirname(fileURLToPath(import.meta.url));
    }
    
    // Try multiple possible paths for the data file
    const possiblePaths = [
      path.default.join(__dirname, 'data/kanjivg-data.json'), // From project root
      path.default.join(__dirname, '../data/kanjivg-data.json'), // From dist directory
      path.default.join(__dirname, '../../data/kanjivg-data.json') // From nested dist
    ];
    
    let dataPath: string | null = null;
    for (const testPath of possiblePaths) {
      if (fs.default.existsSync(testPath)) {
        dataPath = testPath;
        break;
      }
    }
    
    if (!dataPath) {
      throw new Error(`Could not find kanjivg-data.json in any of these locations: ${possiblePaths.join(', ')}`);
    }
    
    const data = JSON.parse(fs.default.readFileSync(dataPath, 'utf8'));
    return data;
  }
}
