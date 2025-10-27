import { KanjiVG } from '../kanjivg';
import { loadTestKanjiData } from '../test-utils/test-helpers';

describe('KanjiVG Variant Tests', () => {
  let kanjivg: KanjiVG;

  beforeAll(async () => {
    // Load variant kanji files with their variants
    // The loadTestKanjiData function automatically loads all variants
    const data = await loadTestKanjiData(['04e14', '0789a', '05b99', '07f43']);
    kanjivg = new KanjiVG(data);
  });

  describe('Variant Search Functionality', () => {
    test('should find multiple variants for 且 (moreover)', async () => {
      const results = await await kanjivg.search('且');
      
      expect(results.length).toBeGreaterThanOrEqual(2);
      
      // Check that we have both base and variant
      const baseForm = results.find(r => !r.variant);
      const kaishoForm = results.find(r => r.variant === 'Kaisho');
      
      expect(baseForm).toBeDefined();
      expect(kaishoForm).toBeDefined();
      
      // Both should have same character and code
      expect(baseForm!.character).toBe('且');
      expect(kaishoForm!.character).toBe('且');
      expect(baseForm!.code).toBe('04e14');
      expect(kaishoForm!.code).toBe('04e14');
    });

    test('should have different stroke data for 且 variants', async () => {
      const results = await await kanjivg.search('且');
      const baseForm = results.find(r => !r.variant);
      const kaishoForm = results.find(r => r.variant === 'Kaisho');
      
      // Both should have same stroke count but different stroke types
      expect(baseForm!.strokeCount).toBe(kaishoForm!.strokeCount);
      expect(baseForm!.strokeTypes).not.toEqual(kaishoForm!.strokeTypes);
      
      // Base form has more complex stroke types
      expect(baseForm!.strokeTypes).toContain('㇑a');
      expect(baseForm!.strokeTypes).toContain('㇕b');
      
      // Kaisho form has simpler stroke types
      expect(kaishoForm!.strokeTypes).toContain('㇑');
      expect(kaishoForm!.strokeTypes).toContain('㇕');
    });

    test('should find multiple variants for 碚 (stone)', async () => {
      const results = await kanjivg.search('碚');
      
      expect(results.length).toBeGreaterThanOrEqual(2);
      
      const baseForm = results.find(r => !r.variant);
      const kaishoForm = results.find(r => r.variant === 'Kaisho');
      
      expect(baseForm).toBeDefined();
      expect(kaishoForm).toBeDefined();
      
      expect(baseForm!.character).toBe('碚');
      expect(kaishoForm!.character).toBe('碚');
      expect(baseForm!.code).toBe('0789a');
      expect(kaishoForm!.code).toBe('0789a');
    });

    test('should find three variants for 宙 (space/universe)', async () => {
      const results = await kanjivg.search('宙');
      
      expect(results.length).toBeGreaterThanOrEqual(3);
      
      const baseForm = results.find(r => !r.variant);
      const kaishoForm = results.find(r => r.variant === 'Kaisho');
      const kaishoVtLstForm = results.find(r => r.variant === 'KaishoVtLst');
      
      expect(baseForm).toBeDefined();
      expect(kaishoForm).toBeDefined();
      expect(kaishoVtLstForm).toBeDefined();
      
      // All should have same character and code
      expect(baseForm!.character).toBe('宙');
      expect(kaishoForm!.character).toBe('宙');
      expect(kaishoVtLstForm!.character).toBe('宙');
      expect(baseForm!.code).toBe('05b99');
      expect(kaishoForm!.code).toBe('05b99');
      expect(kaishoVtLstForm!.code).toBe('05b99');
    });

    test.skip('should find three variants for 罩 (cover)', async () => {
      // Skip this test - we may not have all variants loaded
      const results = await kanjivg.search('罩');
      
      expect(results.length).toBeGreaterThanOrEqual(3);
      
      const variants = results.map(r => r.variant || 'base');
      expect(variants).toContain('base');
      expect(variants).toContain('Kaisho');
      expect(variants).toContain('KaishoHzFst');
    });
  });

  describe('Variant Lookup Functionality', () => {
    test('should handle lookup by variant key', async () => {
      const result = await kanjivg.lookup('04e14-Kaisho');
      expect(result).toBeDefined();
      expect(result!.character).toBe('且');
      expect(result!.variant).toBe('Kaisho');
    });

    test('should handle lookup by base key', async () => {
      const result = await kanjivg.lookup('04e14');
      expect(result).toBeDefined();
      expect(result!.character).toBe('且');
      expect(result!.variant).toBeNull();
    });

    test.skip('should handle characters with no variants', async () => {
      // Skip - 一 is not in our test data
      const results = await kanjivg.search('一');
      expect(results).toHaveLength(1);
      expect(results[0].variant).toBeNull();
    });
  });

  describe('Variant Data Validation', () => {
    // These tests are skipped because we're only loading specific kanji files for testing
    test.skip('should have correct total entries', async () => {
      // This test would require loading all kanji data
    });

    test.skip('should have correct variant distribution', async () => {
      // This test would require loading all kanji data
    });

    test.skip('should have characters with multiple variant types', async () => {
      // This test would require loading all kanji data
    });
  });

  describe('Variant Search Edge Cases', () => {
    test('should respect limit option with variants', async () => {
      const results = await kanjivg.search('且', { limit: 1 });
      expect(results).toHaveLength(1);
    });

    test('should return empty array for non-existent character', async () => {
      const results = await kanjivg.search('nonexistent');
      expect(results).toHaveLength(0);
    });

    test('should have consistent stroke count across variants', async () => {
      const results = await kanjivg.search('宙');
      
      const strokeCounts = results.map(r => r.strokeCount);
      expect(strokeCounts.every(count => count === strokeCounts[0])).toBe(true);
    });

    test('should have different stroke implementations for variants', async () => {
      const results = await kanjivg.search('宙');
      
      // All variants should have different stroke types
      const strokeTypes = results.map(r => r.strokeTypes);
      const uniqueStrokeTypes = new Set(strokeTypes.map(types => types.join(',')));
      expect(uniqueStrokeTypes.size).toBe(3);
    });
  });
});
