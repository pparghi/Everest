import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'minutesToDHM'
})
export class MinutesToDHMPipe implements PipeTransform {

  transform(value: string): string | null {
    var seconds = parseInt(value) * 60
    var days = Math.floor(seconds / 86400);
    seconds -= days * 86400;
    var hours = Math.floor(seconds / 3600) % 24;
    seconds -= hours * 3600;
    var minutes = Math.floor(seconds / 60) % 60;

    return (days?days + 'd ':'') + (days||hours?hours + 'h ':'') + (minutes + 'm');
  }

}
