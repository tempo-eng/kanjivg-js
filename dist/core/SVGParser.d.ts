import { KanjiData } from '../types';
/**
 * SVG Parser for extracting stroke data from KanjiVG SVG files
 */
export declare class SVGParser {
    private cache;
    /**
     * Parse SVG content and extract all kanji data
     * @param svgContent - The SVG file content as string
     * @param unicode - The unicode codepoint (e.g., "04e00")
     * @returns Parsed KanjiData object
     */
    parseSVG(svgContent: string, unicode: string): KanjiData;
    /**
     * Extract the kanji character from the SVG
     */
    private extractCharacter;
    /**
     * Extract all stroke path elements in order
     */
    private extractStrokes;
    /**
     * Extract group hierarchy
     */
    private extractGroups;
    /**
     * Determine radical information from groups
     */
    private extractRadicalInfo;
    /**
     * Extract stroke number positions from StrokeNumbers section
     */
    private extractNumberPositions;
    /**
     * Extract component list from groups
     */
    private extractComponents;
    /**
     * Check if a stroke belongs to a radical group
     */
    private isRadicalStroke;
    /**
     * Get the group ID for a stroke
     */
    private getStrokeGroupId;
    /**
     * Clear the cache
     */
    clearCache(): void;
}
//# sourceMappingURL=SVGParser.d.ts.map