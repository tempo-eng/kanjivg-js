// Debug script to check the exact flow used in tests
const data = require('./data/kanjivg-data.json');

// Mock KanjiVG class that matches the actual implementation
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
        const info = this.lookup(variantKey);
        if (info) {
          results.push(info);
        }
      }
    }
    
    return results;
  }
  
  lookup(variantKey) {
    const kanji = this.data.kanji[variantKey];
    if (!kanji) return null;
    
    const allStrokes = kanji.all_strokes || this.getAllStrokes(kanji.strokes);
    
    return {
      character: kanji.character,
      code: kanji.code,
      variant: kanji.variant,
      strokeCount: allStrokes.length,
      strokeTypes: allStrokes.map(s => s.type || ''),
      svg: this.generateSVG(kanji, allStrokes)
    };
  }
  
  getAllStrokes(group) {
    let strokes = [];
    
    // Process direct strokes first
    for (const stroke of group.strokes) {
      strokes.push(stroke);
    }
    
    // Then process child groups recursively
    for (const childGroup of group.groups) {
      strokes.push(...this.getAllStrokes(childGroup));
    }
    
    return strokes;
  }
  
  generateSVG(kanji, allStrokes) {
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="109" height="109" viewBox="0 0 109 109" style="fill:none;stroke:#000000;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;">\n`;
    svg += `<g id="kvg:StrokePaths_${kanji.code}" style="fill:none;stroke:#000000;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;">\n`;
    
    for (let i = 0; i < allStrokes.length; i++) {
      const stroke = allStrokes[i];
      svg += `  <path id="kvg:${kanji.code}-s${i + 1}"`;
      if (stroke.type) {
        svg += ` kvg:type="${stroke.type}"`;
      }
      svg += ` d="${stroke.path}"/>\n`;
    }
    
    svg += `</g>\n</svg>`;
    return svg;
  }
}

// Mock SVG renderer that matches the actual implementation
class MockSVGRenderer {
  render(kanjiInfo, options = {}) {
    const opts = {
      strokeDuration: 800,
      strokeDelay: 200,
      showNumbers: true,
      loop: false,
      className: 'kanjivg-svg',
      width: 109,
      height: 109,
      viewBox: '0 0 109 109',
      ...options
    };
    
    const { strokeTypes, character, code, svg: svgData } = kanjiInfo;
    
    // If we have SVG data, use it directly with animation modifications
    if (svgData) {
      return this.addAnimationToSVG(svgData, strokeTypes, code, opts);
    }
    
    // Fallback: generate SVG from stroke types
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" 
      width="${opts.width}" 
      height="${opts.height}" 
      viewBox="${opts.viewBox}" 
      class="${opts.className}"
      style="fill:none;stroke:#000000;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;">\n`;

    svg += `<g id="kvg:StrokePaths_${code}">\n`;
    
    for (let i = 0; i < strokeTypes.length; i++) {
      svg += `  <path id="kvg:${code}-s${i + 1}" kvg:type="${strokeTypes[i]}" d="M${i * 10},${i * 10}L${i * 10 + 20},${i * 10 + 20}"/>\n`;
    }
    
    svg += `</g>\n</svg>`;
    
    return this.addAnimationToSVG(svg, strokeTypes, code, opts);
  }
  
  addAnimationToSVG(svgData, strokeTypes, code, options) {
    let animatedSVG = svgData;
    
    // Find all path elements and add animation
    const pathRegex = /<path([^>]*?)>/g;
    const pathMatches = [...svgData.matchAll(pathRegex)];
    
    // Create a map to track which stroke types we've already processed
    const processedStrokeTypes = new Map();
    
    console.log('Processing paths:', pathMatches.length);
    console.log('Stroke types:', strokeTypes);
    
    // Process each path and replace with animated version
    pathMatches.forEach((match, index) => {
      const fullMatch = match[0];
      const attributes = match[1];
      
      if (index < strokeTypes.length) {
        // Extract the existing stroke type from kvg:type attribute
        const typeMatch = attributes.match(/kvg:type=\"([^\"]*)\"/);
        const existingStrokeType = typeMatch ? typeMatch[1] : strokeTypes[index];
        
        console.log(`Path ${index}: existingStrokeType="${existingStrokeType}"`);
        
        // Find the correct stroke index - handle duplicates by finding the first occurrence
        let correctStrokeIndex = strokeTypes.indexOf(existingStrokeType);
        
        // If this stroke type has been processed before, find the next occurrence
        if (processedStrokeTypes.has(existingStrokeType)) {
          const lastIndex = processedStrokeTypes.get(existingStrokeType);
          correctStrokeIndex = strokeTypes.indexOf(existingStrokeType, lastIndex + 1);
        }
        
        console.log(`Path ${index}: correctStrokeIndex=${correctStrokeIndex}`);
        
        // Update the processed count for this stroke type
        processedStrokeTypes.set(existingStrokeType, correctStrokeIndex);
        
        const delay = correctStrokeIndex * (options.strokeDuration + options.strokeDelay);
        const duration = options.strokeDuration;
        
        console.log(`Path ${index}: delay=${delay}ms`);
        
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

// Test the exact flow
const kanjivg = new MockKanjiVG(data);
const svgRenderer = new MockSVGRenderer();

console.log('Testing 金 kanji...');
const kinKanji = kanjivg.search('金')[0];
console.log('金 stroke types:', kinKanji.strokeTypes);
console.log('金 SVG preview:', kinKanji.svg.substring(0, 200));

const svg = svgRenderer.render(kinKanji, { showNumbers: true });
const strokeAnimateMatches = svg.match(/<animate[^>]*attributeName="stroke-dashoffset"[^>]*begin="([^"]*)"[^>]*>/g);
const actualDelays = strokeAnimateMatches.map(match => {
  const beginMatch = match.match(/begin="([^"]*)"/);
  return beginMatch ? parseInt(beginMatch[1]) : -1;
});

console.log('金 actual delays:', actualDelays);
console.log('Expected delays: [0, 1000, 2000, 3000, 4000, 5000, 6000, 7000]');
