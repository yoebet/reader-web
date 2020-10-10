import {EventEmitter, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';

import {of as observableOf, Observable} from 'rxjs';
import {map} from 'rxjs/operators';

import {environment} from '../../environments/environment';
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
        if (event === 'Login' || event === 'Logout') {
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
    return super.getOneByUrl(this.baseUrl, true).pipe(
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

}
