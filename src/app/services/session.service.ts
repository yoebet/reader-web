import {Injectable, EventEmitter} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {environment} from '../../environments/environment';

import {throwError as observableThrowError, Observable} from 'rxjs';
import {share, catchError} from 'rxjs/operators';

import {DefaultHttpHeaders} from '../config';
import {User} from '../models/user';
import {OpResult} from '../models/op-result';

@Injectable()
export class SessionService {

  private httpOptions = {
    headers: new HttpHeaders(DefaultHttpHeaders),
    withCredentials: true
  };

  private loginUrl: string;

  currentUser: User;

  readonly onCurrentUserChanged = new EventEmitter<{ from, to }>();

  constructor(private http: HttpClient) {
    let apiBase = environment.apiBase || '';
    this.loginUrl = `${apiBase}/login`;
  }

  login(name, pass): Observable<OpResult> {
    let obs = this.http.post(this.loginUrl, {name, pass}, this.httpOptions).pipe(
      catchError(this.handleError));
    obs = obs.pipe(share());
    obs.subscribe((opr: OpResult) => {
      if (opr && opr.ok === 1) {
        let from = this.currentUser ? this.currentUser.name : null;
        this.currentUser = new User();
        this.currentUser.name = name;
        this.currentUser.nickName = (opr as any).nickName;
        this.currentUser.role = (opr as any).role;
        if (from !== name) {
          this.onCurrentUserChanged.emit({from, to: name});
        }
      }
    });
    return obs;
  }

  logout(): Observable<OpResult> {
    let obs = this.http.delete(this.loginUrl, this.httpOptions).pipe(
      catchError(this.handleError));
    obs = obs.pipe(share());
    obs.subscribe((opr: OpResult) => {
      if (opr && opr.ok === 1) {
        let from = this.currentUser ? this.currentUser.name : null;
        this.currentUser = null;
        if (from !== null) {
          this.onCurrentUserChanged.emit({from, to: null});
        }
      }
    });
    return obs;
  }

  checkLogin(): Observable<any> {
    let url = `${this.loginUrl}/userinfo`;
    let obs = this.http.get<any>(url, this.httpOptions).pipe(
      catchError(this.handleError));
    obs = obs.pipe(share());
    obs.subscribe(userinfo => {
      let from = this.currentUser ? this.currentUser.name : null;
      if (userinfo && userinfo.login) {
        this.currentUser = new User();
        this.currentUser.name = userinfo.name;
        this.currentUser.nickName = userinfo.nickName;
        this.currentUser.role = userinfo.role;
      } else {
        this.currentUser = null;
      }
      let to = this.currentUser ? this.currentUser.name : null;
      if (from !== to) {
        this.onCurrentUserChanged.emit({from, to});
      }
    });
    return obs;
  }

  private handleError(error: any): Observable<any> {
    console.error(error);
    return observableThrowError(error);
  }
}
