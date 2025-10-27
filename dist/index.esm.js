import 'fs';
import 'path';

// Core data interfaces for KanjiVG library
// Error handling
class KanjiVGError extends Error {
    constructor(message, code) {
        super(message);
        this.code = code;
        this.name = 'KanjiVGError';
    }
}
// Error codes
const ERROR_CODES = {
    KANJI_NOT_FOUND: 'KANJI_NOT_FOUND',
    INVALID_UNICODE: 'INVALID_UNICODE',
    SVG_PARSE_ERROR: 'SVG_PARSE_ERROR',
    FILE_LOAD_ERROR: 'FILE_LOAD_ERROR',
};

/**
 * SVG Parser for extracting stroke data from KanjiVG SVG files
 */
class SVGParser {
    constructor() {
        this.cache = new Map();
    }
    /**
     * Parse SVG content and extract all kanji data
     * @param svgContent - The SVG file content as string
     * @param unicode - The unicode codepoint (e.g., "04e00")
     * @returns Parsed KanjiData object
     */
    parseSVG(svgContent, unicode) {
        // Check cache first
        const cacheKey = unicode;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgContent, 'image/svg+xml');
        // Extract character
        const character = this.extractCharacter(doc, unicode);
        // Extract all strokes in order
        const strokes = this.extractStrokes(doc);
        // Extract group hierarchy
        const groups = this.extractGroups(doc);
        // Extract radical information
        const radicalInfo = this.extractRadicalInfo(groups, strokes);
        // Mark strokes as radical strokes
        strokes.forEach(stroke => {
            stroke.isRadicalStroke = this.isRadicalStroke(stroke, groups);
            stroke.groupId = this.getStrokeGroupId(stroke.strokeNumber, groups);
        });
        // Extract stroke number positions
        const numberPositions = this.extractNumberPositions(doc, strokes.length);
        strokes.forEach((stroke, index) => {
            if (numberPositions[index]) {
                stroke.numberPosition = numberPositions[index];
            }
        });
        // Extract components from groups
        const components = this.extractComponents(groups);
        const kanjiData = {
            character,
            unicode,
            isVariant: false,
            strokes,
            groups,
            radicalInfo,
            strokeCount: strokes.length,
            components: components.length > 0 ? components : undefined,
        };
        // Cache result
        this.cache.set(cacheKey, kanjiData);
        return kanjiData;
    }
    /**
     * Extract the kanji character from the SVG
     */
    extractCharacter(doc, unicode) {
        const mainGroup = doc.querySelector(`g[id^="kvg:${unicode}"]`);
        if (mainGroup) {
            const element = mainGroup.getAttribute('kvg:element');
            if (element) {
                return element;
            }
        }
        // Fallback: convert unicode to character
        return String.fromCodePoint(parseInt(unicode, 16));
    }
    /**
     * Extract all stroke path elements in order
     */
    extractStrokes(doc) {
        const strokeGroup = doc.querySelector('g[id^="kvg:StrokePaths"]');
        if (!strokeGroup) {
            throw new Error('Cannot find StrokePaths group');
        }
        const paths = Array.from(strokeGroup.querySelectorAll('path')).filter(path => {
            const id = path.getAttribute('id');
            return id && id.includes('-s');
        });
        const strokes = [];
        paths.forEach((path, index) => {
            path.getAttribute('id') || '';
            const pathData = path.getAttribute('d') || '';
            const strokeType = path.getAttribute('kvg:type') || '';
            strokes.push({
                strokeNumber: index + 1,
                path: pathData,
                strokeType,
            });
        });
        return strokes;
    }
    /**
     * Extract group hierarchy
     */
    extractGroups(doc) {
        const strokeGroup = doc.querySelector('g[id^="kvg:StrokePaths"]');
        if (!strokeGroup) {
            return [];
        }
        const groups = [];
        const groupElements = Array.from(strokeGroup.querySelectorAll('g'));
        groupElements.forEach(groupEl => {
            const id = groupEl.getAttribute('id');
            if (!id || !id.includes('-g')) {
                return;
            }
            const element = groupEl.getAttribute('kvg:element') || undefined;
            const radical = groupEl.getAttribute('kvg:radical') || undefined;
            const position = groupEl.getAttribute('kvg:position') || undefined;
            // Find child paths to determine stroke numbers
            const childPaths = Array.from(groupEl.querySelectorAll('path'));
            const childStrokes = [];
            // This is a simplified version - would need to track actual stroke numbers
            // For now, we'll determine this based on path order in the document
            const allPaths = Array.from(strokeGroup.querySelectorAll('path'));
            childPaths.forEach(childPath => {
                const pathIndex = allPaths.indexOf(childPath);
                if (pathIndex !== -1) {
                    childStrokes.push(pathIndex + 1);
                }
            });
            groups.push({
                id,
                element,
                radical,
                position,
                childStrokes,
                children: [],
            });
        });
        return groups;
    }
    /**
     * Determine radical information from groups
     */
    extractRadicalInfo(groups, strokes) {
        const radicals = groups.filter(g => g.radical);
        if (radicals.length === 0) {
            return undefined;
        }
        // For simplicity, take the first radical found
        const mainRadical = radicals[0];
        return {
            radical: mainRadical.element || mainRadical.radical || 'unknown',
            positions: mainRadical.position ? [mainRadical.position] : [],
            strokeRanges: [mainRadical.childStrokes],
        };
    }
    /**
     * Extract stroke number positions from StrokeNumbers section
     */
    extractNumberPositions(doc, strokeCount) {
        const numberGroup = doc.querySelector('g[id^="kvg:StrokeNumbers"]');
        if (!numberGroup) {
            return new Array(strokeCount).fill(undefined);
        }
        const textElements = Array.from(numberGroup.querySelectorAll('text'));
        const positions = new Array(strokeCount).fill(undefined);
        textElements.forEach(textEl => {
            const transform = textEl.getAttribute('transform');
            const textContent = textEl.textContent?.trim();
            if (!transform || !textContent)
                return;
            // Parse transform matrix: matrix(1 0 0 1 x y)
            const matrixMatch = transform.match(/matrix\([^)]*\)/);
            if (matrixMatch) {
                const values = matrixMatch[0].match(/[\d.-]+/g) || [];
                if (values.length >= 6) {
                    const x = parseFloat(values[4]);
                    const y = parseFloat(values[5]);
                    const strokeNum = parseInt(textContent, 10);
                    if (strokeNum > 0 && strokeNum <= strokeCount) {
                        positions[strokeNum - 1] = { x, y };
                    }
                }
            }
        });
        return positions;
    }
    /**
     * Extract component list from groups
     */
    extractComponents(groups) {
        const components = new Set();
        groups.forEach(group => {
            if (group.element) {
                components.add(group.element);
            }
        });
        return Array.from(components);
    }
    /**
     * Check if a stroke belongs to a radical group
     */
    isRadicalStroke(stroke, groups) {
        return groups.some(group => group.radical &&
            group.childStrokes.includes(stroke.strokeNumber));
    }
    /**
     * Get the group ID for a stroke
     */
    getStrokeGroupId(strokeNumber, groups) {
        const group = groups.find(g => g.childStrokes.includes(strokeNumber));
        return group?.id;
    }
    /**
     * Clear the cache
     */
    clearCache() {
        this.cache.clear();
    }
}

