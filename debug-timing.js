// Debug script to check actual animation timing
const data = require('./data/kanjivg-data.json');

// Simple mock implementations
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
      const delay = i * (800 + 200); // strokeDuration + strokeDelay
      svg += `<path id="kvg:${kanji.code}-s${i + 1}" kvg:type="${stroke.type || ''}" d="${stroke.path || 'M0,0'}" style="stroke-dasharray: 1000; stroke-dashoffset: 1000; fill:none;stroke:#000000;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;">`;
      svg += `<animate attributeName="stroke-dashoffset" values="1000;0" dur="800ms" begin="${delay}ms" fill="freeze" />`;
      svg += `</path>`;
    }
    
    svg += `</g></svg>`;
    return svg;
  }
}

class MockSVGRenderer {
  render(kanjiInfo, options = {}) {
    const allStrokes = kanjiInfo.strokeTypes.map((type, index) => ({
      type,
      path: `M${index * 10},${index * 10}L${index * 10 + 20},${index * 10 + 20}`
    }));
    
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="109" height="109" viewBox="0 0 109 109" style="fill:none;stroke:#000000;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;">`;
    svg += `<g id="kvg:StrokePaths_${kanjiInfo.code}">`;
    
    for (let i = 0; i < allStrokes.length; i++) {
      const stroke = allStrokes[i];
      const delay = i * (800 + 200); // strokeDuration + strokeDelay
      svg += `<path id="kvg:${kanjiInfo.code}-s${i + 1}" kvg:type="${stroke.type}" d="${stroke.path}" style="stroke-dasharray: 1000; stroke-dashoffset: 1000; fill:none;stroke:#000000;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;">`;
      svg += `<animate attributeName="stroke-dashoffset" values="1000;0" dur="800ms" begin="${delay}ms" fill="freeze" />`;
      svg += `</path>`;
    }
    
    svg += `</g></svg>`;
    return svg;
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
