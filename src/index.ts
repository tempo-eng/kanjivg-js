/**
 * KanjiVG Library
 * 
 * Main entry point - uses individual kanji files for lightweight loading
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

// Utilities
export * from './utils';

// Import KanjiVG for factory function
import { KanjiVG } from './kanjivg';
import type { KanjiVG as IKanjiVG } from './kanjivg';
import type { KanjiData, Kanji } from './types';

// Import lookup index at build time so it gets bundled
import lookupIndex from '../data/lookup-index.json';
import { DataLoader } from './data-loader';

// Cache entry interface
interface CacheEntry {
  kanji: Kanji;
  lastAccessed: number;
}

// Create a loader that uses individual files with LRU cache
class IndividualDataLoader {
  private lookupIndex: Record<string, string>;
  private cache: Map<string, CacheEntry> = new Map();
  private maxCacheSize: number;
  private baseUrl: string;

  constructor(baseUrl: string, maxCacheSize: number = 50) {
    this.lookupIndex = lookupIndex;
    this.maxCacheSize = maxCacheSize;
    this.baseUrl = baseUrl;
  }

  async loadIndividualKanjiData(): Promise<KanjiData> {
    console.log('loadIndividualKanjiData: Using proxy with baseUrl:', this.baseUrl);
    console.log('loadIndividualKanjiData: Lookup index has', Object.keys(this.lookupIndex).length, 'entries');
    
    // Return a proxy that loads individual files on demand
    return {
      kanji: new Proxy({} as Record<string, Kanji>, {
        get: (target, prop) => {
          if (typeof prop === 'string') {
            console.log('Proxy.get: Requesting kanji', prop);
            return this.getIndividualKanji(prop);
          }
          return target[prop as unknown as keyof typeof target];
        },
        has: (target, prop) => {
          if (typeof prop === 'string') {
            return this.lookupIndex[prop] !== undefined;
          }
          return prop in target;
        },
        ownKeys: (target) => {
          console.log('Proxy.ownKeys: Returning', Object.keys(this.lookupIndex).length, 'keys');
          return Object.keys(this.lookupIndex);
        },
        getOwnPropertyDescriptor: (target, prop) => {
          if (typeof prop === 'string' && this.lookupIndex[prop]) {
            return {
              enumerable: true,
              configurable: true,
              value: undefined
            };
          }
          return undefined;
        }
      }),
      index: {} // Empty index for now
    };
  }

  private async getIndividualKanji(code: string): Promise<Kanji | undefined> {
    console.log(`getIndividualKanji: Looking up code ${code}`);
    
    // Check cache first
    if (this.cache.has(code)) {
      console.log(`getIndividualKanji: Found in cache for ${code}`);
      const entry = this.cache.get(code)!;
      entry.lastAccessed = Date.now();
      return entry.kanji;
    }

    // Find which file contains this kanji
    const filePath = this.lookupIndex[code];
    if (!filePath) {
      console.log(`getIndividualKanji: No file path found for ${code}`);
      return undefined;
    }

    try {
      const url = `${this.baseUrl}/${filePath}`;
      console.log(`getIndividualKanji: Fetching from ${url}`);
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`getIndividualKanji: Failed to load ${url}: ${response.status}`);
        return undefined;
      }
      
      const kanji = await response.json();
      console.log(`getIndividualKanji: Successfully loaded ${code}, character: ${kanji?.character || 'unknown'}`);
      
      if (kanji) {
        this.addToCache(code, kanji);
      }
      
      return kanji;
    } catch (error) {
      console.warn(`getIndividualKanji: Failed to load kanji ${code}:`, error);
      return undefined;
    }
  }

  private addToCache(code: string, kanji: Kanji): void {
    if (this.cache.size >= this.maxCacheSize) {
      this.evictLRU();
    }

    this.cache.set(code, {
      kanji,
      lastAccessed: Date.now()
    });
  }

  private evictLRU(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  getCacheSize(): number {
    return this.cache.size;
  }

  clearCache(): void {
    this.cache.clear();
  }

  getMaxCacheSize(): number {
    return this.maxCacheSize;
  }

  setMaxCacheSize(size: number): void {
    this.maxCacheSize = size;
  }
}

// Factory function for easy initialization  
export async function createKanjiVG(maxCacheSize: number = 50, dataBaseUrl: string = '/data'): Promise<IKanjiVG> {
  // Use individual files with on-demand loading and LRU cache
  // Users must copy data/ folder to their public/ directory
  const loader = new IndividualDataLoader(dataBaseUrl, maxCacheSize) as any;
  const data = await loader.loadIndividualKanjiData();
  return new KanjiVG(data, loader);
}

// Legacy compatibility function
export async function getKanjiVG(maxCacheSize: number = 50): Promise<KanjiVG> {
  return createKanjiVG(maxCacheSize);
}

