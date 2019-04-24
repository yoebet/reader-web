import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';

import {Chap} from '../models/chap';
import {SuiModalService} from 'ng2-semantic-ui';
import {BaseService} from './base.service';

@Injectable()
export class ChapService extends BaseService<Chap> {

  constructor(protected http: HttpClient,
              protected modalService: SuiModalService) {
    super(http, modalService);
    let apiBase = environment.apiBase || '';
    this.baseUrl = `${apiBase}/chaps`;
  }

}
