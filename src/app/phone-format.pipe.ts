import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'phoneFormat'
})
export class PhoneFormatPipe implements PipeTransform {

  transform(value: string): string {
    if (!value) return '';
    
    // Remove all non-numeric characters
    const cleaned = value.replace(/\D/g, '');
    
    // Handle different phone number lengths
    if (cleaned.length === 10) {
      // Format as (XXX) XXX-XXXX
      return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6)}`;
    } else if (cleaned.length === 11 && cleaned.charAt(0) === '1') {
      // Format as +1 (XXX) XXX-XXXX
      return `+1 (${cleaned.substring(1, 4)}) ${cleaned.substring(4, 7)}-${cleaned.substring(7)}`;
    } else if (cleaned.length === 7) {
      // Format as XXX-XXXX (local number)
      return `${cleaned.substring(0, 3)}-${cleaned.substring(3)}`;
    }
    
    // Return original value if it doesn't match expected formats
    return value;
  }
}
