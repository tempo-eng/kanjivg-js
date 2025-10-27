import { SVGParser } from './SVGParser';
import { KanjiData, KanjiVGError, ERROR_CODES } from '../types';
import { toUnicode, unicodeToChar } from '../utils/fileUtils';

/**
 * Main KanjiVG class for loading and searching kanji data
 */
export class KanjiVG {
  private parser: SVGParser;
  private index: Map<string, string[]>; // character -> file list
  private radicalIndex: Map<string, string[]>; // radical -> character list
  private indexLoaded: boolean = false;
  private radicalIndexLoaded: boolean = false;

  constructor() {
    this.parser = new SVGParser();
    this.index = new Map();
    this.radicalIndex = new Map();
  }

  /**
   * Initialize by loading the index file
   * This should be called before using any methods that require index lookups
   */
  async initialize(): Promise<void> {
    if (this.indexLoaded) {
      return;
    }

    try {
      let indexContent: string;

      // Check if we're in browser environment
      if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
        const response = await fetch('/kvg-index.json');
        if (!response.ok) {
          throw new Error(`Failed to fetch index: ${response.status}`);
        }
        indexContent = await response.text();
      } else {
        // Node.js environment
        const fs = await import('fs');
        const path = await import('path');
        const filePath = path.resolve(__dirname, '../../kvg-index.json');
        indexContent = fs.readFileSync(filePath, 'utf8');
      }

      // Parse the JSON index
      const indexData = JSON.parse(indexContent);
      
      // Convert to Map structure
      this.index = new Map(Object.entries(indexData));
      this.indexLoaded = true;
    } catch (error) {
      throw new KanjiVGError(
        'Failed to load kanji index',
        ERROR_CODES.FILE_LOAD_ERROR
      );
    }
  }

  /**
   * Set the index data (for testing or custom index)
   */
  setIndex(index: Map<string, string[]>): void {
    this.index = index;
    this.indexLoaded = true;
  }

  /**
   * Get kanji data including all variants
   * @param kanji - Character (e.g., "車") or unicode (e.g., "04e0b")
   * @returns Array of KanjiData objects (at least one, more if variants exist)
   */
  async getKanji(kanji: string): Promise<KanjiData[]> {
    // Convert input to unicode
    let unicode: string;
    try {
      unicode = toUnicode(kanji);
    } catch (error) {
      throw new KanjiVGError(
        `Invalid input format: ${kanji}`,
        ERROR_CODES.INVALID_UNICODE
      );
    }

    // Load SVG file content
    const svgContent = await this.loadSVGFile(unicode);
    
    if (!svgContent || svgContent.trim().length === 0) {
      throw new KanjiVGError(
        `Kanji '${kanji}' (unicode: ${unicode}) not found in KanjiVG database. This character may not be included in the dataset.`,
        ERROR_CODES.KANJI_NOT_FOUND
      );
    }

    // Debug: log SVG content to help troubleshoot
    if (!svgContent.includes('<g id="kvg:StrokePaths')) {
      console.error(`SVG file for ${unicode} does not contain expected structure. Content length: ${svgContent.length}`);
      console.error(`First 200 chars:`, svgContent.substring(0, 200));
    }

    try {
      // Parse the SVG
      const kanjiData = this.parser.parseSVG(svgContent, unicode);

      return [kanjiData];
    } catch (error) {
      throw new KanjiVGError(
        `Failed to parse SVG for ${kanji}: ${error}`,
        ERROR_CODES.SVG_PARSE_ERROR
      );
    }
  }

  /**
   * Search for kanji containing a specific radical
   * @param radical - The radical character (e.g., "女")
   * @returns Array of KanjiData objects
   */
  async searchRadical(radical: string): Promise<KanjiData[]> {
    // Load radical index if not already loaded
    if (!this.radicalIndexLoaded) {
      await this.loadRadicalIndex();
    }

    // Get characters that contain this radical
    const characters = this.radicalIndex.get(radical) || [];
    
    if (characters.length === 0) {
      return [];
    }

    // Load kanji data for each character
    const results: KanjiData[] = [];
    for (const character of characters) {
      try {
        const kanjiData = await this.getKanji(character);
        results.push(...kanjiData);
      } catch (error) {
        // Skip characters that fail to load
        console.warn(`Failed to load kanji for radical search: ${character}`, error);
      }
    }

    return results;
  }

  /**
   * Load the radical index file
   */
  private async loadRadicalIndex(): Promise<void> {
    if (this.radicalIndexLoaded) {
      return;
    }

    try {
      let indexContent: string;

      // Check if we're in browser environment
      if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
        const response = await fetch('/radical-index.json');
        if (!response.ok) {
          throw new Error(`Failed to fetch radical index: ${response.status}`);
        }
        indexContent = await response.text();
      } else {
        // Node.js environment
        const fs = await import('fs');
        const path = await import('path');
        const filePath = path.resolve(__dirname, '../../radical-index.json');
        indexContent = fs.readFileSync(filePath, 'utf8');
      }

      // Parse the JSON index
      const indexData = JSON.parse(indexContent);
      
      // Convert to Map structure
      this.radicalIndex = new Map(Object.entries(indexData));
      this.radicalIndexLoaded = true;
    } catch (error) {
      throw new KanjiVGError(
        'Failed to load radical index',
        ERROR_CODES.FILE_LOAD_ERROR
      );
    }
  }

  /**
   * Get a random kanji
   * @returns Single KanjiData object
   */
  async getRandom(): Promise<KanjiData> {
    if (!this.indexLoaded) {
      await this.initialize();
    }

    const chars = Array.from(this.index.keys());
    if (chars.length === 0) {
      throw new KanjiVGError(
        'No kanji available',
        ERROR_CODES.KANJI_NOT_FOUND
      );
    }

    const randomChar = chars[Math.floor(Math.random() * chars.length)];
    const results = await this.getKanji(randomChar);
    return results[0]; // Return base (non-variant)
  }

  /**
   * Load SVG file content for a given unicode
   * In browser: loads via import.meta.glob or direct fetch
   * In Node.js: reads from file system
   */
  private async loadSVGFile(unicode: string): Promise<string> {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      // In development with Vite, the library is loaded via source from src/core
      // We need to fetch from the kvg_js source files
      try {
        // For Vite, fetch from the source directory using absolute import
        const baseUrl = '/src/core/'; // Since we're in core/, go up to access kanji
        // Vite will handle resolving this from the correct location
        const response = await fetch(`/kanji/${unicode}.svg`);
        if (!response.ok && response.status !== 404) {
          throw new Error(`Failed to fetch SVG: ${response.status}`);
        }
        if (response.ok) {
          return await response.text();
        }
        // If 404, try with parent path
        throw new Error('SVG not found at /kanji/');
      } catch (error) {
        // Fallback: in a proper npm package setup, files would be at node_modules/kvg-js/kanji/
        throw new KanjiVGError(
          `Failed to load SVG file: ${unicode}.svg. This character may not be in the dataset or files are not accessible. Error: ${error}`,
          ERROR_CODES.FILE_LOAD_ERROR
        );
      }
    } else {
      // Node.js environment: use file system
      const fs = await import('fs');
      const path = await import('path');
      
      try {
        const filePath = path.resolve(__dirname, `../../kanji/${unicode}.svg`);
        return fs.readFileSync(filePath, 'utf8');
      } catch (error) {
        throw new KanjiVGError(
          `Failed to load SVG file: ${unicode}.svg`,
          ERROR_CODES.FILE_LOAD_ERROR
        );
      }
    }
  }

  /**
   * Check if kanji data contains a specific radical
   */
  private hasRadical(kanjiData: KanjiData[], radical: string): boolean {
    return kanjiData.some(data => 
      data.radicalInfo?.radical === radical ||
      data.groups.some(g => g.element === radical || g.radical === radical)
    );
  }

  /**
   * Convert unicode to character
   */
  private unicodeToChar(unicode: string): string {
    return unicodeToChar(unicode);
  }
}
