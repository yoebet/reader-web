import {
  Component, Output, EventEmitter,
  AfterViewChecked, ChangeDetectorRef, Input, SimpleChanges, OnInit
} from '@angular/core';

import {MeaningItemZh} from '../models/dict-zh';
import {DictZhService} from '../services/dict-zh.service';
import {SelectedItem} from '../content-types/dict-request';
import {DictZhEntryComponent} from './dict-zh-entry.component';

@Component({
  selector: 'dict-zh-entry-smi',
  templateUrl: './dict-zh-entry-smi.component.html'
})
export class DictZhEntrySmiComponent extends DictZhEntryComponent implements OnInit, AfterViewChecked {
  @Input() initialSelectedItem: SelectedItem;
  @Output() viewReady = new EventEmitter();
  @Output() dictItemSelected = new EventEmitter<SelectedItem>();

  viewReadyEntry = null;
  initialWord: string;
  selectedItem: SelectedItem;


  get selectedChanged() {
    let si = this.selectedItem;
    let isi = this.initialSelectedItem;
    if (this.entry.word === this.initialWord) {
      if (!si) {
        return false;
      }
      if (!isi) {
        return true;
      }
      return si.meaning !== isi.meaning;
    }
    return si && si.meaning;
  }

  constructor(cdr: ChangeDetectorRef, dictService: DictZhService) {
    super(cdr, dictService);
  }


  ngAfterViewChecked() {
    if (this.viewReadyEntry === this.entry) {
      return;
    }
    this.viewReady.emit();
    this.viewReadyEntry = this.entry;
  }

  ngOnInit() {
    this.initialWord = this.entry.word;
    let isi = this.initialSelectedItem;
    if (isi) {
      this.selectedItem = {meaning: isi.meaning};
    } else {
      this.selectedItem = null;
    }
  }

  onEntryChanged() {
    let entry = this.entry;
    this.resetRefWords();
    if (entry.word === this.initialWord) {
      let isi = this.initialSelectedItem;
      if (isi) {
        this.selectedItem = {meaning: isi.meaning};
      } else {
        this.selectedItem = null;
      }
    } else {
      this.selectedItem = null;
    }
    this.cdr.detectChanges();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.entry) {
      this.entryStack = [];
      this.onEntryChanged();
    }
  }


  clickMeaningItem(mi: MeaningItemZh | string) {
    let exp = (typeof mi === 'string') ? mi : mi.exp;
    if (exp === this.selectedItem.meaning) {
      this.selectedItem.meaning = null;
    } else {
      this.selectedItem = {meaning: exp};
    }
  }

  cancelSelect() {
    this.dictItemSelected.emit(null);
  }

  doneSelect() {
    if (!this.selectedChanged) {
      this.dictItemSelected.emit(null);
      return;
    }
    let {meaning} = this.selectedItem;
    let selectedResult: SelectedItem = {meaning, word: this.entry.word};
    this.dictItemSelected.emit(selectedResult);
  }

}
