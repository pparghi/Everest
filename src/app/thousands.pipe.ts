import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'thousands'
})
export class ThousandsPipe implements PipeTransform {

  transform(value: number): string {
   if (!value && value !== 0) return '';
   return (value / 1000).toLocaleString();
 }

}
