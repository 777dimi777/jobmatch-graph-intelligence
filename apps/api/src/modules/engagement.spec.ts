import { normalizeCoverNote } from './engagement';

describe('application note normalization', () => {
  it('uses an empty string when no note is supplied', () => {
    expect(normalizeCoverNote()).toBe('');
  });

  it('removes leading and trailing whitespace', () => {
    expect(normalizeCoverNote('  Zainteresovan sam za poziciju.  ')).toBe('Zainteresovan sam za poziciju.');
  });

  it('keeps intentional text unchanged', () => {
    expect(normalizeCoverNote('Prijava preko JobMatch-a')).toBe('Prijava preko JobMatch-a');
  });
});
