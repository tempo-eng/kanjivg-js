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
 * Parse SVG file to extract radicals.
 * Priority: "general" first, fallback to "tradit" if no "general" found.
 * The displayed radical character is taken from the group's kvg:element.
 */
function parseSVGForRadicals(filePath: string, character: string): string[] {
  const svgContent = fs.readFileSync(filePath, 'utf8');

  // Find <g ... kvg:radical="..." ...> tags and capture their kvg:element values
  const groupRegex = /<g\b[^>]*kvg:radical="([^"]+)"[^>]*>/g;
  const elementAttrRegex = /kvg:element="([^"]+)"/;

  const radicalsSet = new Set<string>();
  const allRadicals: Array<{type: string, element: string}> = [];
  
  // First pass: collect all radicals with their types
  let match: RegExpExecArray | null;
  while ((match = groupRegex.exec(svgContent)) !== null) {
    const radicalType = match[1];
    const tagText = match[0];
    const elementMatch = tagText.match(elementAttrRegex);
    const element = elementMatch?.[1];
    if (element && element !== character && (radicalType === 'general' || radicalType === 'tradit')) {
      allRadicals.push({ type: radicalType, element });
    }
  }

  // Check if we have any "general" radicals
  const hasGeneral = allRadicals.some(r => r.type === 'general');
  
  // Index based on priority: general first, tradit as fallback
  for (const radical of allRadicals) {
    if (hasGeneral && radical.type === 'general') {
      radicalsSet.add(radical.element);
    } else if (!hasGeneral && radical.type === 'tradit') {
      radicalsSet.add(radical.element);
    }
  }

  return Array.from(radicalsSet);
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

