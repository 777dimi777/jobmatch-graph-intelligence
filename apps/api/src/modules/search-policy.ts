export const MINIMUM_SEARCH_LENGTH = 2;

export function hasSearchTerm(value: string): boolean {
  return value.trim().length >= MINIMUM_SEARCH_LENGTH;
}