// Utility functions for file handling and data processing
/**
 * Convert a character or unicode string to canonical unicode format
 */
function toUnicode(input) {
    if (input.length === 1) {
        // Single character - convert to unicode
        const code = input.codePointAt(0);
        if (!code) {
            throw new Error(`Invalid character: ${input}`);
        }
        return code.toString(16).padStart(5, '0');
    }
    else if (input.length >= 2 && input.length <= 5) {
        // Already unicode format
        return input.toLowerCase().padStart(5, '0');
    }
    else {
        throw new Error(`Invalid input format: ${input}`);
    }
}
/**
 * Convert unicode string to character
 */
function unicodeToChar(unicode) {
    const code = parseInt(unicode, 16);
    return String.fromCodePoint(code);
}

/**
 * Main KanjiVG class for loading and searching kanji data
 */
class KanjiVG {
    constructor() {
        this.indexLoaded = false;
        this.radicalIndexLoaded = false;
        this.parser = new SVGParser();
        this.index = new Map();
        this.radicalIndex = new Map();
    }
    /**
     * Initialize by loading the index file
     * This should be called before using any methods that require index lookups
     */
    async initialize() {
        if (this.indexLoaded) {
            return;
        }
        try {
            let indexContent;
            // Check if we're in browser environment
            if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
                const response = await fetch('/kvg-index.json');
                if (!response.ok) {
                    throw new Error(`Failed to fetch index: ${response.status}`);
                }
                indexContent = await response.text();
            }
            else {
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
        }
        catch (error) {
            throw new KanjiVGError('Failed to load kanji index', ERROR_CODES.FILE_LOAD_ERROR);
        }
    }
    /**
     * Set the index data (for testing or custom index)
     */
    setIndex(index) {
        this.index = index;
        this.indexLoaded = true;
    }
    /**
     * Get kanji data including all variants
     * @param kanji - Character (e.g., "車") or unicode (e.g., "04e0b")
     * @returns Array of KanjiData objects (at least one, more if variants exist)
     */
    async getKanji(kanji) {
        // Convert input to unicode
        let unicode;
        try {
            unicode = toUnicode(kanji);
        }
        catch (error) {
            throw new KanjiVGError(`Invalid input format: ${kanji}`, ERROR_CODES.INVALID_UNICODE);
        }
        // Load SVG file content (placeholder - will be implemented based on build system)
        const svgContent = await this.loadSVGFile(unicode);
        if (!svgContent) {
            throw new KanjiVGError(`Kanji not found: ${kanji}`, ERROR_CODES.KANJI_NOT_FOUND);
        }
        try {
            // Parse the SVG
            const kanjiData = this.parser.parseSVG(svgContent, unicode);
            return [kanjiData];
        }
        catch (error) {
            throw new KanjiVGError(`Failed to parse SVG for ${kanji}: ${error}`, ERROR_CODES.SVG_PARSE_ERROR);
        }
    }
    /**
     * Search for kanji containing a specific radical
     * @param radical - The radical character (e.g., "女")
     * @returns Array of KanjiData objects
     */
    async searchRadical(radical) {
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
        const results = [];
        for (const character of characters) {
            try {
                const kanjiData = await this.getKanji(character);
                results.push(...kanjiData);
            }
            catch (error) {
                // Skip characters that fail to load
                console.warn(`Failed to load kanji for radical search: ${character}`, error);
            }
        }
        return results;
    }
    /**
     * Load the radical index file
     */
    async loadRadicalIndex() {
        if (this.radicalIndexLoaded) {
            return;
        }
        try {
            let indexContent;
            // Check if we're in browser environment
            if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
                const response = await fetch('/radical-index.json');
                if (!response.ok) {
                    throw new Error(`Failed to fetch radical index: ${response.status}`);
                }
                indexContent = await response.text();
            }
            else {
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
        }
        catch (error) {
            throw new KanjiVGError('Failed to load radical index', ERROR_CODES.FILE_LOAD_ERROR);
        }
    }
    /**
     * Get a random kanji
     * @returns Single KanjiData object
     */
    async getRandom() {
        if (!this.indexLoaded) {
            await this.initialize();
        }
        const chars = Array.from(this.index.keys());
        if (chars.length === 0) {
            throw new KanjiVGError('No kanji available', ERROR_CODES.KANJI_NOT_FOUND);
        }
        const randomChar = chars[Math.floor(Math.random() * chars.length)];
        const results = await this.getKanji(randomChar);
        return results[0]; // Return base (non-variant)
    }
    /**
     * Load SVG file content for a given unicode
     * Supports both browser (fetch) and Node.js (fs) environments
     */
    async loadSVGFile(unicode) {
        // Check if we're in a browser environment
        if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
            try {
                // In browser: fetch from bundled assets
                const response = await fetch(`/kanji/${unicode}.svg`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch SVG: ${response.status}`);
                }
                return await response.text();
            }
            catch (error) {
                throw new KanjiVGError(`Failed to load SVG file: ${unicode}.svg`, ERROR_CODES.FILE_LOAD_ERROR);
            }
        }
        else {
            // Node.js environment: use file system
            // Dynamic import to avoid issues in browser
            const fs = await import('fs');
            const path = await import('path');
            try {
                const filePath = path.resolve(__dirname, `../../kanji/${unicode}.svg`);
                return fs.readFileSync(filePath, 'utf8');
            }
            catch (error) {
                throw new KanjiVGError(`Failed to load SVG file: ${unicode}.svg`, ERROR_CODES.FILE_LOAD_ERROR);
            }
        }
    }
    /**
     * Check if kanji data contains a specific radical
     */
    hasRadical(kanjiData, radical) {
        return kanjiData.some(data => data.radicalInfo?.radical === radical ||
            data.groups.some(g => g.element === radical || g.radical === radical));
    }
    /**
     * Convert unicode to character
     */
    unicodeToChar(unicode) {
        return unicodeToChar(unicode);
    }
}

export { ERROR_CODES, KanjiVG, KanjiVGError, SVGParser };
//# sourceMappingURL=index.esm.js.map
