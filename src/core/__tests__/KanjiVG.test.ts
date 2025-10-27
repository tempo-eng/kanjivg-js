import { KanjiVG } from '../KanjiVG';
import { SVGParser } from '../SVGParser';

// Mock the SVGParser
jest.mock('../SVGParser');

describe('KanjiVG', () => {
  let kanjiVG: KanjiVG;
  let mockParser: jest.Mocked<SVGParser>;

  beforeEach(() => {
    kanjiVG = new KanjiVG();
    mockParser = {
      parseSVG: jest.fn(),
      clearCache: jest.fn(),
    } as any;
    
    // Inject the mock parser
    (kanjiVG as any).parser = mockParser;
  });

  describe('getKanji', () => {
    it('should return kanji data for valid character', async () => {
      const mockKanjiData = {
        character: '車',
        unicode: '08eca',
        isVariant: false,
        strokes: [{ strokeNumber: 1, path: 'M...', strokeType: '㇐' }],
        groups: [],
        strokeCount: 7,
      };

      mockParser.parseSVG.mockReturnValue(mockKanjiData);

      // Mock the loadSVGFile method
      (kanjiVG as any).loadSVGFile = jest.fn().mockResolvedValue('<svg>...</svg>');

      const result = await kanjiVG.getKanji('08eca');

      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0].character).toBe('車');
    });

    it('should throw error for invalid unicode input', async () => {
      await expect(kanjiVG.getKanji('invalid-unicode')).rejects.toThrow();
    });

    it('should handle SVG parsing errors gracefully', async () => {
      mockParser.parseSVG.mockImplementation(() => {
        throw new Error('Parse error');
      });

      (kanjiVG as any).loadSVGFile = jest.fn().mockResolvedValue('<svg>...</svg>');

      await expect(kanjiVG.getKanji('08eca')).rejects.toThrow('Failed to parse SVG');
    });
  });

  describe('getRandom', () => {
    it('should return a random kanji when index is loaded', async () => {
      // Mock the index
      const mockIndex = new Map([
        ['車', ['08eca.svg']],
        ['水', ['06c34.svg']],
      ]);
      kanjiVG.setIndex(mockIndex);

      mockParser.parseSVG.mockReturnValue({
        character: '車',
        unicode: '08eca',
        isVariant: false,
        strokes: [],
        groups: [],
        strokeCount: 7,
      });

      (kanjiVG as any).loadSVGFile = jest.fn().mockResolvedValue('<svg>...</svg>');

      const result = await kanjiVG.getRandom();

      expect(result).toBeDefined();
      expect(result.character).toBe('車');
    });

    it('should throw error when no kanji available', async () => {
      kanjiVG.setIndex(new Map());

      await expect(kanjiVG.getRandom()).rejects.toThrow('No kanji available');
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
});

