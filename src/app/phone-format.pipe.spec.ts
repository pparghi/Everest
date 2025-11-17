import { PhoneFormatPipe } from './phone-format.pipe';

describe('PhoneFormatPipe', () => {
  let pipe: PhoneFormatPipe;

  beforeEach(() => {
    pipe = new PhoneFormatPipe();
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should format 10-digit phone number', () => {
    expect(pipe.transform('1234567890')).toBe('(123) 456-7890');
  });

  it('should format 11-digit phone number with country code', () => {
    expect(pipe.transform('11234567890')).toBe('+1 (123) 456-7890');
  });

  it('should format 7-digit phone number', () => {
    expect(pipe.transform('4567890')).toBe('456-7890');
  });

  it('should handle phone number with existing formatting', () => {
    expect(pipe.transform('(123) 456-7890')).toBe('(123) 456-7890');
  });

  it('should handle phone number with dots', () => {
    expect(pipe.transform('123.456.7890')).toBe('(123) 456-7890');
  });

  it('should handle phone number with spaces and dashes', () => {
    expect(pipe.transform('123 456-7890')).toBe('(123) 456-7890');
  });

  it('should return empty string for null/undefined input', () => {
    expect(pipe.transform('')).toBe('');
    expect(pipe.transform(null as any)).toBe('');
    expect(pipe.transform(undefined as any)).toBe('');
  });

  it('should return original value for invalid phone numbers', () => {
    expect(pipe.transform('123')).toBe('123');
    expect(pipe.transform('12345678901234')).toBe('12345678901234');
  });
});
