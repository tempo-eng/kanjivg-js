import { Kanji, KanjiData, KanjiInfo, LookupOptions, ComponentInfo, StrokeGroup, Stroke } from './types';
import { DataLoader } from './data-loader';

/**
 * Main KanjiVG class for kanji lookup and data extraction
 */
export class KanjiVG {
  private data: KanjiData;
  private loader?: DataLoader;

  constructor(data: KanjiData, loader?: DataLoader) {
    this.data = data;
    this.loader = loader;
  }

  /**
   * Create a KanjiVG instance with individual kanji file loading (most memory-efficient)
   */
  static async createIndividual(
    lookupIndexUrl: string, 
    individualBaseUrl?: string, 
    maxCacheSize: number = 50
  ): Promise<KanjiVG> {
    const loader = new DataLoader(individualBaseUrl || '', maxCacheSize);
    const data = await loader.loadIndividualKanjiData(lookupIndexUrl, individualBaseUrl);
    return new KanjiVG(data, loader);
  }

  /**
   * Convert a character or hex code to canonical ID format
   */
  private canonicalId(input: string | number): string {
    let code: number;
    
    if (typeof input === 'string') {
      if (input.length === 1) {
        code = input.charCodeAt(0);
      } else if (input.length >= 2 && input.length <= 5) {
        code = parseInt(input, 16);
      } else {
        throw new Error('Character id must be a 1-character string or 2-5 hex digit unicode codepoint');
      }
    } else {
      code = input;
    }

    if (code > 0xf && code <= 0xfffff) {
      return code.toString(16).padStart(5, '0');
    }
    
    throw new Error('Character id out of range');
  }

  /**
   * Check if a character is a kanji
   */
  private isKanji(char: string): boolean {
    const code = char.charCodeAt(0);
    return (
      (code >= 0x4e00 && code <= 0x9fc3) || // CJK Unified Ideographs
      (code >= 0x3400 && code <= 0x4dbf) || // CJK Extension A
      (code >= 0xf900 && code <= 0xfad9) || // CJK Compatibility Ideographs
      (code >= 0x2e80 && code <= 0x2eff) || // CJK Radicals Supplement
      (code >= 0x20000 && code <= 0x2a6df)  // CJK Extension B
    );
  }


  /**
   * Parse a stroke group from SVG data
   */
  private parseStrokeGroup(group: any): StrokeGroup {
    const result: StrokeGroup = {
      id: group.id || '',
      groups: [],
      strokes: []
    };

    // Parse attributes
    if (group['kvg:element']) result.element = group['kvg:element'];
    if (group['kvg:original']) result.original = group['kvg:original'];
    if (group['kvg:part']) result.part = parseInt(group['kvg:part']);
    if (group['kvg:number']) result.number = parseInt(group['kvg:number']);
    if (group['kvg:variant']) result.variant = group['kvg:variant'] === 'true';
    if (group['kvg:partial']) result.partial = group['kvg:partial'] === 'true';
    if (group['kvg:tradForm']) result.tradForm = group['kvg:tradForm'] === 'true';
    if (group['kvg:radicalForm']) result.radicalForm = group['kvg:radicalForm'] === 'true';
    if (group['kvg:position']) result.position = group['kvg:position'];
    if (group['kvg:radical']) result.radical = group['kvg:radical'];
    if (group['kvg:phon']) result.phon = group['kvg:phon'];

    // Parse children
    if (group.g) {
      const children = Array.isArray(group.g) ? group.g : [group.g];
      for (const child of children) {
        if (child.id && child.id.startsWith('kvg:')) {
          result.groups.push(this.parseStrokeGroup(child));
        }
      }
    }

    // Parse strokes
    if (group.path) {
      const strokes = Array.isArray(group.path) ? group.path : [group.path];
      for (const stroke of strokes) {
        if (stroke.id && stroke.id.startsWith('kvg:') && stroke.id.includes('-s')) {
          result.strokes.push({
            type: stroke['kvg:type'],
            path: stroke.d || ''
          });
        }
      }
    }

    return result;
  }

  /**
   * Get all strokes from a stroke group recursively in correct order
   * This mimics the Python code's behavior where strokes are processed in DOM order
   */
  private getAllStrokes(group: StrokeGroup): Stroke[] {
    let strokes: Stroke[] = [];
    
    // Process children in order (this mimics the Python childs iteration)
    // We need to flatten the structure while preserving the order
    const allChildren = this.flattenChildren(group);
    
    // Extract only strokes from the flattened children
    for (const child of allChildren) {
      if (child.type && child.path) {
        strokes.push(child);
      }
    }
    
    return strokes;
  }

  /**
   * Flatten children while preserving the order they appear in the DOM
   * This mimics the Python code's recursive processing of childs
   */
  private flattenChildren(group: StrokeGroup): any[] {
    const result: any[] = [];
    
    // Process direct strokes first
    for (const stroke of group.strokes) {
      result.push(stroke);
    }
    
    // Then process child groups recursively
    for (const childGroup of group.groups) {
      result.push(...this.flattenChildren(childGroup));
    }
    
    return result;
  }

  /**
   * Extract component information from stroke groups
   */
  private extractComponents(group: StrokeGroup): ComponentInfo[] {
    const components: ComponentInfo[] = [];

    if (group.element) {
      components.push({
        element: group.element,
        position: group.position,
        isRadical: !!(group.radicalForm || group.radical),
        radicalNumber: group.radical,
        isTraditional: group.tradForm || false,
        isVariant: group.variant || false
      });
    }

    for (const childGroup of group.groups) {
      components.push(...this.extractComponents(childGroup));
    }

    return components;
  }

