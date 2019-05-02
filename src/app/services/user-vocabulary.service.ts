import {Injectable} from '@angular/core';

import {combineLatest as observableCombineLatest, of as observableOf, Observable, EMPTY} from 'rxjs';
import {map, share, catchError} from 'rxjs/operators';

import {groupBy} from 'lodash';

import {WordCategory} from '../models/word-category';
import {UserWord} from '../models/user-word';
import {CombinedWordsMap} from '../en/combined-words-map';

import {UserWordService} from './user-word.service';
import {WordCategoryService} from './word-category.service';
import {UserPreferenceService} from './user-preference.service';
import {DictService} from './dict.service';

@Injectable()
export class UserVocabularyService {

  private baseVocabulary: string;

  private baseVocabularyMap: Map<string, string>;
  private combinedWordsMap: CombinedWordsMap;


  constructor(private preferenceService: UserPreferenceService,
              private userWordService: UserWordService,
              private wordCategoryService: WordCategoryService,
              private dictService: DictService) {

    preferenceService.onBaseVocabularyChanged
      .subscribe(code => {
        if (code === this.baseVocabulary) {
          return;
        }
        this.invalidateBaseVocabularyMap();
      });
  }

  invalidateBaseVocabularyMap() {
    this.baseVocabularyMap = null;
    this.combinedWordsMap = null;
  }

  getBaseVocabularyMap(): Observable<Map<string, string>> {

    return Observable.create(observer => {
      if (this.baseVocabularyMap) {
        observer.next(this.baseVocabularyMap);
        observer.complete();
        return;
      }

      let bvm = this.baseVocabularyMap = new Map();

      this.preferenceService.getBaseVocabulary()
        .subscribe((code) => {
          if (!code) {
            observer.next(bvm);
            observer.complete();
            return;
          }
          this.wordCategoryService.getCategory(code)
            .subscribe((cat: WordCategory) => {
              if (!cat) {
                observer.next(bvm);
                observer.complete();
                return;
              }

              let codes = [];
              while (cat) {
                if (codes.includes(cat.code)) {
                  console.warn('CIRCULAR ..');
                  break;
                }
                codes.push(cat.code);
                if (cat.extend) {
                  cat = cat.extend;
                } else {
                  break;
                }
              }

              let codesLen = codes.length;

              for (let tcode of codes) {
                this.wordCategoryService.loadAllWords(tcode)
                  .subscribe((words: string[]) => {
                    if (words) {
                      for (let word of words) {
                        if (word.indexOf(' ') === -1) {
                          bvm.set(word, tcode);
                        }
                      }
                    }
                    codesLen--;
                    if (codesLen === 0) {
                      observer.next(bvm);
                      observer.complete();

                      if (this.combinedWordsMap) {
                        this.combinedWordsMap.baseVocabularyMap = bvm;
                      }
                    }
                  });
              }
            });
        });
    });
  }


  inBaseVocabulary(word: string): Observable<string> {
    if (this.baseVocabularyMap) {
      return observableOf(this.baseVocabularyMap.get(word));
    }
    return this.getBaseVocabularyMap()
      .pipe(map((vm: Map<string, string>) => {
        if (!vm) {
          return null;
        }
        return vm.get(word);
      }));
  }

  getCombinedWordsMap(): Observable<CombinedWordsMap> {
    if (this.combinedWordsMap) {
      return observableOf(this.combinedWordsMap);
    }

    return observableCombineLatest(
      this.getBaseVocabularyMap(),
      this.userWordService.getUserWordsMap(),
      this.dictService.loadBaseForms()
    ).pipe(
      map(([baseVocabularyMap, userWordsMap, baseFormsMap]) => {
        if (!baseVocabularyMap || !userWordsMap || !baseFormsMap) {
          return null;
        }
        let cwm = new CombinedWordsMap(
          baseVocabularyMap as Map<string, string>,
          userWordsMap as Map<string, UserWord>,
          baseFormsMap as Map<string, string>);
        this.combinedWordsMap = cwm;
        return cwm;
      }),
      catchError(e => EMPTY),
      share()
    );
  }

  statistic(): Observable<Object> {
    return Observable.create(observer => {
      observableCombineLatest(
        this.getBaseVocabularyMap(),
        this.userWordService.list())
        .subscribe(([baseVocabularyMap, userWords]) => {
          let bvm = baseVocabularyMap as Map<string, string>;
          let uws = userWords as UserWord[];

          uws = uws.filter(uw => uw.word && uw.word.indexOf(' ') === -1);

          let uwsByFamiliarity = groupBy<UserWord>(uws, 'familiarity');

          let $word = (uw: UserWord) => uw.word;
          let wordsFamiliarity1: string[] = (uwsByFamiliarity['1'] || []).map($word);
          let wordsFamiliarity2: string[] = (uwsByFamiliarity['2'] || []).map($word);
          let wordsFamiliarity3: string[] = (uwsByFamiliarity['3'] || []).map($word);

          let unfamiliarCountInBV = 0;

          for (let word of wordsFamiliarity1.concat(wordsFamiliarity2)) {
            if (bvm.get(word)) {
              unfamiliarCountInBV++;
            }
          }

          let familiarCountNotInBV = 0;
          for (let word of wordsFamiliarity3) {
            if (!bvm.get(word)) {
              familiarCountNotInBV++;
            }
          }

          let baseVocabularyCount = bvm.size;
          let userWordsCount = uws.length;

          let graspedCount = baseVocabularyCount - unfamiliarCountInBV + familiarCountNotInBV;

          let vocabularyStatistic = {
            baseVocabularyCount,
            userWordsCount,
            familiarity1Count: wordsFamiliarity1.length,
            familiarity2Count: wordsFamiliarity2.length,
            familiarity3Count: wordsFamiliarity3.length,
            unfamiliarCountInBV,
            familiarCountNotInBV,
            graspedCount
          };

          observer.next(vocabularyStatistic);
          observer.complete();
        });

    });
  }

}
