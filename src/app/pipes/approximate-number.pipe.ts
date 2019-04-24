import {Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'approximate'})
export class ApproximateNumberPipe implements PipeTransform {
  transform(exact: number): string {
    if (isNaN(exact)) {
      return '';
    }
    let mod = 10;
    if (exact <= 500) {
      mod = 50;
    } else if (exact <= 1000) {
      mod = 50;
    } else if (exact <= 10000) {
      mod = 100;
    } else {
      mod = 1000;
    }
    let approx = exact - exact % mod;
    return '' + approx/* + '+'*/;
  }
}
