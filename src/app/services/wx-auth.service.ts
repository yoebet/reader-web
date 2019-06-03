import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';

import {catchError, map} from 'rxjs/operators';
import {Observable} from 'rxjs/internal/Observable';

import {BaseService} from './base.service';
import {SessionService} from './session.service';
import {environment} from '../../environments/environment';
import {OpResult} from '../models/op-result';


@Injectable()
export class WxAuthService extends BaseService<any> {

  constructor(protected http: HttpClient,
              protected sessionService: SessionService) {
    super(http, sessionService);
    let apiBase = environment.apiBase || '';
    this.baseUrl = `${apiBase}/wx_auth`;
  }

  requestAccessToken(code: string): Observable<any> {
    let url = `${this.baseUrl}/requestAccessToken`;
    return this.http.post<any>(url, {code}, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  requestAccessTokenAndLogin(code: string): Observable<any> {
    let url = `${this.baseUrl}/requestAccessTokenAndLogin`;
    return this.http.post<any>(url, {code}, this.getHttpOptions())
      .pipe(
        map((opr: OpResult) => {
          if (opr && opr.ok === 1) {
            let ui = opr as any;
            this.sessionService.onLoginSuccess(ui);
            alert(ui.nickName);
          }
          return opr;
        }),
        catchError(this.handleError));
  }

}
