import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'negativeToParentheses'
})
export class NegativeToParenthesesPipe implements PipeTransform {
  transform(value: any): string {
    if (value == null || isNaN(Number(value.toString().replace(/,/g, '')))) return '';
    let numValue = parseFloat(value.toString().replace(/,/g, ''));
    let roundedValue = Math.round(numValue).toLocaleString('en-US');
    if (numValue < 0) {
      return `(${Math.abs(Math.round(numValue)).toLocaleString('en-US')})`;
    }
    return roundedValue;
  }
}