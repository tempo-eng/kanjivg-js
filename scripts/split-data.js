#!/usr/bin/env node

/**
 * Script to split the large kanjivg-data.json into smaller chunks
 * This reduces memory usage by loading only needed kanji ranges
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const CHUNK_SIZE = 1000; // Number of kanji per chunk
const DATA_DIR = 'data';
const CHUNKS_DIR = join(DATA_DIR, 'chunks');

// Unicode ranges for different kanji sets
const UNICODE_RANGES = [
  { name: 'basic', start: 0x4E00, end: 0x9FFF }, // CJK Unified Ideographs
  { name: 'extended-a', start: 0x3400, end: 0x4DBF }, // CJK Extension A
  { name: 'extended-b', start: 0x20000, end: 0x2A6DF }, // CJK Extension B
  { name: 'extended-c', start: 0x2A700, end: 0x2B73F }, // CJK Extension C
  { name: 'extended-d', start: 0x2B740, end: 0x2B81F }, // CJK Extension D
  { name: 'extended-e', start: 0x2B820, end: 0x2CEAF }, // CJK Extension E
  { name: 'compatibility', start: 0xF900, end: 0xFAFF }, // CJK Compatibility Ideographs
];

function getUnicodeRange(code) {
  const codePoint = parseInt(code, 16);
  for (const range of UNICODE_RANGES) {
    if (codePoint >= range.start && codePoint <= range.end) {
      return range.name;
    }
  }
  return 'other';
}

function splitData() {
  console.log('Loading kanjivg-data.json...');
  const data = JSON.parse(readFileSync(join(DATA_DIR, 'kanjivg-data.json'), 'utf8'));
  
  console.log(`Total kanji: ${Object.keys(data.kanji).length}`);
  
  // Create chunks directory
  mkdirSync(CHUNKS_DIR, { recursive: true });
  
  // Group kanji by Unicode ranges
  const ranges = {};
  for (const [code, kanji] of Object.entries(data.kanji)) {
    const range = getUnicodeRange(code);
    if (!ranges[range]) {
      ranges[range] = {};
    }
    ranges[range][code] = kanji;
  }
  
  // Split each range into chunks
  const chunkIndex = {};
  let chunkCount = 0;
  
  for (const [rangeName, kanjiInRange] of Object.entries(ranges)) {
    console.log(`Processing range: ${rangeName} (${Object.keys(kanjiInRange).length} kanji)`);
    
    const codes = Object.keys(kanjiInRange).sort();
    
    for (let i = 0; i < codes.length; i += CHUNK_SIZE) {
      const chunkCodes = codes.slice(i, i + CHUNK_SIZE);
      const chunkData = {
        kanji: {},
        index: {}
      };
      
      // Add kanji to chunk
      for (const code of chunkCodes) {
        chunkData.kanji[code] = kanjiInRange[code];
        chunkData.index[kanjiInRange[code].character] = code;
      }
      
      const chunkFileName = `${rangeName}-chunk-${Math.floor(i / CHUNK_SIZE)}.json`;
      const chunkPath = join(CHUNKS_DIR, chunkFileName);
      
      writeFileSync(chunkPath, JSON.stringify(chunkData, null, 2));
      
      // Update chunk index
      chunkIndex[rangeName] = chunkIndex[rangeName] || [];
      chunkIndex[rangeName].push({
        file: chunkFileName,
        codes: chunkCodes,
        count: chunkCodes.length
      });
      
      chunkCount++;
      console.log(`  Created chunk: ${chunkFileName} (${chunkCodes.length} kanji)`);
    }
  }
  
  // Create chunk index file
  const chunkIndexPath = join(DATA_DIR, 'chunk-index.json');
  writeFileSync(chunkIndexPath, JSON.stringify(chunkIndex, null, 2));
  
  console.log(`\nSplit complete!`);
  console.log(`- Total chunks: ${chunkCount}`);
  console.log(`- Chunk index: ${chunkIndexPath}`);
  console.log(`- Chunks directory: ${CHUNKS_DIR}`);
  
  // Show file sizes
  console.log('\nFile sizes:');
  const { execSync } = await import('child_process');
  try {
    execSync(`ls -lh ${CHUNKS_DIR}/*.json | head -10`, { stdio: 'inherit' });
    if (chunkCount > 10) {
      console.log(`... and ${chunkCount - 10} more chunks`);
    }
  } catch (e) {
    console.log('Could not show file sizes');
  }
}

splitData().catch(console.error);
