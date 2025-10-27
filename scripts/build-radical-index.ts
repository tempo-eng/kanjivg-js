/**
 * Build radical index file
 * Scans all kanji SVG files and builds a radical -> kanji mapping
 */

const fs = require('fs');
const path = require('path');

interface RadicalIndex {
  [radical: string]: string[];
}

/**
 * Parse SVG file to extract radical information
 */
function parseSVGForRadicals(filePath: string, character: string): string[] {
  const svgContent = fs.readFileSync(filePath, 'utf8');
  const radicals: string[] = [];
  
  // Extract radicals from kvg:radical attributes in groups
  const radicalMatches = svgContent.matchAll(/kvg:radical="([^"]+)"/g);
  for (const match of radicalMatches) {
    radicals.push(match[1]);
  }
  
  // Extract element attributes as potential radicals
  const elementMatches = svgContent.matchAll(/kvg:element="([^"]+)"/g);
  for (const match of elementMatches) {
    const element = match[1];
    // Filter out single characters that match the main character
    if (element !== character && element.length <= 2) {
      radicals.push(element);
    }
  }
  
  return radicals;
}

/**
 * Main function to build the radical index
 */
async function buildRadicalIndex() {
  console.log('Building radical index...');
  
  const kanjiDir = path.join(__dirname, '../kanji');
  const indexFile = path.join(__dirname, '../kvg-index.json');
  const outputFile = path.join(__dirname, '../radical-index.json');
  
  // Load the main index
  const index: { [key: string]: string[] } = JSON.parse(
    fs.readFileSync(indexFile, 'utf8')
  );
  
  const radicalIndex: RadicalIndex = {};
  let processedCount = 0;
  
  // Process each kanji
  for (const [character, files] of Object.entries(index)) {
    const baseFile = files[0]; // Get the base (non-variant) file
    const filePath = path.join(kanjiDir, baseFile);
    
    if (!fs.existsSync(filePath)) {
      continue;
    }
    
    try {
      // Parse the SVG to extract radicals
      const radicals = parseSVGForRadicals(filePath, character);
      
      // Add to radical index
      for (const radical of radicals) {
        if (!radicalIndex[radical]) {
          radicalIndex[radical] = [];
        }
        
        // Add the character if not already present
        if (!radicalIndex[radical].includes(character)) {
          radicalIndex[radical].push(character);
        }
      }
      
      processedCount++;
      
      if (processedCount % 100 === 0) {
        console.log(`Processed ${processedCount} kanji...`);
      }
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error);
    }
  }
  
  // Write the radical index
  fs.writeFileSync(
    outputFile,
    JSON.stringify(radicalIndex, null, 2),
    'utf8'
  );
  
  console.log(`\n✓ Radical index complete!`);
  console.log(`  Processed ${processedCount} kanji`);
  console.log(`  Found ${Object.keys(radicalIndex).length} unique radicals`);
  console.log(`  Written to: ${outputFile}`);
}

// Run the build
buildRadicalIndex().catch(console.error);

