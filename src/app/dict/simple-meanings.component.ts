import {Component, Input} from '@angular/core';

import {DictEntry} from '../models/dict-entry';
import {DictService} from '../services/dict.service';

@Component({
  selector: 'simple-meanings',
  templateUrl: './simple-meanings.component.html',
  styleUrls: ['./simple-meanings.component.css']
})
export class SimpleMeaningsComponent {
  private _entry: DictEntry;
  @Input() set entry(entry: DictEntry) {
    this._entry = entry;
    this._word = entry ? entry.word : null;
  }

  get entry(): DictEntry {
    return this._entry;
  }

  private _word: string;

  get word() {
    return this._word;
  }

  set word(word) {
    if (this._word === word) {
      return;
    }
    this._word = word;
    this.dictService.getEntry(word)
      .subscribe((entry: DictEntry) => {
        this._entry = entry;
      });
  }


  constructor(private dictService: DictService) {
  }

}
