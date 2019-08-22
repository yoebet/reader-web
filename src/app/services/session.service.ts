import {Injectable, EventEmitter} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';

import {Observable, EMPTY, of} from 'rxjs';
import {map} from 'rxjs/operators';

import md5 from 'md5';

import {environment} from '../../environments/environment';
import {DefaultHttpHeaders, HeaderNames, HeaderValues} from '../config';
import {User} from '../models/user';
import {OpResult} from '../models/op-result';

@Injectable()
export class SessionService {

  private baseUrl: string;

  currentUser: User;

  readonly sessionEventEmitter = new EventEmitter<string>();

  private digestMap = new Map<string, string>();

  constructor(private http: HttpClient) {
    let apiBase = environment.apiBase || '';
    this.baseUrl = `${apiBase}/login`;
  }

  private getMd5(str): string {
    let hash = this.digestMap.get(str);
    if (hash) {
      return hash;
    }
    hash = md5(str);
    this.digestMap.set(str, hash);
    return hash;
  }

  getHttpOptions() {
    let headers = new HttpHeaders(DefaultHttpHeaders)
      .set(HeaderNames.Client, HeaderValues.Client);
    let UN = HeaderNames.UserName;
    let UT = HeaderNames.UserToken;
    // let NTD = HeaderNames.NameTokenDigest;

    let cu = this.currentUser;
    if (cu && cu.name && cu.accessToken) {
      headers = headers.set(UN, cu.name);
      headers = headers.set(UT, cu.accessToken);
      // let digest = this.getMd5(`${cu.name}.${cu.accessToken}`);
      // headers = headers.set(NTD, digest);
    } else {
      let storage = window.localStorage;
      let un = storage.getItem(UN);
      let ut = storage.getItem(UT);
      if (un && ut) {
        headers = headers.set(UN, un);
        headers = headers.set(UT, ut);
        // let digest = this.getMd5(`${un}.${ut}`);
        // headers = headers.set(NTD, digest);
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
    return this.http.post(this.baseUrl, form, this.getHttpOptions())
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
    return this.http.delete(this.baseUrl, this.getHttpOptions())
      .pipe(
        map((opr: OpResult) => {
          if (opr && opr.ok === 1) {
            this.logoutLocally();
          }
          return opr;
        }));
  }


  logoutLocally() {
    this.currentUser = null;
    let storage = window.localStorage;
    storage.removeItem(HeaderNames.UserName);
    storage.removeItem(HeaderNames.UserToken);
    this.sessionEventEmitter.emit('Logout');
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
    let ho = this.getHttpOptions();
    let UN = HeaderNames.UserName;
    if (!ho.headers.get(UN)) {
      this.currentUser = null;
      return of(null);
    }
    let url = `${this.baseUrl}/userinfo`;
    return this.http.get<any>(url, ho)
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
    console.log(error);
    this.sessionEventEmitter.emit('RequestLogin');
    return EMPTY;
  }
}
