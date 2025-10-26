/**
 * KanjiVG Browser-Only Library
 * 
 * Browser-specific version that avoids Node.js modules entirely
 */

// Core classes
export { KanjiVG } from './kanjivg';
export { SVGRenderer } from './svg-renderer';
export { DataLoader } from './data-loader';

// React components
export {
  KanjiSVG,
  KanjiCard,
  useKanjiVG
} from './react-components';

// Types
export type {
  Kanji,
  KanjiInfo,
  KanjiData,
  Stroke,
  StrokeGroup,
  StrokeOrderOptions,
  AnimationState,
  ComponentInfo,
  LookupOptions,
  KanjiSVGProps,
  KanjiCardProps
} from './types';

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
  
  // Load data using dynamic import - this will work in browser environments
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
 * Browser-only version that uses dynamic import
 */
async function loadBundledData(): Promise<any> {
  try {
    // Try to dynamically import the data file
    // This works when the data files are properly bundled/included
    const dataModule = await import('../data/kanjivg-data.json');
    return dataModule.default || dataModule;
  } catch (error) {
    // Fallback: try to fetch the data file
    const possiblePaths = [
      '../data/kanjivg-data.json',
      './data/kanjivg-data.json',
      '/data/kanjivg-data.json'
    ];
    
    for (const dataPath of possiblePaths) {
      try {
        const response = await fetch(dataPath);
        if (response.ok) {
          return await response.json();
        }
      } catch (fetchError) {
        continue;
      }
    }
    
    throw new Error(`Failed to load KanjiVG data. Please ensure the data files are accessible.`);
  }
}

// Version
export const VERSION = '1.0.0';
