import { hasSearchTerm, MINIMUM_SEARCH_LENGTH } from './search-policy';

describe('search input policy', () => {
  it('does not query the catalogue for empty or whitespace input', () => {
    expect(hasSearchTerm('')).toBe(false);
    expect(hasSearchTerm('   ')).toBe(false);
  });

  it('requires at least the configured number of characters', () => {
    expect(hasSearchTerm('R')).toBe(false);
    expect(hasSearchTerm('Re')).toBe(true);
    expect(MINIMUM_SEARCH_LENGTH).toBe(2);
  });

  it('ignores whitespace around a valid search phrase', () => {
    expect(hasSearchTerm('  Neo4j  ')).toBe(true);
  });
});
