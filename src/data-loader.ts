import { KanjiData, Kanji, StrokeGroup, Stroke } from './types';

interface LookupIndex {
  [kanjiCode: string]: string; // kanji code -> file path
}

/**
 * Data loader for KanjiVG data
 * Handles loading and parsing of SVG files and index data
 */
interface CacheEntry {
  kanji: Kanji;
  lastAccessed: number;
}

export class DataLoader {
  private baseUrl: string;
  private cache: Map<string, CacheEntry> = new Map();
  private lookupIndex: LookupIndex | null = null;
  private maxCacheSize: number;

  constructor(baseUrl: string = '', maxCacheSize: number = 50) {
    this.baseUrl = baseUrl;
    this.maxCacheSize = maxCacheSize;
  }

  /**
   * Load kanji data from a URL
   */
  async loadKanjiData(indexUrl: string, svgBaseUrl?: string): Promise<KanjiData> {
    const indexResponse = await fetch(indexUrl);
    const index = await indexResponse.json();

    const kanji: Record<string, Kanji> = {};
    const svgUrl = svgBaseUrl || this.baseUrl;

    // Load a subset of kanji for testing (in production, you'd load all)
    const sampleCodes = Object.values(index).flat().slice(0, 100) as string[];
    
    for (const svgFile of sampleCodes) {
      try {
        const code = svgFile.replace('.svg', '');
        const kanjiData = await this.loadKanjiFromSVG(`${svgUrl}/${svgFile}`);
        if (kanjiData) {
          kanji[code] = kanjiData;
        }
      } catch (error) {
        console.warn(`Failed to load kanji from ${svgFile}:`, error);
      }
    }

    return { kanji, index };
  }

  /**
   * Load pre-converted kanji data from JSON files
   */
  async loadKanjiDataFromJSON(dataUrl: string, indexUrl: string): Promise<KanjiData> {
    const [dataResponse, indexResponse] = await Promise.all([
      fetch(dataUrl),
      fetch(indexUrl)
    ]);
    
    const kanji = await dataResponse.json();
    const index = await indexResponse.json();

    return { kanji, index };
  }

  /**
   * Load individual kanji data (memory-efficient)
   */
  async loadIndividualKanjiData(lookupIndexUrl: string, individualBaseUrl?: string): Promise<KanjiData> {
    const individualUrl = individualBaseUrl || `${this.baseUrl}/individual`;
    
    // Load lookup index
    if (!this.lookupIndex) {
      const indexResponse = await fetch(lookupIndexUrl);
      this.lookupIndex = await indexResponse.json();
    }

    // Return a proxy object that loads individual kanji files on-demand
    return {
      kanji: new Proxy({} as Record<string, Kanji>, {
        get: (target, prop) => {
          if (typeof prop === 'string') {
            return this.getIndividualKanji(prop, individualUrl);
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
          // This is expensive, so we'll implement a different approach
          return [];
        }
      }),
      index: await this.loadCharacterIndex()
    };
  }

  /**
   * Get a single kanji from individual file (loads file if needed)
   */
  private async getIndividualKanji(code: string, individualBaseUrl: string): Promise<Kanji | undefined> {
    // Check cache first
    if (this.cache.has(code)) {
      const entry = this.cache.get(code)!;
      // Update last accessed time for LRU
      entry.lastAccessed = Date.now();
      return entry.kanji;
    }

    // Find which file contains this kanji
    const filePath = this.lookupIndex?.[code];
    if (!filePath) {
      return undefined;
    }

    try {
      const response = await fetch(`${individualBaseUrl}/${filePath}`);
      const kanji = await response.json();
      
      if (kanji) {
        this.addToCache(code, kanji);
      }
      
      return kanji;
    } catch (error) {
      console.error(`Failed to load kanji ${code} from ${filePath}:`, error);
      return undefined;
    }
  }

  /**
   * Add kanji to cache with LRU eviction
   */
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

  /**
   * Evict least recently used kanji from cache
   */
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

  /**
   * Check if a kanji exists in individual files
   */
  private hasIndividualKanji(code: string): boolean {
    return this.lookupIndex?.[code] !== undefined;
  }

  /**
   * Load character index
   */
  private async loadCharacterIndex(): Promise<Record<string, string[]>> {
    // For individual file mode, we don't have a pre-built character index
    // Return empty index - character lookup will work via the lookup index
    return {};
  }

  /**
   * Load a single kanji from SVG file
   */
  async loadKanjiFromSVG(svgUrl: string): Promise<Kanji | null> {
    if (this.cache.has(svgUrl)) {
      return this.cache.get(svgUrl)!.kanji;
    }

    try {
      const response = await fetch(svgUrl);
      const svgContent = await response.text();
      const kanji = this.parseSVG(svgContent);
      
      if (kanji) {
        this.cache.set(svgUrl, {
          kanji,
          lastAccessed: Date.now()
        });
      }
      
      return kanji;
    } catch (error) {
      console.error(`Error loading SVG from ${svgUrl}:`, error);
      return null;
    }
  }

  /**
   * Parse SVG content to extract kanji data
   */
  private parseSVG(svgContent: string): Kanji | null {
    try {
      // Simple SVG parsing - in production, use a proper XML parser
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgContent, 'image/svg+xml');
      
      const strokeGroup = doc.querySelector('g[id^="kvg:StrokePaths_"]');
      if (!strokeGroup) {
        return null;
      }

      const id = strokeGroup.getAttribute('id');
      if (!id) {
        return null;
      }

      const code = id.replace('kvg:StrokePaths_', '');
      const character = String.fromCharCode(parseInt(code, 16));

      const kanji: Kanji = {
        code,
        character,
        strokes: this.parseStrokeGroup(strokeGroup)
      };

      return kanji;
    } catch (error) {
      console.error('Error parsing SVG:', error);
      return null;
    }
  }

