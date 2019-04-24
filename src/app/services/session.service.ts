import {Injectable, EventEmitter} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {environment} from '../../environments/environment';

import {throwError, Observable} from 'rxjs';
import {map, catchError} from 'rxjs/operators';

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
    return this.http.post(this.loginUrl, {name, pass}, this.httpOptions)
      .pipe(
        map((opr: OpResult) => {
            if (opr && opr.ok === 1) {
              let from = this.currentUser ? this.currentUser.name : null;
              this.currentUser = new User();
              this.currentUser.name = name;
              this.currentUser.nickName = (opr as any).nickName;
              this.currentUser.role = (opr as any).role;
              if (from !== name) {
                this.onCurrentUserChanged.emit({from, to: name});
              }
              return opr;
            }
          },
          catchError(this.handleError)));
  }

  logout(): Observable<OpResult> {
    return this.http.delete(this.loginUrl, this.httpOptions)
      .pipe(
        map((opr: OpResult) => {
          if (opr && opr.ok === 1) {
            let from = this.currentUser ? this.currentUser.name : null;
            this.currentUser = null;
            if (from !== null) {
              this.onCurrentUserChanged.emit({from, to: null});
            }
          }
          return opr;
        }),
        catchError(this.handleError));
  }

  checkLogin(): Observable<any> {
    let url = `${this.loginUrl}/userinfo`;
    return this.http.get<any>(url, this.httpOptions).pipe(
      map(userinfo => {
        let cu = this.currentUser;
        let from = cu ? cu.name : null;
        if (userinfo && userinfo.login) {
          cu = new User();
          cu.name = userinfo.name;
          cu.nickName = userinfo.nickName;
          cu.role = userinfo.role;
        } else {
          cu = null;
        }
        this.currentUser = cu;
        let to = cu ? cu.name : null;
        if (from !== to) {
          this.onCurrentUserChanged.emit({from, to});
        }
        return userinfo;
      }),
      catchError(this.handleError));
  }

  private handleError(error: any): Observable<any> {
    console.error(error);
    return throwError(error);
  }
}
