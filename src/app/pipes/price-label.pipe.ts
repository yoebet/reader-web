import {Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'priceLabel'})
export class PriceLabelPipe implements PipeTransform {
  transform(pricing: { isFree: boolean, price: number }): string {
    if (!pricing) {
      return '';
    }
    if (pricing.isFree) {
      return '免费';
    }
    if (!pricing.price) {
      return '';
    }
    let cny = pricing.price / 100;
    let cnys = cny.toFixed(2);
    return `${cnys} 元`;
  }
}
