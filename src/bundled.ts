/**
 * KanjiVG Bundled Library
 * 
 * Browser version with bundled data - no external files needed
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

// Import the bundled data
import bundledData from '../data/bundled-kanji-data.json';
import { KanjiVG } from './kanjivg';
import type { KanjiData, Kanji } from './types';

// Cache entry interface
interface CacheEntry {
  kanji: Kanji;
  lastAccessed: number;
}

// Create a bundled data loader that uses the imported data
class BundledDataLoader {
  private bundledData: KanjiData;
  private cache: Map<string, CacheEntry> = new Map();
  private maxCacheSize: number;

  constructor(maxCacheSize: number = 50) {
    this.bundledData = bundledData as unknown as KanjiData;
    this.maxCacheSize = maxCacheSize;
  }

  async loadIndividualKanjiData(): Promise<KanjiData> {
    // Return a proxy object that loads individual kanji on-demand
    return {
      kanji: new Proxy({} as Record<string, Kanji>, {
        get: (target, prop) => {
          if (typeof prop === 'string') {
            return this.getIndividualKanji(prop);
          }
          return target[prop as unknown as keyof typeof target];
        },
        has: (target, prop) => {
          if (typeof prop === 'string') {
            return this.hasIndividualKanji(prop);
          }
          return prop in target;
        },
        ownKeys: () => {
          return [];
        }
      }),
      index: this.bundledData.index
    };
  }

  private async getIndividualKanji(code: string): Promise<Kanji | undefined> {
    // Check cache first
    if (this.cache.has(code)) {
      const entry = this.cache.get(code)!;
      // Update last accessed time for LRU
      entry.lastAccessed = Date.now();
      return entry.kanji;
    }

    // Get kanji from bundled data
    const kanji = this.bundledData.kanji[code];
    if (!kanji) {
      return undefined;
    }

    // Add to cache
    this.addToCache(code, kanji);
    return kanji;
  }

  private hasIndividualKanji(code: string): boolean {
    return this.bundledData.kanji[code] !== undefined;
  }

  private addToCache(code: string, kanji: Kanji): void {
    // If cache is at max size, evict least recently used
    if (this.cache.size >= this.maxCacheSize) {
      this.evictLRU();
    }

    // Add new entry
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

  // Cache management methods
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
    while (this.cache.size > this.maxCacheSize) {
      this.evictLRU();
    }
  }
}

// Factory function for easy initialization
export async function createKanjiVG(maxCacheSize: number = 50): Promise<KanjiVG> {
  const loader = new BundledDataLoader(maxCacheSize);
  const data = await loader.loadIndividualKanjiData();
  return new KanjiVG(data, loader as any);
}

// Legacy compatibility function
export async function getKanjiVG(maxCacheSize: number = 50): Promise<KanjiVG> {
  return createKanjiVG(maxCacheSize);
}