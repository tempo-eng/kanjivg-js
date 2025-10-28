import { KanjiData } from '../types';
/**
 * Main KanjiVG class for loading and searching kanji data
 */
export declare class KanjiVG {
    private parser;
    private index;
    private radicalIndex;
    private indexLoaded;
    private radicalIndexLoaded;
    constructor();
    /**
     * Initialize by loading the index file
     * This should be called before using any methods that require index lookups
     */
    private initialize;
    /**
     * Set the index data (for testing or custom index)
     */
    setIndex(index: Map<string, string[]>): void;
    /**
     * Get kanji data including all variants
     * @param kanji - Character (e.g., "車") or unicode (e.g., "04e0b")
     * @returns Array of KanjiData objects (at least one, more if variants exist)
     */
    getKanji(kanji: string): Promise<KanjiData[]>;
    /**
     * Search for kanji containing a specific radical
     * @param radical - The radical character (e.g., "女")
     * @returns Array of KanjiData objects
     */
    searchRadical(radical: string): Promise<KanjiData[]>;
    /**
     * Load the radical index file
     */
    private loadRadicalIndex;
    /**
     * Get a random kanji
     * @returns Single KanjiData object
     */
    getRandom(): Promise<KanjiData>;
    /**
     * Load SVG file content for a given unicode
     * In browser: loads via import.meta.glob or direct fetch
     * In Node.js: reads from file system
     */
    private loadSVGFile;
    /**
     * Check if kanji data contains a specific radical
     */
    private hasRadical;
    /**
     * Convert unicode to character
     */
    private unicodeToChar;
}
//# sourceMappingURL=KanjiVG.d.ts.map