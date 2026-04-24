import { formatColones, formatDate } from '../lib/format';

describe('formatColones', () => {
  it('formats integer colones with ₡ prefix and thousand separator', () => {
    // toLocaleString output varies by Node ICU data; assert structure rather than exact separator
    expect(formatColones(35000)).toMatch(/^₡[\d\s,.']+$/);
    expect(formatColones(35000)).toContain('35');
  });

  it('formats zero', () => {
    expect(formatColones(0)).toMatch(/^₡0$/);
  });

  it('formats large amounts with ₡ prefix', () => {
    expect(formatColones(1200000)).toMatch(/^₡/);
    expect(formatColones(1200000)).toContain('200');
  });

  it('formats amounts under 1000 with no separator', () => {
    expect(formatColones(500)).toBe('₡500');
  });
});

describe('formatDate', () => {
  it('formats a YYYY-MM-DD string to day month year', () => {
    expect(formatDate('2026-04-15')).toBe('15 abr 2026');
  });

  it('formats January correctly', () => {
    expect(formatDate('2026-01-01')).toBe('1 ene 2026');
  });

  it('formats December correctly', () => {
    expect(formatDate('2025-12-31')).toBe('31 dic 2025');
  });

  it('formats each month abbreviation', () => {
    const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    months.forEach((abbr, i) => {
      const mm = String(i + 1).padStart(2, '0');
      expect(formatDate(`2026-${mm}-10`)).toBe(`10 ${abbr} 2026`);
    });
  });
});
