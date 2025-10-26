import { KanjiData, Kanji, StrokeGroup, Stroke } from './types';

/**
 * Data loader for KanjiVG data
 * Handles loading and parsing of SVG files and index data
 */
export class DataLoader {
  private baseUrl: string;
  private cache: Map<string, Kanji> = new Map();

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
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
   * Load a single kanji from SVG file
   */
  async loadKanjiFromSVG(svgUrl: string): Promise<Kanji | null> {
    if (this.cache.has(svgUrl)) {
      return this.cache.get(svgUrl)!;
    }

    try {
      const response = await fetch(svgUrl);
      const svgContent = await response.text();
      const kanji = this.parseSVG(svgContent);
      
      if (kanji) {
        this.cache.set(svgUrl, kanji);
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
}
