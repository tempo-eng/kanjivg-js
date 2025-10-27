/**
 * Convert a character or unicode string to canonical unicode format
 */
export declare function toUnicode(input: string): string;
/**
 * Convert unicode string to character
 */
export declare function unicodeToChar(unicode: string): string;
/**
 * Check if a file path represents a variant (has dash in filename)
 */
export declare function isVariantFile(filename: string): boolean;
/**
 * Extract variant name from filename
 */
export declare function extractVariantName(filename: string): string | undefined;
/**
 * Sort files to put base files before variants
 */
export declare function sortFiles(files: string[]): string[];
/**
 * Load JSON file synchronously (for Node.js environments)
 */
export declare function loadJSONFile(filePath: string): any;
/**
 * Load text file synchronously (for Node.js environments)
 */
export declare function loadTextFile(filePath: string): string;
//# sourceMappingURL=fileUtils.d.ts.map