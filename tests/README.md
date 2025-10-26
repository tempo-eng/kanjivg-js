# KanjiVG Tests

This folder contains comprehensive tests for the KanjiVG JavaScript library.

## Test Files

### 01-package-loading.test.ts
Tests the basic package loading and initialization:
- ✅ KanjiVG class instantiation
- ✅ Data structure validation
- ✅ Correct number of entries (11,661 total)
- ✅ Variant distribution (4,959 variants, 6,702 base forms)
- ✅ Index structure validation
- ✅ Basic API methods (`getTotalCount`, `getAllCharacters`)

### 02-kanji-search.test.ts
Tests searching for kanji of varying complexity:
- ✅ **Simple Kanji (一)**: 1 stroke, basic functionality
- ✅ **Medium Complexity (且)**: 5 strokes, moderate complexity
- ✅ **Complex Kanji (碚)**: 13 strokes, high complexity
- ✅ Search functionality edge cases
- ✅ Lookup by character and code
- ✅ Limit options

### 03-variant-search.test.ts
Tests searching for kanji with multiple variants:
- ✅ **且 (2 variants)**: Base form + Kaisho variant
- ✅ **碚 (2 variants)**: Base form + Kaisho variant  
- ✅ **宙 (3 variants)**: Base + Kaisho + KaishoVtLst
- ✅ **罩 (3 variants)**: Base + Kaisho + KaishoHzFst
- ✅ Variant-specific lookups
- ✅ Stroke data differences between variants
- ✅ SVG generation for variants

## Running Tests

```bash
# Run original tests (src/__tests__)
yarn test

# Run new comprehensive tests (tests/)
yarn test:tests

# Run all tests
yarn test:all
```

## Test Coverage

The tests cover:
- Package loading and initialization
- Data structure validation
- Kanji search functionality
- Variant handling
- Edge cases and error handling
- API method validation

## Test Data

Tests use the actual `data/kanjivg-data.json` file with:
- 11,661 total kanji entries
- 6,702 base forms
- 4,959 variant forms
- Complete stroke data and SVG generation
