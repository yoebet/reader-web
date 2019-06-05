import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';

import {Observable, of} from 'rxjs';
import {catchError, map, share} from 'rxjs/operators';

import {environment} from '../../environments/environment';
import {DictZh} from '../models/dict-zh';
import {ZhPhrases} from '../anno/zh-phrases';

import {BaseService} from './base.service';
import {SessionService} from './session.service';

@Injectable()
export class DictZhService extends BaseService<DictZh> {
  private _entryHistory: DictZh[] = [];
  private entryCache: Map<string, DictZh> = new Map();
  private phrases: ZhPhrases;

  private staticBase;

  constructor(protected http: HttpClient,
              protected sessionService: SessionService) {
    super(http, sessionService);
    let apiBase = environment.apiBase || '';
    this.baseUrl = `${apiBase}/dict_zh`;
    this.staticBase = environment.staticBase;
  }

  clearCache() {
    this.entryCache.clear();
    this._entryHistory = [];
  }

  get entryHistory(): DictZh[] {
    return this._entryHistory;
  }

  private pushHistory(entry) {
    let eh = this._entryHistory;
    let inHistory = eh.find(e => e.word === entry.word);
    if (!inHistory) {
      eh.push(entry);
    }
    if (eh.length > 10) {
      eh.shift();
    }
  }

  private updateCache(entry) {
    this.entryCache.set(entry._id, entry);
    this.entryCache.set(entry.word, entry);
  }

  private cacheOne(obs: Observable<DictZh>): Observable<DictZh> {
    obs = obs.pipe(share());
    obs.subscribe(entry => {
      if (entry) {
        this.pushHistory(entry);
        this.updateCache(entry);
      }
    });
    return obs;
  }

  search(key: string, options: any = {}): Observable<DictZh[]> {
    let {limit} = options;
    if (!limit) {
      limit = 8;
    }
    let url = `${this.baseUrl}/search/${key}?limit=${limit}`;
    return this.list(url);
  }

  getEntry(idOrWord: string, options: any = {}): Observable<DictZh> {
    let cachedEntry = this.entryCache.get(idOrWord);
    if (cachedEntry) {
      return of(cachedEntry);
    }
    const {cl} = options;
    let url = `${this.baseUrl}/${idOrWord}`;
    if (cl) {
      url += '?cl';
    }
    return this.cacheOne(this.getOneByUrl(url));
  }

  getPhrases(): Observable<ZhPhrases> {
    if (this.phrases) {
      return of(this.phrases);
    }
    let url = `${this.staticBase}/dict-zh/phrases_all.json`;
    // let url = `${this.baseUrl}/phrases/all`;
    return this.http.get<string[]>(url, this.getHttpOptions()).pipe(
      map(words => {
        this.phrases = new ZhPhrases(words);
        return this.phrases;
      }),
      catchError(this.handleErrorGET));
  }

}
