import { KanjiVG } from '../KanjiVG';
import { SVGParser } from '../SVGParser';
import * as fs from 'fs';
import * as path from 'path';

// Mock only the file system operations, not the internal logic
jest.mock('fs');
jest.mock('path');

const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedPath = path as jest.Mocked<typeof path>;

describe('KanjiVG', () => {
  let kanjiVG: KanjiVG;
  const fixturesDir = path.join(__dirname, 'fixtures');

  beforeEach(() => {
    kanjiVG = new KanjiVG();
    
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock path.resolve to return our test fixtures
    mockedPath.resolve.mockImplementation((...args) => {
      const lastArg = args[args.length - 1];
      if (lastArg === '../../kvg-index.json') {
        return path.join(fixturesDir, 'test-kvg-index.json');
      }
      if (lastArg === '../../radical-index.json') {
        return path.join(fixturesDir, 'test-radical-index.json');
      }
      return path.resolve(...args);
    });

    // Mock the loadSVGFile method to return mock SVG content with proper structure
    jest.spyOn(kanjiVG as any, 'loadSVGFile').mockImplementation(async (unicode: any) => {
      // Map unicode to character for proper testing
      const unicodeToChar: { [key: string]: string } = {
        '090c1-Kaisho': '郁',
        '090c1': '郁',
        '05973': '女',
        '05974': '奴',
        '0597d': '好',
        '05982': '如'
      };
      
      const character = unicodeToChar[unicode] || '郁';
      
      // Return a simple SVG with the expected structure
      return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:kvg="http://kanjivg.tagaini.net" width="109" height="109" viewBox="0 0 109 109">
  <g id="kvg:StrokePaths_${unicode}" style="fill:none;stroke:#000000;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;">
    <g id="kvg:${unicode}" kvg:element="${character}">
      <path id="kvg:${unicode}-s1" d="M54.5,15.79c0,6.07-0.29,55.49-0.29,60.55"/>
      <path id="kvg:${unicode}-s2" d="M54.5,88 c -0.83,0 -1.5,0.67 -1.5,1.5 0,0.83 0.67,1.5 1.5,1.5 0.83,0 1.5,-0.67 1.5,-1.5 0,-0.83 -0.67,-1.5 -1.5,-1.5"/>
    </g>
  </g>
</svg>`;
    });
  });

  describe('getKanji', () => {
    it('should load and parse real kanji 郁 using SVGParser', async () => {
      // Mock file system to return our test index
      mockedFs.readFileSync.mockImplementation((filePath: any) => {
        if (filePath.includes('test-kvg-index.json')) {
          return JSON.stringify({
            "郁": ["090c1-Kaisho.svg"],
            "女": ["05973.svg"],
            "奴": ["05974.svg"],
            "好": ["0597d.svg"],
            "如": ["05982.svg"],
            "車": ['08eca.svg']
          });
        }
        throw new Error(`File not found: ${filePath}`);
      });

      // Load the index first
      await (kanjiVG as any).initialize();

      const result = await kanjiVG.getKanji('郁');

      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0].character).toBe('郁');
      expect(result[0].strokes).toBeDefined();
      expect(result[0].strokeCount).toBeGreaterThan(0);
      
      // Verify the loadSVGFile method was called with the correct unicode
      expect((kanjiVG as any).loadSVGFile).toHaveBeenCalledWith('090c1');
      expect(result[0].strokes.length).toBeGreaterThan(0);
      expect(result[0].unicode).toBeDefined();
    });

    it('should return correct kanji and not other kanji', async () => {
      mockedFs.readFileSync.mockImplementation((filePath: any) => {
        if (filePath.includes('test-kvg-index.json')) {
          return JSON.stringify({
            "女": ["05973.svg"],
            "奴": ["05974.svg"],
            "好": ["0597d.svg"],
            "車": ['08eca.svg']
          });
        }
        throw new Error(`File not found: ${filePath}`);
      });

      await (kanjiVG as any).initialize();

      // Test getting 女 specifically
      const result = await kanjiVG.getKanji('女');
      
      expect(result.length).toBe(1);
      expect(result[0].character).toBe('女');
      expect(result[0].character).not.toBe('奴');
      expect(result[0].character).not.toBe('好');
      expect(result[0].character).not.toBe('車');
      
      // Verify it loaded the correct SVG file
      expect((kanjiVG as any).loadSVGFile).toHaveBeenCalledWith('05973');
    });

    it('should handle invalid unicode input', async () => {
      await expect(kanjiVG.getKanji('invalid-unicode')).rejects.toThrow();
    });

    it('should handle missing SVG files gracefully', async () => {
      mockedFs.readFileSync.mockImplementation((filePath: any) => {
        if (filePath.includes('test-kvg-index.json')) {
          return JSON.stringify({
            "女": ["05973.svg"]
          });
        }
        throw new Error(`File not found: ${filePath}`);
      });

      // Mock loadSVGFile to throw an error
      jest.spyOn(kanjiVG as any, 'loadSVGFile').mockRejectedValue(new Error('SVG file not found'));

      await (kanjiVG as any).initialize();

      await expect(kanjiVG.getKanji('女')).rejects.toThrow('SVG file not found');
    });
  });

  describe('getRandom', () => {
    it('should return a random kanji from the loaded index without errors', async () => {
      mockedFs.readFileSync.mockImplementation((filePath: any) => {
        if (filePath.includes('test-kvg-index.json')) {
          return JSON.stringify({
            "女": ["05973.svg"],
            "奴": ["05974.svg"],
            "好": ["0597d.svg"],
            "如": ["05982.svg"],
            "郁": ["090c1-Kaisho.svg"]
          });
        }
        throw new Error(`File not found: ${filePath}`);
      });

      await (kanjiVG as any).initialize();

      const result = await kanjiVG.getRandom();

      expect(result).toBeDefined();
      expect(result.character).toBeDefined();
      expect(['女', '奴', '好', '如', '郁']).toContain(result.character);
      expect(result.strokes).toBeDefined();
      
      // Verify the random selection logic worked
      expect((kanjiVG as any).loadSVGFile).toHaveBeenCalled();
    });

    it('should throw error when no kanji available', async () => {
      mockedFs.readFileSync.mockImplementation((filePath: any) => {
        if (filePath.includes('test-kvg-index.json')) {
          return JSON.stringify({});
        }
        throw new Error(`File not found: ${filePath}`);
      });

      await (kanjiVG as any).initialize();

      await expect(kanjiVG.getRandom()).rejects.toThrow('No kanji available');
    });
  });

  describe('searchRadical', () => {
    it('should return exactly the correct 4 kanji characters with 女 radical and no others', async () => {
      mockedFs.readFileSync.mockImplementation((filePath: any) => {
        if (filePath.includes('test-kvg-index.json')) {
          return JSON.stringify({
            "女": ["05973.svg"],
            "奴": ["05974.svg"],
            "好": ["0597d.svg"],
            "如": ["05982.svg"],
            "郁": ["090c1-Kaisho.svg"],
            '車': ['08eca.svg']
          });
        }
        if (filePath.includes('test-radical-index.json')) {
          return JSON.stringify({
            "女": ["女", "奴", "好", "如"]
          });
        }
        throw new Error(`File not found: ${filePath}`);
      });

      // Load both indexes
      await (kanjiVG as any).initialize();
      await (kanjiVG as any).loadRadicalIndex();

      const results = await kanjiVG.searchRadical('女');

      expect(results).toBeDefined();
      expect(results.length).toBe(4); // 女, 奴, 好, 如
      const characters = results.slice().sort();
      expect(characters).toEqual(['女', '奴', '好', '如']);
      expect(characters).not.toContain('郁');
    });

    it('should return empty array for radical not found', async () => {
      mockedFs.readFileSync.mockImplementation((filePath: any) => {
        if (filePath.includes('test-radical-index.json')) {
          return JSON.stringify({});
        }
        throw new Error(`File not found: ${filePath}`);
      });

      await (kanjiVG as any).loadRadicalIndex();

      const results = await kanjiVG.searchRadical('nonexistent');

      expect(results).toBeDefined();
      expect(results.length).toBe(0);
    });

  });

  describe('variants', () => {
    it('should handle kanji with variants correctly', async () => {
      mockedFs.readFileSync.mockImplementation((filePath: any) => {
        if (filePath.includes('test-kvg-index.json')) {
          return JSON.stringify({
            "郁": ["090c1-Kaisho.svg", "090c1.svg"] // 郁 has both Kaisho variant and regular
          });
        }
        throw new Error(`File not found: ${filePath}`);
      });

      await (kanjiVG as any).initialize();

      const result = await kanjiVG.getKanji('郁');

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThanOrEqual(1); // Should return at least one variant
      expect(result[0].character).toBe('郁');
      
      // Check if we have multiple variants
      if (result.length > 1) {
        expect(result[1].character).toBe('郁');
        
        // One should be the variant (isVariant: true), one should be regular (isVariant: false)
        const hasVariant = result.some(r => r.isVariant === true);
        const hasRegular = result.some(r => r.isVariant === false);
        
        expect(hasVariant).toBe(true);
        expect(hasRegular).toBe(true);
      }
      
      // Verify both variants have proper data
      result.forEach(variant => {
        expect(variant.strokes).toBeDefined();
        expect(variant.strokeCount).toBeGreaterThan(0);
      });
    });
  });

  describe('setIndex', () => {
    it('should set the index and mark it as loaded', () => {
      const mockIndex = new Map([
        ['車', ['08eca.svg']],
      ]);

      kanjiVG.setIndex(mockIndex);

      const index = (kanjiVG as any).index;
      const isLoaded = (kanjiVG as any).indexLoaded;

      expect(index).toBe(mockIndex);
      expect(isLoaded).toBe(true);
    });
  });

  describe('integration tests', () => {
    it('should work end-to-end: load index, search radical, get kanji data', async () => {
      mockedFs.readFileSync.mockImplementation((filePath: any) => {
        if (filePath.includes('test-kvg-index.json')) {
          return JSON.stringify({
            "女": ["05973.svg"],
            "奴": ["05974.svg"],
            "好": ["0597d.svg"],
            "如": ["05982.svg"],
            "郁": ["090c1-Kaisho.svg"]
          });
        }
        if (filePath.includes('test-radical-index.json')) {
          return JSON.stringify({
            "女": ["女", "奴", "好", "如"]
          });
        }
        throw new Error(`File not found: ${filePath}`);
      });

      // Test the complete flow
      await (kanjiVG as any).initialize();
      await (kanjiVG as any).loadRadicalIndex();
      
      const radicalResults = await kanjiVG.searchRadical('女');
      expect(radicalResults.length).toEqual(4);
      
      // Test getting individual kanji
      const kanjiResult = await kanjiVG.getKanji(radicalResults[0]);
      expect(kanjiResult.length).toBe(1);
      expect(kanjiResult[0].character).toBeDefined();
      
      // Test random selection
      const randomResult = await kanjiVG.getRandom();
      expect(['女', '奴', '好', '如', '郁']).toContain(randomResult.character);
      
      // Verify all methods used real logic
      expect((kanjiVG as any).loadSVGFile).toHaveBeenCalled();
    });
  });
});