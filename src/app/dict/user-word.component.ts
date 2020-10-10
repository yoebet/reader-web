import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

import {UserWord} from '../models/user-word';
import {OpResult} from '../models/op-result';
import {WordCategory} from '../models/word-category';
import {UserWordChange} from '../content-types/dict-request';

import {UserWordService} from '../services/user-word.service';
import {UserVocabularyService} from '../services/user-vocabulary.service';
import {WordCategoryService} from '../services/word-category.service';


@Component({
  selector: 'user-word',
  templateUrl: './user-word.component.html'
})
export class UserWordComponent implements OnInit {
  // tslint:disable-next-line:variable-name
  private _word: string;
  @Input()
  set word(word: string) {
    if (this._word === word) {
      return;
    }
    this._word = word;
    this.userVocabularyService.inBaseVocabulary(word)
      .subscribe(code => {
        if (!code) {
          this.wordCategory = null;
          return;
        }
        this.wordCategoryService.getCategory(code)
          .subscribe((cat: WordCategory) => {
            this.wordCategory = cat;
          });
      });
  }

  get word() {
    return this._word;
  }

  @Input() userWord: UserWord;
  @Input() context: any;

  @Output() userWordChanged = new EventEmitter<UserWordChange>();

  wordCategory: WordCategory;


  constructor(private userWordService: UserWordService,
              private userVocabularyService: UserVocabularyService,
              private wordCategoryService: WordCategoryService) {
  }

  ngOnInit() {
  }


  addToVocabulary() {
    let uw = new UserWord();
    uw.word = this._word;
    if (this.context) {
      uw.bookId = this.context.bookId;
      uw.chapId = this.context.chapId;
      uw.paraId = this.context.paraId;
    }
    this.userWordService.create(uw)
      .subscribe(_ => {
        this.userWord = uw;
        let uwc = new UserWordChange();
        uwc.word = this._word;
        uwc.familiarity = this.userWord.familiarity;
        uwc.op = 'add';
        this.userWordChanged.emit(uwc);
      });
  }

  familiarityUp() {
    if (this.userWord.familiarity < UserWord.FamiliarityHighest) {
      this.userWord.familiarity++;
      this.userWordService.update(this.userWord)
        .subscribe(() => {
          let uwc = new UserWordChange();
          uwc.word = this._word;
          uwc.familiarity = this.userWord.familiarity;
          uwc.op = 'inc';
          this.userWordChanged.emit(uwc);
        });
    }
  }

  familiarityDown() {
    if (this.userWord.familiarity > UserWord.FamiliarityLowest) {
      this.userWord.familiarity--;
      this.userWordService.update(this.userWord)
        .subscribe(() => {
          let uwc = new UserWordChange();
          uwc.word = this._word;
          uwc.familiarity = this.userWord.familiarity;
          uwc.op = 'dec';
          this.userWordChanged.emit(uwc);
        });
    }
  }

  removeUserWord() {
    /*if (!confirm('确定要移除吗？')) {
      return;
    }*/
    this.userWordService.remove(this.userWord.word)
      .subscribe((opr: OpResult) => {
        if (opr.ok === 1) {
          this.userWord = null;
          let uwc = new UserWordChange();
          uwc.word = this._word;
          uwc.op = 'remove';
          this.userWordChanged.emit(uwc);
        }
      });
  }
}