  /**
   * Look up a kanji by character, code, or variant key
   */
  async lookup(input: string | number, options: LookupOptions = {}): Promise<KanjiInfo | null> {
    console.log('KanjiVG.lookup: Input:', input);
    try {
      let key: string;
      
      // If input is a variant key (contains '-'), use it directly
      if (typeof input === 'string' && input.includes('-')) {
        key = input;
      } else {
        // Otherwise, canonicalize the input to get the base code
        key = this.canonicalId(input);
      }
      
      console.log('KanjiVG.lookup: Canonical key:', key);
      console.log('KanjiVG.lookup: About to access this.data.kanji[key]');
      const kanji = await this.data.kanji[key];
      console.log('KanjiVG.lookup: Got kanji:', kanji ? kanji.character : 'null');
      
      if (!kanji) {
        console.log('KanjiVG.lookup: Kanji not found for key:', key);
        return null;
      }

      // Get stroke information - use all_strokes if available, otherwise compute it
      const allStrokes = kanji.all_strokes || this.getAllStrokes(kanji.strokes);
      const components = this.extractComponents(kanji.strokes);
      const radicals = components.filter(c => c.isRadical);

      return {
        character: kanji.character,
        code: kanji.code,
        variant: kanji.variant,
        strokeCount: allStrokes.length,
        strokeTypes: allStrokes.map((s: Stroke) => s.type || ''),
        components,
        radicals,
        svg: this.generateSVG(kanji)
      };
    } catch (error) {
      console.error('Error looking up kanji:', error);
      return null;
    }
  }

  /**
   * Search for kanji by character
   */
  async search(character: string, options: LookupOptions = {}): Promise<KanjiInfo[]> {
    const results: KanjiInfo[] = [];
    const variantKeys = this.data.index[character] || [];
    
    for (const variantKey of variantKeys) {
      const kanji = await this.data.kanji[variantKey];
      if (kanji) {
        const info = await this.lookup(variantKey);
        if (info) {
          results.push(info);
        }
      }
    }

    return options.limit ? results.slice(0, options.limit) : results;
  }

  /**
   * Generate SVG markup for a kanji
   */
  private generateSVG(kanji: Kanji): string {
    // Use the same stroke order as the lookup method
    const allStrokes = kanji.all_strokes || this.getAllStrokes(kanji.strokes);
    
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="109" height="109" viewBox="0 0 109 109" style="fill:none;stroke:#000000;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;">\n`;
    svg += `<g id="kvg:StrokePaths_${kanji.code}" style="fill:none;stroke:#000000;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;">\n`;
    
    for (let i = 0; i < allStrokes.length; i++) {
      const stroke = allStrokes[i];
      svg += `  <path id="kvg:${kanji.code}-s${i + 1}"`;
      if (stroke.type) {
        svg += ` kvg:type="${stroke.type}"`;
      }
      svg += ` d="${stroke.path}"/>\n`;
    }
    
    svg += `</g>\n</svg>`;
    return svg;
  }

  /**
   * Get all available kanji characters
   */
  getAllCharacters(): string[] {
    console.log('getAllCharacters: this.data.index:', this.data.index);
    console.log('getAllCharacters: this.data.kanji:', typeof this.data.kanji, 'keys:', this.data.kanji ? Object.keys(this.data.kanji).length : 'N/A');
    
    // Try to get characters from index first
    const indexChars = Object.keys(this.data.index);
    if (indexChars.length > 0) {
      console.log('getAllCharacters: Returning', indexChars.length, 'characters from index');
      return indexChars;
    }
    
    // If index is empty, we need to load kanji to get characters
    // For now, return empty array - the code should handle this gracefully
    console.log('getAllCharacters: Index is empty, returning empty array');
    return [];
  }

  /**
   * Get the total number of kanji in the database
   */
  getTotalCount(): number {
    return Object.keys(this.data.kanji).length;
  }

  /**
   * Get cache size (number of cached kanji)
   */
  getCacheSize(): number {
    return this.loader?.getCacheSize() || 0;
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.loader?.clearCache();
  }

  /**
   * Get estimated memory usage of cached kanji
   */
  getCacheMemoryUsage(): number {
    const cacheSize = this.getCacheSize();
    return cacheSize * 5.4; // ~5.4KB per kanji
  }

  /**
   * Get maximum cache size
   */
  getMaxCacheSize(): number {
    return this.loader?.getMaxCacheSize() || 0;
  }

  /**
   * Set maximum cache size
   */
  setMaxCacheSize(size: number): void {
    this.loader?.setMaxCacheSize(size);
  }

  /**
   * Get a random kanji from the database
   */
  async getRandom(): Promise<KanjiInfo | null> {
    // Since we're using individual files, we can't easily get all characters
    // Instead, let's get a random code from the kanji data
    console.log('getRandom: Attempting to get random kanji');
    
    const allCodes = Object.keys(this.data.kanji);
    console.log('getRandom: Available codes count:', allCodes.length);
    
    if (allCodes.length === 0) {
      console.log('getRandom: No codes available');
      return null;
    }
    
    const randomIndex = Math.floor(Math.random() * allCodes.length);
    const randomCode = allCodes[randomIndex];
    console.log('getRandom: Selected random code:', randomCode);
    
    // Look up the kanji by code
    const result = await this.lookup(randomCode);
    console.log('getRandom: Result:', result ? result.character : 'null');
    return result;
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    currentSize: number;
    maxSize: number;
    memoryUsage: number;
    hitRate?: number;
  } {
    return {
      currentSize: this.getCacheSize(),
      maxSize: this.getMaxCacheSize(),
      memoryUsage: this.getCacheMemoryUsage()
    };
  }
}
