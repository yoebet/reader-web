import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';

import {Observable, of} from 'rxjs';
import {map, catchError, share} from 'rxjs/operators';

import {SuiModalService} from 'ng2-semantic-ui';

import {DictEntry, DictFields, PosMeanings} from '../models/dict-entry';
import {BaseService} from './base.service';

@Injectable()
export class DictService extends BaseService<DictEntry> {

  staticBase: string;

  private _entryHistory: DictEntry[] = [];
  private entryCache: Map<string, DictEntry> = new Map();
  private baseFormsMap: Map<string, string>;

  entryHistoryCapacity = 20;

  constructor(protected http: HttpClient,
              protected modalService: SuiModalService) {
    super(http, modalService);
    let apiBase = environment.apiBase || '';
    this.baseUrl = `${apiBase}/dict`;
    this.staticBase = environment.staticBase;
  }

  clearCache() {
    this.entryCache.clear();
    this._entryHistory = [];
  }

  get entryHistory(): DictEntry[] {
    return this._entryHistory;
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

  private cacheOne(obs: Observable<DictEntry>): Observable<DictEntry> {
    obs = obs.pipe(share());
    obs.subscribe(entry => {
      if (entry) {
        this.pushHistory(entry);
        this.entryCache.set(entry.word, entry);
      }
    });
    return obs;
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

    return this.cacheOne(obs);
  }

  getCompleteMeanings(word: string): Observable<PosMeanings[]> {
    let cachedEntry = this.entryCache.get(word);
    if (cachedEntry) {
      if (typeof cachedEntry.complete !== 'undefined') {
        return of(cachedEntry.complete);
      }
    }

    let url = `${this.baseUrl}/${word}/complete`;
    let obs = this.http.get<PosMeanings[]>(url, this.httpOptions).pipe(
      catchError(this.handleError));
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
    if (this.baseFormsMap) {
      return of(this.baseFormsMap);
    }

    let scope = 'all'; //b6
    let url = `${this.baseUrl}/baseForms/${scope}`;
    return this.http.get<any[]>(url, this.httpOptions).pipe(
      map((words: string[][]) => {
        this.baseFormsMap = new Map();
        for (let [word, base] of words) {
          this.baseFormsMap.set(word, base);
        }
        return this.baseFormsMap;
      }),
      catchError(this.handleError));
  }

}
