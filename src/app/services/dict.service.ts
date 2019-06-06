import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';

import {Observable, of} from 'rxjs';
import {map, catchError} from 'rxjs/operators';

import {DictEntry, DictFields, PosMeanings} from '../models/dict-entry';
import {BaseService} from './base.service';
import {SessionService} from './session.service';

@Injectable()
export class DictService extends BaseService<DictEntry> {

  staticBase: string;

  private _entryHistory: DictEntry[] = [];
  private entryCache: Map<string, DictEntry> = new Map();
  private baseFormsMap: Map<string, string>;

  entryHistoryCapacity = 10;

  constructor(protected http: HttpClient,
              protected sessionService: SessionService) {
    super(http, sessionService);
    let apiBase = environment.apiBase || '';
    this.baseUrl = `${apiBase}/dict`;
    this.staticBase = environment.staticBase;
  }

  get entryHistory(): DictEntry[] {
    return this._entryHistory;
  }

  clearHistory() {
    this._entryHistory = [];
  }

  private pushHistory(entry) {
    let eh = this._entryHistory;
    let inHistory = eh.find(e => e.word === entry.word);
    if (!inHistory) {
      eh.push(entry);
    }
    if (eh.length > this.entryHistoryCapacity) {
      eh.shift();
    }
  }

  getEntry(word: string, options: any = {}): Observable<DictEntry> {
    let cachedEntry = this.entryCache.get(word);
    if (cachedEntry) {
      return of(cachedEntry);
    }
    let url = `${this.baseUrl}/${word}`;
    let switches = ['base', 'stem'].filter(name => options[name]);
    if (switches.length > 0) {
      url += '?';
      url += switches.join('&');
    }

    let obs = this.getOneByUrl(url);
    if (options.fields && options.fields !== DictFields.COMPLETE) {
      return obs;
    }

    return obs.pipe(map(entry => {
      if (entry) {
        if (options.pushHistory !== false) {
          this.pushHistory(entry);
        }
        this.entryCache.set(entry.word, entry);
      }
      return entry;
    }));
  }

  getCompleteMeanings(word: string): Observable<PosMeanings[]> {
    let cachedEntry = this.entryCache.get(word);
    if (cachedEntry) {
      if (typeof cachedEntry.complete !== 'undefined') {
        return of(cachedEntry.complete);
      }
    }

    let url = `${this.baseUrl}/${word}/complete`;
    let obs = this.http.get<PosMeanings[]>(url, this.getHttpOptions())
      .pipe(
        catchError(this.handleErrorGET));
    if (!cachedEntry) {
      return obs;
    }
    return obs.pipe(map((complete: PosMeanings[]) => {
      cachedEntry.complete = complete;
      return complete;
    }));
  }

  search(key: string, options: any = {}): Observable<DictEntry[]> {
    let {limit, fields} = options;
    if (!limit) {
      limit = 8;
    }
    let url = `${this.baseUrl}/search/${key}?limit=${limit}`;

    let switches = ['phrase', 'phraseOnly', 'basic', 'cet', 'gre']
      .filter(name => options[name]);
    if (switches.length > 0) {
      url += '&';
      url += switches.join('&');
    }
    if (fields) {
      url += '&fields=' + fields;
    }

    return this.list(url);
  }

  loadBaseForms(): Observable<Map<string, string>> {

    return Observable.create(observer => {
      if (this.baseFormsMap) {
        observer.next(this.baseFormsMap);
        observer.complete();
        return;
      }

      let scope = 'b6'; // b6/all
      let url = `${this.baseUrl}/baseForms/${scope}`;
      this.http.get<any[]>(url, this.getHttpOptions())
        .pipe(
          catchError(this.handleErrorGET)
        ).subscribe((words: string[][]) => {
          this.baseFormsMap = new Map();
          for (let [word, base] of words) {
            this.baseFormsMap.set(word, base);
          }
          console.log('baseFormsMap: ' + this.baseFormsMap.size);
          observer.next(this.baseFormsMap);
          observer.complete();
        }
      );
    });

  }

}
