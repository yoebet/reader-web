import {EventEmitter, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';

import {of as observableOf, Observable} from 'rxjs';
import {catchError, map, tap} from 'rxjs/operators';

import {OpResult} from '../models/op-result';
import {UserPreference} from '../models/user-preference';
import {BaseService} from './base.service';
import {SessionService} from './session.service';

@Injectable()
export class UserPreferenceService extends BaseService<UserPreference> {

  userPreference: UserPreference;

  readonly onBaseVocabularyChanged = new EventEmitter<string>();

  constructor(protected http: HttpClient,
              protected sessionService: SessionService) {
    super(http, sessionService);
    let apiBase = environment.apiBase || '';
    this.baseUrl = `${apiBase}/user_preferences`;

    this.sessionService.sessionEventEmitter
      .subscribe(event => {
        if (event === 'Login') {
          console.log('Login: UserPreferenceService');
          this.clearCache();
          return;
        }
        if (event === 'Logout') {
          console.log('Logout: UserPreferenceService');
          this.clearCache();
        }
      });
  }

  clearCache() {
    this.userPreference = null;
  }

  get(): Observable<UserPreference> {
    if (this.userPreference) {
      return observableOf(this.userPreference);
    }
    return super.getOneByUrl(this.baseUrl).pipe(
      map((up: UserPreference) => {
        if (!up) up = new UserPreference();
        this.userPreference = up;
        if (up.baseVocabulary) {
          this.onBaseVocabularyChanged.emit(up.baseVocabulary);
        }
        return up;
      }));
  }

  getBaseVocabulary(): Observable<string> {
    return this.get().pipe(map((up: UserPreference) => {
      return up.baseVocabulary;
    }));
  }

  getWordTags(): Observable<string[]> {
    return this.get().pipe(map((up: UserPreference) => {
      return up.wordTags;
    }));
  }

  private setValue(code: string, value) {
    let url = `${this.baseUrl}/code/${code}`;
    return this.http.post<OpResult>(url, {[code]: value}, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  setBaseVocabulary(categoryCode: string): Observable<OpResult> {
    let obs = this.setValue('baseVocabulary', categoryCode);
    return obs.pipe(tap(opr => {
      if (opr && opr.ok === 1) {
        if (this.userPreference) {
          this.userPreference.baseVocabulary = categoryCode;
        }
        this.onBaseVocabularyChanged.emit(categoryCode);
      }
    }));
  }

  setWordTags(categoryCodes: string[]): Observable<OpResult> {
    let obs = this.setValue('wordTags', categoryCodes);
    return obs.pipe(tap(opr => {
      if (opr && opr.ok === 1) {
        if (this.userPreference) {
          this.userPreference.wordTags = categoryCodes;
        }
      }
    }));
  }
}
