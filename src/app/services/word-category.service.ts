import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';

import {SuiModalService} from 'ng2-semantic-ui';

import {of as observableOf, Observable} from 'rxjs';
import {catchError, map, share} from 'rxjs/operators';

import {WordBook, WordCategory} from '../models/word-category';
import {BaseService} from './base.service';

@Injectable()
export class WordCategoryService extends BaseService<WordCategory> {

  wordCategories: WordCategory[];
  wordCategoriesMap: Map<string, WordCategory>;

  // categoryCode -> words
  private allWordsMap = new Map<string, Observable<string[]>>();

  constructor(protected http: HttpClient,
              protected modalService: SuiModalService) {
    super(http, modalService);
    let apiBase = environment.apiBase || '';
    this.baseUrl = `${apiBase}/word_categories`;
  }

  list(): Observable<WordCategory[]> {
    if (this.wordCategories) {
      return observableOf(this.wordCategories);
    }
    return super.list().pipe(map((cats: WordCategory[]) => {
      // setup extend
      let catsMap = this.wordCategoriesMap;
      if (catsMap) {
        catsMap.clear();
      } else {
        catsMap = this.wordCategoriesMap = new Map();
      }
      for (let cat of cats) {
        catsMap.set(cat.code, cat);
      }
      for (let cat of cats) {
        if (cat.extendTo) {
          cat.extend = catsMap.get(cat.extendTo);
        }
      }
      this.wordCategories = cats;
      return cats;
    }));
  }

  getCategoriesMap(): Observable<Map<string, WordCategory>> {
    if (this.wordCategories) {
      return observableOf(this.wordCategoriesMap);
    }
    return this.list().pipe(map(cats => this.wordCategoriesMap));
  }

  getCategory(code: string): Observable<WordCategory> {
    if (this.wordCategories) {
      return observableOf(this.wordCategoriesMap.get(code));
    }
    return this.getCategoriesMap().pipe(map(catsMap => catsMap.get(code)));
  }

  fetchSampleWords(code, limit = 20): Observable<string[]> {
    let url = `${this.baseUrl}/${code}/sample`;
    if (limit) {
      url = url + '?limit=' + limit;
    }
    return this.http.post<string[]>(url, null, this.httpOptions).pipe(
      catchError(this.handleError));
  }

  loadAllWords(code): Observable<string[]> {
    let wordsObs = this.allWordsMap.get(code);
    if (wordsObs) {
      return wordsObs;
    }

    let url = `${this.baseUrl}/word_book/${code}`;
    wordsObs = this.http.get<WordBook>(url, this.httpOptions)
      .pipe(
        map(wordBook => wordBook.words),
        share(),
        catchError(this.handleError));
    this.allWordsMap.set(code, wordsObs);
    return wordsObs;
  }

}
