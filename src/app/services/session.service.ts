import {Injectable, EventEmitter} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';

import {Observable, EMPTY} from 'rxjs';
import {map} from 'rxjs/operators';

import {environment} from '../../environments/environment';
import {DefaultHttpHeaders, HeaderNames, HeaderValues} from '../config';
import {User} from '../models/user';
import {OpResult} from '../models/op-result';

@Injectable()
export class SessionService {

  private loginUrl: string;

  currentUser: User;

  readonly sessionEventEmitter = new EventEmitter<string>();

  constructor(private http: HttpClient) {
    let apiBase = environment.apiBase || '';
    this.loginUrl = `${apiBase}/login`;
  }


  getHttpOptions() {
    let headers = new HttpHeaders(DefaultHttpHeaders)
      .set(HeaderNames.Client, HeaderValues.Client);
    let UN = HeaderNames.UserName;
    let UT = HeaderNames.UserToken;
    let cu = this.currentUser;
    if (cu && cu.name && cu.accessToken) {
      headers = headers.set(UN, cu.name)
        .set(UT, cu.accessToken);
    } else {
      let storage = window.localStorage;
      let un = storage.getItem(UN);
      let ut = storage.getItem(UT);
      if (un && ut) {
        headers = headers.set(UN, un).set(UT, ut);
      }
    }
    return {
      headers/*,
      withCredentials: true*/
    };
  }


  loginByTempToken(tempToken: string): Observable<OpResult> {
    return this.doLogin({tempToken});
  }

  login(name, pass): Observable<OpResult> {
    return this.doLogin({name, pass});
  }

  onLoginSuccess(ui) {
    this.updateCurrentUser(ui);
    this.sessionEventEmitter.emit('Login');
  }

  private doLogin(form): Observable<OpResult> {
    return this.http.post(this.loginUrl, form, this.getHttpOptions())
      .pipe(
        map((opr: OpResult) => {
          if (opr && opr.ok === 1) {
            let ui = opr as any;
            this.onLoginSuccess(ui);
          }
          return opr;
        }));
  }

  logout(): Observable<OpResult> {
    return this.http.delete(this.loginUrl, this.getHttpOptions())
      .pipe(
        map((opr: OpResult) => {
          if (opr && opr.ok === 1) {
            this.currentUser = null;
            let storage = window.localStorage;
            storage.removeItem(HeaderNames.UserName);
            storage.removeItem(HeaderNames.UserToken);
          }
          return opr;
        }));
  }

  private updateCurrentUser(ui) {
    let cu = new User();
    Object.assign(cu, ui);
    if (cu.accessToken) {
      let storage = window.localStorage;
      storage.setItem(HeaderNames.UserName, ui.name);
      storage.setItem(HeaderNames.UserToken, cu.accessToken);
    }
    this.currentUser = cu;
  }

  checkLogin(): Observable<User> {
    let url = `${this.loginUrl}/userinfo`;
    return this.http.get<any>(url, this.getHttpOptions())
      .pipe(
        map(ui => {
          if (ui && ui.login) {
            this.updateCurrentUser(ui);
          } else {
            this.currentUser = null;
          }
          return this.currentUser;
        }));
  }

  handleError401(error: any): Observable<any> {
    this.sessionEventEmitter.emit('RequestLogin');
    return EMPTY;
  }
}
