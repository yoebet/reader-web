import {Injectable} from '@angular/core';
import {BaseService} from './base.service';
import {environment} from '../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {SessionService} from './session.service';
import {Observable} from 'rxjs/index';
import {AppRelease} from '../models/app-release';

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
