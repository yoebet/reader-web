import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';

import {SuiModalService} from 'ng2-semantic-ui';

import {Book} from '../models/book';
import {BaseService} from './base.service';

@Injectable()
export class BookService extends BaseService<Book> {

  constructor(protected http: HttpClient,
              protected modalService: SuiModalService) {
    super(http, modalService);
    let apiBase = environment.apiBase || '';
    this.baseUrl = `${apiBase}/books`;
  }

}
