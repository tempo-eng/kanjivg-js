// Debug script to check actual animation timing using the real SVG renderer
const data = require('./data/kanjivg-data.json');

// Simple mock implementations that match the actual behavior
class MockKanjiVG {
  constructor(data) {
    this.data = data;
  }
  
  search(character) {
    const variantKeys = this.data.index[character] || [];
    const results = [];
    
    for (const variantKey of variantKeys) {
      const kanji = this.data.kanji[variantKey];
      if (kanji) {
        const allStrokes = kanji.all_strokes || [];
        results.push({
          character: kanji.character,
          code: kanji.code,
          variant: kanji.variant,
          strokeCount: allStrokes.length,
          strokeTypes: allStrokes.map(s => s.type || ''),
          svg: this.generateSVG(kanji, allStrokes)
        });
      }
    }
    
    return results;
  }
  
  generateSVG(kanji, allStrokes) {
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="109" height="109" viewBox="0 0 109 109" style="fill:none;stroke:#000000;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;">`;
    svg += `<g id="kvg:StrokePaths_${kanji.code}">`;
    
    for (let i = 0; i < allStrokes.length; i++) {
      const stroke = allStrokes[i];
      svg += `<path id="kvg:${kanji.code}-s${i + 1}" kvg:type="${stroke.type || ''}" d="${stroke.path || 'M0,0'}" style="stroke-dasharray: 1000; stroke-dashoffset: 1000; fill:none;stroke:#000000;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;">`;
      svg += `</path>`;
    }
    
    svg += `</g></svg>`;
    return svg;
  }
}

class MockSVGRenderer {
  render(kanjiInfo, options = {}) {
    const strokeTypes = kanjiInfo.strokeTypes;
    const code = kanjiInfo.code;
    
    // Generate base SVG with stroke paths
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="109" height="109" viewBox="0 0 109 109" style="fill:none;stroke:#000000;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;">`;
    svg += `<g id="kvg:StrokePaths_${code}">`;
    
    for (let i = 0; i < strokeTypes.length; i++) {
      const strokeType = strokeTypes[i];
      svg += `<path id="kvg:${code}-s${i + 1}" kvg:type="${strokeType}" d="M${i * 10},${i * 10}L${i * 10 + 20},${i * 10 + 20}" style="stroke-dasharray: 1000; stroke-dashoffset: 1000; fill:none;stroke:#000000;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;">`;
      svg += `</path>`;
    }
    
    svg += `</g></svg>`;
    
    // Add animation using the same logic as the real SVG renderer
    return this.addAnimationToSVG(svg, strokeTypes, code, {
      strokeDuration: 800,
      strokeDelay: 200,
      showNumbers: true,
      loop: false,
      className: 'kanjivg-svg',
      width: 109,
      height: 109,
      viewBox: '0 0 109 109',
      ...options
    });
  }
  
  addAnimationToSVG(svgData, strokeTypes, code, options) {
    let animatedSVG = svgData;
    
    // Find all path elements and add animation
    const pathRegex = /<path([^>]*?)>/g;
    const pathMatches = [...svgData.matchAll(pathRegex)];
    
    // Create a map to track which stroke types we've already processed
    const processedStrokeTypes = new Map();
    
    // Process each path and replace with animated version
    pathMatches.forEach((match, index) => {
      const fullMatch = match[0];
      const attributes = match[1];
      
      if (index < strokeTypes.length) {
        // Extract the existing stroke type from kvg:type attribute
        const typeMatch = attributes.match(/kvg:type="([^"]*)"/);
        const existingStrokeType = typeMatch ? typeMatch[1] : strokeTypes[index];
        
        // Find the correct stroke index - handle duplicates by finding the first occurrence
        let correctStrokeIndex = strokeTypes.indexOf(existingStrokeType);
        
        // If this stroke type has been processed before, find the next occurrence
        if (processedStrokeTypes.has(existingStrokeType)) {
          const lastIndex = processedStrokeTypes.get(existingStrokeType);
          correctStrokeIndex = strokeTypes.indexOf(existingStrokeType, lastIndex + 1);
        }
        
        // Update the processed count for this stroke type
        processedStrokeTypes.set(existingStrokeType, correctStrokeIndex);
        
        const delay = correctStrokeIndex * (options.strokeDuration + options.strokeDelay);
        const duration = options.strokeDuration;
        
        // Create animated path
        const animatedPath = `<path id="kvg:${code}-s${correctStrokeIndex + 1}" kvg:type="${existingStrokeType}"${attributes}
          style="stroke-dasharray: 1000; stroke-dashoffset: 1000; fill: none; stroke: #000000; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round;">
          <animate attributeName="stroke-dashoffset" 
            values="1000;0" 
            dur="${duration}ms" 
            begin="${delay}ms" 
            fill="freeze" />
        </path>`;
        
        // Replace only the first occurrence to avoid duplicates
        animatedSVG = animatedSVG.replace(fullMatch, animatedPath);
      }
    });
    
    return animatedSVG;
  }
}

// Test the timing
const kanjivg = new MockKanjiVG(data);
const svgRenderer = new MockSVGRenderer();

console.log('Testing 金 kanji...');
const kinKanji = kanjivg.search('金')[0];
console.log('金 stroke types:', kinKanji.strokeTypes);

const svg = svgRenderer.render(kinKanji, { showNumbers: true });
const strokeAnimateMatches = svg.match(/<animate[^>]*attributeName="stroke-dashoffset"[^>]*begin="([^"]*)"[^>]*>/g);
const actualDelays = strokeAnimateMatches.map(match => {
  const beginMatch = match.match(/begin="([^"]*)"/);
  return beginMatch ? parseInt(beginMatch[1]) : -1;
});

console.log('金 actual delays:', actualDelays);
console.log('Expected delays: [0, 1000, 2000, 3000, 4000, 5000, 6000, 7000]');

console.log('\nTesting 語 kanji...');
const goKanji = kanjivg.search('語')[0];
console.log('語 stroke types:', goKanji.strokeTypes);

const svg2 = svgRenderer.render(goKanji, { showNumbers: true });
const strokeAnimateMatches2 = svg2.match(/<animate[^>]*attributeName="stroke-dashoffset"[^>]*begin="([^"]*)"[^>]*>/g);
const actualDelays2 = strokeAnimateMatches2.map(match => {
  const beginMatch = match.match(/begin="([^"]*)"/);
  return beginMatch ? parseInt(beginMatch[1]) : -1;
});

console.log('語 actual delays:', actualDelays2);
console.log('Expected delays: [0, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000, 11000, 12000, 13000]');
