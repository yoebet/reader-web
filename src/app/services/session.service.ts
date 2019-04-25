import {Injectable, EventEmitter} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {environment} from '../../environments/environment';

import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

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
            let cu = this.currentUser;
            let from = cu ? cu.name : null;
            cu = new User();
            cu.name = name;
            cu.nickName = (opr as any).nickName;
            cu.role = (opr as any).role;
            this.currentUser = cu;
            if (from !== name) {
              this.onCurrentUserChanged.emit({from, to: name});
            }
            return opr;
          }
        }));
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
        }));
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
      }));
  }
}
