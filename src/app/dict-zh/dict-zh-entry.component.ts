import {
  Input, OnChanges,
  SimpleChanges, ChangeDetectorRef, Component
} from '@angular/core';
import {last} from 'lodash';

import {DictZh} from '../models/dict-zh';
import {DictZhService} from '../services/dict-zh.service';

@Component({
  selector: 'dict-zh-entry',
  templateUrl: './dict-zh-entry.component.html'
})
export class DictZhEntryComponent implements OnChanges {
  @Input() entry: DictZh;
  @Input() relatedWords: string[];
  @Input() context: any;

  cdr: ChangeDetectorRef;
  dictService: DictZhService;

  refWords: string[];
  entryStack = [];


  constructor(cdr: ChangeDetectorRef, dictService: DictZhService) {
    this.cdr = cdr;
    this.dictService = dictService;
  }


  ngOnChanges(changes: SimpleChanges) {
    if (changes.entry) {
      if (changes.entry.previousValue) {
        this.entryStack.push(changes.entry.previousValue);
      }
      this.onEntryChanged();
    }
  }

  protected resetRefWords() {
    this.refWords = null;
    let refWords = this.relatedWords;
    if (refWords && refWords.length > 0) {
      let previous = last(this.entryStack);
      if (previous) {
        refWords = refWords.filter(w => w !== previous);
      }
      if (refWords.length > 0) {
        this.refWords = refWords;
      }
    }
  }

  protected onEntryChanged() {
    let entry = this.entry;
    this.resetRefWords();
    this.cdr.detectChanges();
  }

  goto(word: string) {
    this.dictService.getEntry(word)
      .subscribe(e => {
          if (!e) {
            return;
          }
          this.entryStack.push(this.entry);
          this.entry = e;
          this.onEntryChanged();
        }
      );
  }

  goback() {
    if (this.entryStack.length > 0) {
      this.entry = this.entryStack.pop();
      this.onEntryChanged();
    }
  }

}
