import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';

import {Observable, of} from 'rxjs';
import {tap} from 'rxjs/operators';

import {Book} from '../models/book';
import {BaseService} from './base.service';
import {SessionService} from './session.service';

@Injectable()
export class BookService extends BaseService<Book> {

  booksMap: Map<string, Book> = new Map<string, Book>();

  constructor(protected http: HttpClient,
              protected sessionService: SessionService) {
    super(http, sessionService);
    let apiBase = environment.apiBase || '';
    this.baseUrl = `${apiBase}/books`;
  }

  getDetail(bookId: string): Observable<Book> {
    let book = this.booksMap.get(bookId);
    if (book) {
      return of(book);
    }
    return super.getDetail(bookId)
      .pipe(tap(b => {
        this.booksMap.set(b._id, b);
      }));
  }

}
