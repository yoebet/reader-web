import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';

import {Observable} from 'rxjs';

import {UserBook} from '../models/user-book';
import {BaseService} from './base.service';
import {SuiModalService} from 'ng2-semantic-ui';

@Injectable()
export class UserBookService extends BaseService<UserBook> {

  constructor(protected http: HttpClient,
              protected modalService: SuiModalService) {
    super(http, modalService);
    let apiBase = environment.apiBase || '';
    this.baseUrl = `${apiBase}/user_books`;
  }

  getOne(bookId: string): Observable<UserBook> {
    return super.getOne(bookId);
  }

}