  /**
   * Parse a stroke group from DOM element
   */
  private parseStrokeGroup(element: Element): StrokeGroup {
    const result: StrokeGroup = {
      id: element.getAttribute('id') || '',
      groups: [],
      strokes: []
    };

    // Parse attributes
    const attrs = [
      'kvg:element', 'kvg:original', 'kvg:part', 'kvg:number',
      'kvg:variant', 'kvg:partial', 'kvg:tradForm', 'kvg:radicalForm',
      'kvg:position', 'kvg:radical', 'kvg:phon'
    ];

    for (const attr of attrs) {
      const value = element.getAttribute(attr);
      if (value) {
        switch (attr) {
          case 'kvg:element':
            result.element = value;
            break;
          case 'kvg:original':
            result.original = value;
            break;
          case 'kvg:part':
            result.part = parseInt(value);
            break;
          case 'kvg:number':
            result.number = parseInt(value);
            break;
          case 'kvg:variant':
            result.variant = value === 'true';
            break;
          case 'kvg:partial':
            result.partial = value === 'true';
            break;
          case 'kvg:tradForm':
            result.tradForm = value === 'true';
            break;
          case 'kvg:radicalForm':
            result.radicalForm = value === 'true';
            break;
          case 'kvg:position':
            result.position = value;
            break;
          case 'kvg:radical':
            result.radical = value;
            break;
          case 'kvg:phon':
            result.phon = value;
            break;
        }
      }
    }

    // Parse child groups
    const childGroups = element.querySelectorAll('g[id^="kvg:"]');
    for (const child of childGroups) {
      if (child !== element) {
        result.groups.push(this.parseStrokeGroup(child));
      }
    }

    // Parse strokes
    const strokes = element.querySelectorAll('path[id*="-s"]');
    for (const stroke of strokes) {
      const id = stroke.getAttribute('id');
      const type = stroke.getAttribute('kvg:type');
      const path = stroke.getAttribute('d');
      
      if (id && path) {
        result.strokes.push({
          type: type || undefined,
          path
        });
      }
    }

    return result;
  }

  /**
   * Load kanji data from local files (for Node.js environments)
   */
  async loadKanjiDataFromFiles(indexPath: string, svgDir: string): Promise<KanjiData> {
    // This would be implemented for Node.js environments
    // using fs module to read local files
    throw new Error('loadKanjiDataFromFiles not implemented for browser environment');
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * Get maximum cache size
   */
  getMaxCacheSize(): number {
    return this.maxCacheSize;
  }

  /**
   * Set maximum cache size
   */
  setMaxCacheSize(size: number): void {
    this.maxCacheSize = size;
    
    // If new size is smaller, evict excess entries
    while (this.cache.size > this.maxCacheSize) {
      this.evictLRU();
    }
  }
}
