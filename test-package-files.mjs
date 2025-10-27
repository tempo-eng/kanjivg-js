// Quick test to verify package files are correctly accessible
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Testing package file accessibility...\n');

// Check if data directory exists
const dataDir = path.join(__dirname, 'data');
const lookupIndexPath = path.join(dataDir, 'lookup-index.json');
const individualDir = path.join(dataDir, 'individual');

console.log('Checking data directory:', dataDir);
console.log('Exists:', fs.existsSync(dataDir));

console.log('\nChecking lookup-index.json:', lookupIndexPath);
console.log('Exists:', fs.existsSync(lookupIndexPath));

if (fs.existsSync(lookupIndexPath)) {
  try {
    const lookupIndex = JSON.parse(fs.readFileSync(lookupIndexPath, 'utf8'));
    const entries = Object.keys(lookupIndex);
    console.log('✓ Lookup index loaded successfully');
    console.log('  Entries:', entries.length);
    
    // Test first few entries
    console.log('\nSample entries:');
    for (const [code, filePath] of Object.entries(lookupIndex).slice(0, 5)) {
      const fileExists = fs.existsSync(path.join(individualDir, filePath));
      console.log(`  ${code} → ${filePath} ${fileExists ? '✓' : '✗'}`);
    }
  } catch (error) {
    console.error('✗ Failed to load lookup index:', error.message);
  }
}

console.log('\nChecking individual directory:', individualDir);
console.log('Exists:', fs.existsSync(individualDir));

if (fs.existsSync(individualDir)) {
  const files = fs.readdirSync(individualDir).filter(f => f.endsWith('.json'));
  console.log('JSON files in individual directory:', files.length);
  
  if (files.length > 0) {
    console.log('\nSample files:');
    files.slice(0, 5).forEach(file => {
      console.log(`  ${file} ✓`);
    });
    
    // Test loading one file
    const testFile = path.join(individualDir, files[0]);
    try {
      const data = JSON.parse(fs.readFileSync(testFile, 'utf8'));
      console.log(`\n✓ Successfully loaded test file: ${files[0]}`);
      console.log(`  Kanji: ${data.character || 'N/A'}`);
      console.log(`  Code: ${data.code || 'N/A'}`);
    } catch (error) {
      console.error(`✗ Failed to load test file: ${error.message}`);
    }
  }
}

console.log('\n✓ Package file check complete!');

