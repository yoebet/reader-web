import {Pipe, PipeTransform} from '@angular/core';

import {UserWord} from '../models/user-word';

@Pipe({name: 'wordFamiliarity'})
export class WordFamiliarityPipe implements PipeTransform {
  transform(wof: UserWord | string | number): string {
    let familiarity = wof;
    if (typeof wof === 'string') {
      familiarity = parseInt(wof);
    } else if (typeof wof !== 'number') {
      familiarity = wof.familiarity;
    }
    let fam = UserWord.Familiarities.find(f => f.value === familiarity);
    if (fam) {
      return fam.label;
    }
    return '';
  }
}
