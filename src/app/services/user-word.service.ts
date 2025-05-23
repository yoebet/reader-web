import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';

import {of as observableOf, Observable} from 'rxjs';
import {catchError, map, tap, share} from 'rxjs/operators';

import {sortedIndexBy} from 'lodash';

import {environment} from '../../environments/environment';
import {UserWord} from '../models/user-word';
import {OpResult} from '../models/op-result';
import {BaseService} from './base.service';
import {SessionService} from './session.service';

@Injectable()
export class UserWordService extends BaseService<UserWord> {

  allWords: UserWord[];
  userWordsMap: Map<string, UserWord>;
  private latestAdded0: UserWord[] = [];
  latestAddedCapacity = 10;

  private allWords$: Observable<UserWord[]>;


  constructor(protected http: HttpClient,
              protected sessionService: SessionService) {
    super(http, sessionService);
    let apiBase = environment.apiBase || '';
    this.baseUrl = `${apiBase}/user_words`;

    this.sessionService.sessionEventEmitter
      .subscribe(event => {
        if (event === 'Login') {
          // console.log('Login: UserWordService');
          this.clearCache();
          return;
        }
        if (event === 'Logout') {
          // console.log('Logout: UserWordService');
          this.clearCache();
        }
      });
  }

  clearCache() {
    this.allWords = null;
    this.allWords$ = null;
    this.userWordsMap = null;
    this.latestAdded0 = [];
  }

  get latestAdded() {
    return this.latestAdded0;
  }

  private pushLatest(userWord) {
    if (userWord.familiarity === UserWord.FamiliarityHighest) {
      return;
    }
    let la = this.latestAdded0;
    let inLatestAdded = la.find(uw => uw.word === userWord.word);
    if (!inLatestAdded) {
      la.push(userWord);
    }
    if (la.length > this.latestAddedCapacity) {
      la.shift();
    }
  }

  private removeFromLatest(userWord) {
    let la = this.latestAdded0;
    let index = la.indexOf(userWord);
    if (index >= 0) {
      la.splice(index, 1);
    }
  }


  private updateLatest(uw, firstSetup = false) {
    let la = this.latestAdded0;
    if (!firstSetup && uw.familiarity === UserWord.FamiliarityHighest) {
      let idx = la.indexOf(uw);
      if (idx >= 0) {
        la.splice(idx, 1);
      }
      return;
    }
    if (la.length === 0) {
      la.push(uw);
      return;
    }
    if (la.indexOf(uw) >= 0) {
      return;
    }
    let last = la[la.length - 1];
    if (uw.createdMoment.isAfter(last.createdMoment)) {
      la.push(uw);
      if (la.length > this.latestAddedCapacity) {
        la.shift();
      }
      return;
    }
    let insertIndex = sortedIndexBy(la, uw, o => o.createdMoment.valueOf());
    if (insertIndex === 0) {
      if (la.length < this.latestAddedCapacity) {
        la.unshift(uw);
      }
      return;
    }
    la.splice(insertIndex, 0, uw);
    if (la.length > this.latestAddedCapacity) {
      la.shift();
    }
  }

  getOne(word: string): Observable<UserWord> {
    if (this.userWordsMap) {
      let userWord = this.userWordsMap.get(word);
      return observableOf(userWord);
    }
    return this.getUserWordsMap().pipe(
      map(uwm => {
        if (uwm) {
          return uwm.get(word);
        }
        return null;
      }));
  }

  loadAll(): Observable<UserWord[]> {
    if (this.allWords) {
      return observableOf(this.allWords);
    }
    if (this.allWords$) {
      return this.allWords$;
    }
    let obs = super.list(this.baseUrl, true).pipe(
      map((userWords: UserWord[]) => {
        this.allWords = userWords;
        this.allWords$ = null;
        if (this.userWordsMap) {
          this.userWordsMap.clear();
        } else {
          this.userWordsMap = new Map();
        }
        this.latestAdded0 = [];
        for (let uw of userWords) {
          this.userWordsMap.set(uw.word, uw);
          UserWord.ensureCreatedDate(uw);
          this.updateLatest(uw, true);
        }
        return userWords;
      }),
      share()
    );

    this.allWords$ = obs;
    return obs;
  }

  getUserWordsMap(): Observable<Map<string, UserWord>> {
    if (this.userWordsMap) {
      return observableOf(this.userWordsMap);
    }
    return this.loadAll().pipe(map(_ => this.userWordsMap));
  }

  create(userWord: UserWord): Observable<UserWord> {
    let obs = this.http.post<UserWord>(this.baseUrl, userWord, this.getHttpOptions())
      .pipe(
        catchError(this.handleError));
    return obs.pipe(
      tap((result: UserWord) => {
        if (!result || !result._id) {
          return;
        }
        userWord._id = result._id;
        UserWord.ensureCreatedDate(userWord);
        if (this.userWordsMap) {
          this.userWordsMap.set(userWord.word, userWord);
        }
        if (this.allWords) {
          this.allWords.push(userWord);
        }
        this.pushLatest(userWord);
      }));
  }

  update(userWord: UserWord): Observable<OpResult> {
    const url = `${this.baseUrl}/${userWord.word}`;
    let up = {familiarity: userWord.familiarity};
    let obs = this.http.put<OpResult>(url, up, this.getHttpOptions())
      .pipe(
        catchError(this.handleError));
    return obs.pipe(
      tap((opr: OpResult) => {
        if (opr.ok === 1) {
          this.updateLatest(userWord);
        }
      }));
  }

  remove(word: string): Observable<OpResult> {
    const url = `${this.baseUrl}/${word}`;
    let obs = this.http.delete<OpResult>(url, this.getHttpOptions())
      .pipe(
        catchError(this.handleError));
    return obs.pipe(
      tap((opr: OpResult) => {
        if (opr.ok === 1) {
          let userWord;
          if (this.userWordsMap) {
            userWord = this.userWordsMap.get(word);
            if (!userWord) {
              return;
            }
            this.userWordsMap.delete(word);
          }
          if (this.allWords) {
            this.allWords = this.allWords.filter(uw => uw.word !== word);
          }
          if (userWord) {
            this.removeFromLatest(userWord);
          }
        }
      }));
  }

}
