#!/usr/bin/env node

/**
 * Script to automatically fix async/await issues in test files
 */

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

async function fixAsyncTests() {
    console.log('🔧 Fixing async/await issues in test files...\n');
    
    const testFiles = await glob('src/__tests__/*.test.ts');
    
    for (const file of testFiles) {
        console.log(`Processing ${file}...`);
        
        let content = readFileSync(file, 'utf8');
        let modified = false;
        
        // Fix test functions that call async methods
        const patterns = [
            // Fix test functions
            {
                pattern: /(test|it)\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*\(\s*\)\s*=>\s*{([^}]*?)(kanjivg\.(search|lookup)\()/g,
                replacement: (match, testType, testName, beforeCode, methodCall) => {
                    modified = true;
                    return `${testType}('${testName}', async () => {${beforeCode}await ${methodCall}`;
                }
            },
            // Fix describe blocks that might have async calls
            {
                pattern: /(describe|test|it)\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*\(\s*\)\s*=>\s*{([^}]*?)(kanjivg\.(search|lookup)\()/g,
                replacement: (match, testType, testName, beforeCode, methodCall) => {
                    modified = true;
                    return `${testType}('${testName}', async () => {${beforeCode}await ${methodCall}`;
                }
            }
        ];
        
        for (const { pattern, replacement } of patterns) {
            content = content.replace(pattern, replacement);
        }
        
        // Fix direct method calls that aren't in test functions
        content = content.replace(
            /(\s+)(const\s+\w+\s*=\s*kanjivg\.(search|lookup)\()/g,
            '$1const $2 = await kanjivg.$3('
        );
        
        if (modified) {
            writeFileSync(file, content);
            console.log(`  ✅ Fixed async issues in ${file}`);
        } else {
            console.log(`  ⏭️  No changes needed in ${file}`);
        }
    }
    
    console.log('\n🎉 Async test fixes complete!');
}

fixAsyncTests().catch(console.error);
