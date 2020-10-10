import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';

import {Observable, of} from 'rxjs';
import {tap} from 'rxjs/operators';

import {environment} from '../../environments/environment';
import {BaseService} from './base.service';
import {SessionService} from './session.service';
import {Book} from '../models/book';
import {ChapContentPack} from '../models/chap';

@Injectable()
export class BookService extends BaseService<Book> {

  booksMap: Map<string, Book> = new Map<string, Book>();

  chapContentPacksMap: Map<string, ChapContentPack> = new Map<string, ChapContentPack>();

  constructor(protected http: HttpClient,
              protected sessionService: SessionService) {
    super(http, sessionService);
    let apiBase = environment.apiBase || '';
    this.baseUrl = `${apiBase}/books`;
  }

  listByCat(cat: string): Observable<Book[]> {
    let url = `${this.baseUrl}?cat=${cat}`;
    return super.list(url);
  }

  getDetail(bookId: string): Observable<Book> {
    let book = this.booksMap.get(bookId);
    if (book) {
      return of(book);
    }
    return super.getDetail(bookId)
      .pipe(tap(b => {
        this.booksMap.set(b._id, b);
        let chaps = b.chaps;
        if (chaps) {
          for (let chap of chaps) {
            let contentPack = chap.contentPack;
            if (contentPack && contentPack.srcFile) {
              contentPack.bookId = bookId;
              this.chapContentPacksMap.set(chap._id, contentPack);
            }
          }
        }
      }));
  }

}
