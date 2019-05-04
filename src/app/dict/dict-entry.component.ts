import {
  Component, Output, EventEmitter, OnInit, OnChanges,
  AfterViewChecked, ChangeDetectorRef, Input, SimpleChanges
} from '@angular/core';
import {union, last} from 'lodash';

import {DictService} from '../services/dict.service';
import {UserWordService} from '../services/user-word.service';
import {ParaService} from '../services/para.service';

import {SelectedItem, UserWordChange} from '../content-types/dict-request';
import {DictEntry, MeaningItem, SimpleMeaning, TagLabelMap} from '../models/dict-entry';
import {UserWord} from '../models/user-word';
import {Para} from '../models/para';

@Component({
  selector: 'dict-entry',
  templateUrl: './dict-entry.component.html'
})
export class DictEntryComponent implements OnInit, OnChanges, AfterViewChecked {
  @Input() entry: DictEntry;
  @Input() relatedWords: string[];
  @Input() initialSelectedItem: SelectedItem;
  @Input() context: any;

  @Output() viewReady = new EventEmitter();
  @Output() userWordChanged = new EventEmitter<UserWordChange>();
  @Output() dictItemSelected = new EventEmitter<SelectedItem>();

  cdr: ChangeDetectorRef;

  categoryTags: string[];
  refWords: string[];

  tagLabelMap = TagLabelMap;

  viewReadyEntry = null;
  initialWord: string;
  selectedItem: SelectedItem;
  entryStack = [];

  textTrans = false;
  textShowTitle = false;
  textTabActive = false;

  selectAnItem = false;

  userWord: UserWord;
  userWordSource: { isCurrentPara?: boolean, para?: Para, moreParas?: Para[] };


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
      return si.pos !== isi.pos || si.meaning !== isi.meaning;
    }
    return si && si.meaning;
  }

  constructor(cdr: ChangeDetectorRef,
              private dictService: DictService,
              private userWordService: UserWordService,
              private paraService: ParaService) {
    this.cdr = cdr;
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
      this.selectedItem = {pos: isi.pos, meaning: isi.meaning};
    } else {
      this.selectedItem = null;
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.entry) {
      this.entryStack = [];
      let pre = changes.entry.previousValue;
      if (pre) {
        this.entryStack.push(pre);
      }
      this.onEntryChanged();
    }
  }

  onUserWordChange(change: UserWordChange) {
    change.dictEntry = this.entry;
    this.userWordChanged.emit(change);
  }

  loadMoreParas() {
    if (!this.userWordSource) {
      this.userWordSource = {};
    } else if (this.userWordSource.moreParas) {
      return;
    }
    this.paraService.textSearch(this.entry.word)
      .subscribe(paras => {
        let moreParas = paras;
        let sourcePara = this.userWordSource.para;
        if (sourcePara) {
          moreParas = moreParas.filter(p => p._id !== sourcePara._id);
        }
        this.userWordSource.moreParas = moreParas;
      });
  }

  textTabActivated() {
    this.setUserWordSource();
  }

  loadCompleteMeanings() {
    let _id = this.entry._id;
    this.dictService.getCompleteMeanings(_id).subscribe(complete => {
      if (!complete) {
        return;
      }
      if (!this.entry || this.entry._id !== _id) {
        return;
      }
      this.entry.complete = complete;
    });
  }

  setUserWordSource() {
    if (this.userWordSource) {
      return;
    }
    if (!this.userWord || !this.userWord.paraId) {
      return;
    }
    if (this.context && this.context.paraId === this.userWord.paraId) {
      this.userWordSource = {isCurrentPara: true};
      return;
    }
    this.paraService.loadPara(this.userWord.paraId)
      .subscribe((para: Para) => {
        this.userWordSource = {para};
      });
  }

  onEntryChanged() {
    let entry = this.entry;
    this.categoryTags = DictEntry.EvaluateCategoryTags(entry.categories);
    this.resetRefWords();
    if (entry.word === this.initialWord) {
      let isi = this.initialSelectedItem;
      if (isi) {
        this.selectedItem = {pos: isi.pos, meaning: isi.meaning};
      } else {
        this.selectedItem = null;
      }
    } else {
      this.selectedItem = null;
    }

    this.userWord = null;
    this.userWordSource = null;
    this.userWordService.getOne(entry.word)
      .subscribe(userWord => {
        this.userWord = userWord;
        if (this.textTabActive) {
          this.setUserWordSource();
        }
      });

    this.cdr.detectChanges();
  }

  protected resetRefWords() {
    this.refWords = null;
    let entry = this.entry;
    let refWords = union(entry.baseForm ? [entry.baseForm] : null, this.relatedWords);
    if (refWords.length > 0) {
      let previous = last(this.entryStack);
      if (previous) {
        refWords = refWords.filter(w => w !== previous);
      }
      if (refWords.length > 0) {
        this.refWords = refWords;
      }
    }
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

  clickMeaningItem(pos, mi: MeaningItem | SimpleMeaning | string) {
    if (!this.selectAnItem) {
      this.cancelSelect();
      return;
    }
    let exp = (typeof mi === 'string') ? mi : mi.exp;
    if (this.selectedItem && pos === this.selectedItem.pos && exp === this.selectedItem.meaning) {
      this.selectedItem.meaning = null;
    } else {
      this.selectedItem = {pos, meaning: exp};
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
    let {pos, meaning} = this.selectedItem;
    let selectedResult: SelectedItem = {pos, meaning, word: this.entry.word};
    this.dictItemSelected.emit(selectedResult);
  }

}
