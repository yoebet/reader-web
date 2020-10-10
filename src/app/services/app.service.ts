import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';

import {Observable} from 'rxjs';

import {environment} from '../../environments/environment';
import {SessionService} from './session.service';
import {AppRelease} from '../models/app-release';
import {BaseService} from './base.service';

@Injectable()
export class AppService extends BaseService<any> {

  constructor(protected http: HttpClient,
              protected sessionService: SessionService) {
    super(http, sessionService);
    let apiBase = environment.apiBase || '';
    this.baseUrl = `${apiBase}/app`;
  }

  getAppRelease(): Observable<AppRelease> {
    let url = `${this.baseUrl}/latestVersion`;
    return super.getOneByUrl(url) as Observable<AppRelease>;
  }

}
