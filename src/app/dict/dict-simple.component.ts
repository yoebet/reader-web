import {Component, Input} from '@angular/core';

import {DictEntry} from '../models/dict-entry';
import {DictService} from '../services/dict.service';

@Component({
  selector: 'dict-simple',
  templateUrl: './dict-simple.component.html'
})
export class DictSimpleComponent {
  // tslint:disable-next-line:variable-name
  private _entry: DictEntry;
  @Input() set entry(entry: DictEntry) {
    this._entry = entry;
    this._word = entry ? entry.word : null;
  }

  get entry(): DictEntry {
    return this._entry;
  }

  // tslint:disable-next-line:variable-name
  private _word: string;

  get word() {
    return this._word;
  }

  set word(word) {
    if (this._word === word) {
      return;
    }
    this._word = word;
    this.dictService.getEntry(word, {base: true, stem: true})
      .subscribe((entry: DictEntry) => {
        this._entry = entry;
      });
  }

  constructor(private dictService: DictService) {
  }

}
