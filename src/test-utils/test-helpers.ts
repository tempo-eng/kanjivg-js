import * as fs from 'fs';
import * as path from 'path';
import { KanjiData } from '../types';

/**
 * Load kanji data from individual JSON files for testing
 * This is a Node.js-specific implementation that uses fs to read files
 */
export async function loadTestKanjiData(codes: string[]): Promise<KanjiData> {
  const indexPath = path.join(process.cwd(), 'data', 'lookup-index.json');
  const lookupIndex = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  
  const kanjiData: Record<string, any> = {};
  const characterIndex: Record<string, string[]> = {};
  
  // Load all files including variants (files that start with the code)
  for (const code of codes) {
    const [baseCode] = code.split('-');
    
    // Find all files that match this code (including variants)
    const matchingFiles = Object.entries(lookupIndex).filter(([k]) => 
      k === baseCode || k.startsWith(baseCode + '-')
    );
    
    for (const [key, filePath] of matchingFiles) {
      const fullPath = path.join(process.cwd(), 'data', filePath as string);
      const kanji = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      kanjiData[key] = kanji;
      
      // Build character index
      const char = kanji.character;
      if (!characterIndex[char]) {
        characterIndex[char] = [];
      }
      characterIndex[char].push(key);
    }
  }
  
  return { kanji: kanjiData, index: characterIndex };
}

