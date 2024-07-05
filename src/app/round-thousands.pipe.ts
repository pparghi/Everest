import { Pipe, PipeTransform } from '@angular/core';
@Pipe({
 name: 'roundThousands'
})
export class RoundThousandsPipe implements PipeTransform {
  transform(value: any, decimals: number = 0): string {
    if (value == null || isNaN(value)) return '';
    // Convert the value to a number and round it to the specified decimals
    const roundedValue = Number(value).toFixed(decimals);
    // Add thousands separator
    return parseFloat(roundedValue).toLocaleString('en-US');
  }
}