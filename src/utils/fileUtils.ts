// Utility functions for file handling and data processing

import * as fs from 'fs';
import * as path from 'path';

/**
 * Convert a character or unicode string to canonical unicode format
 */
export function toUnicode(input: string): string {
  if (input.length === 1) {
    // Single character - convert to unicode
    const code = input.codePointAt(0);
    if (!code) {
      throw new Error(`Invalid character: ${input}`);
    }
    return code.toString(16).padStart(5, '0');
  } else if (input.length >= 2 && input.length <= 5) {
    // Already unicode format
    return input.toLowerCase().padStart(5, '0');
  } else {
    throw new Error(`Invalid input format: ${input}`);
  }
}

/**
 * Convert unicode string to character
 */
export function unicodeToChar(unicode: string): string {
  const code = parseInt(unicode, 16);
  return String.fromCodePoint(code);
}

/**
 * Check if a file path represents a variant (has dash in filename)
 */
export function isVariantFile(filename: string): boolean {
  const baseName = path.basename(filename, '.svg');
  return baseName.includes('-');
}

/**
 * Extract variant name from filename
 */
export function extractVariantName(filename: string): string | undefined {
  const baseName = path.basename(filename, '.svg');
  const parts = baseName.split('-');
  return parts.length > 1 ? parts[1] : undefined;
}

/**
 * Sort files to put base files before variants
 */
export function sortFiles(files: string[]): string[] {
  return files.sort((a, b) => {
    const aIsVariant = isVariantFile(a);
    const bIsVariant = isVariantFile(b);
    
    if (aIsVariant && !bIsVariant) return 1;
    if (!aIsVariant && bIsVariant) return -1;
    return a.localeCompare(b);
  });
}

/**
 * Load JSON file synchronously (for Node.js environments)
 */
export function loadJSONFile(filePath: string): any {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to load JSON file ${filePath}: ${error}`);
  }
}

/**
 * Load text file synchronously (for Node.js environments)
 */
export function loadTextFile(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    throw new Error(`Failed to load text file ${filePath}: ${error}`);
  }
}
