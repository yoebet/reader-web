import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';

import {Chap} from '../models/chap';
import {BaseService} from './base.service';
import {SessionService} from './session.service';

@Injectable()
export class ChapService extends BaseService<Chap> {

  constructor(protected http: HttpClient,
              protected sessionService: SessionService) {
    super(http, sessionService);
    let apiBase = environment.apiBase || '';
    this.baseUrl = `${apiBase}/chaps`;
  }

}
