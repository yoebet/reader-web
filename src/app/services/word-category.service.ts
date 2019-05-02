import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';

import {of as observableOf, Observable} from 'rxjs';
import {catchError, map, share, tap} from 'rxjs/operators';

import {WordBook, WordCategory} from '../models/word-category';
import {BaseService} from './base.service';
import {SessionService} from './session.service';

@Injectable()
export class WordCategoryService extends BaseService<WordCategory> {

  wordCategories: WordCategory[];
  wordCategoriesMap: Map<string, WordCategory>;

  // categoryCode -> words
  private allWordsMap = new Map<string, string[]>();

  constructor(protected http: HttpClient,
              protected sessionService: SessionService) {
    super(http, sessionService);
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
    return this.http.post<string[]>(url, null, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  loadAllWords(code): Observable<string[]> {
    let words = this.allWordsMap.get(code);
    if (words) {
      return observableOf(words);
    }

    let url = `${this.baseUrl}/word_book/${code}`;
    return this.http.get<WordBook>(url, this.getHttpOptions())
      .pipe(
        map(wordBook => wordBook.words),
        tap(words => this.allWordsMap.set(code, words)),
        catchError(this.handleError)
      );
  }

}
