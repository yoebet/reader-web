import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';

import {Observable} from 'rxjs';

import {UserBook} from '../models/user-book';
import {BaseService} from './base.service';
import {SessionService} from './session.service';

@Injectable()
export class UserBookService extends BaseService<UserBook> {

  constructor(protected http: HttpClient,
              protected sessionService: SessionService) {
    super(http, sessionService);
    let apiBase = environment.apiBase || '';
    this.baseUrl = `${apiBase}/user_books`;
  }

  getOne(bookId: string): Observable<UserBook> {
    return super.getOne(bookId);
  }

}
