#!/usr/bin/env node

/**
 * Test script to check cache size and memory usage
 */

import { KanjiVG } from './dist/browser.esm.js';

async function testCacheSize() {
    console.log('🧪 Testing KanjiVG Individual File Loading Cache Size\n');
    
    // Create KanjiVG instance
    console.log('Loading KanjiVG with individual file loading...');
    const kanjivg = await KanjiVG.createIndividual(
        'file:///Users/matias/code/matias/kanjivg/kanjivg_js/data/lookup-index.json', 
        'file:///Users/matias/code/matias/kanjivg/kanjivg_js/data'
    );
    
    console.log('✅ KanjiVG loaded successfully\n');
    
    // Test different kanji lookups
    const testKanji = ['金', '語', '並', '04e26', '04e00'];
    
    console.log('Testing kanji lookups and cache size:\n');
    
    for (let i = 0; i < testKanji.length; i++) {
        const kanji = testKanji[i];
        console.log(`Lookup ${i + 1}: ${kanji}`);
        
        const startTime = performance.now();
        const result = await kanjivg.lookup(kanji);
        const endTime = performance.now();
        
        if (result) {
            console.log(`  ✅ Found: ${result.character} (${result.strokeCount} strokes)`);
            console.log(`  ⏱️  Load time: ${(endTime - startTime).toFixed(2)}ms`);
            
            // Get cache size and memory usage
            const cacheSize = kanjivg.getCacheSize();
            const memoryUsage = kanjivg.getCacheMemoryUsage();
            console.log(`  💾 Cache size: ${cacheSize} kanji`);
            console.log(`  📊 Estimated memory: ~${memoryUsage}KB`);
        } else {
            console.log(`  ❌ Not found`);
        }
        console.log('');
    }
    
    console.log('🎯 Cache Analysis:');
    console.log('- Each kanji file: ~5KB');
    console.log('- Cache grows with each unique kanji lookup');
    console.log('- Memory usage: ~5KB per cached kanji');
    console.log('- No automatic cache eviction (grows indefinitely)');
    console.log('- Use clearCache() to reset if needed');
}

testCacheSize().catch(console.error);
