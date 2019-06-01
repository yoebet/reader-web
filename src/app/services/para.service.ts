import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';

import {combineLatest as observableCombineLatest, Observable} from 'rxjs';
import {map, catchError} from 'rxjs/operators';

import {uniq} from 'lodash';

import {environment} from '../../environments/environment';
import {Chap} from '../models/chap';
import {Para} from '../models/para';
import {ParaComment} from '../models/para-comment';
import {ChapService} from './chap.service';
import {BookService} from './book.service';
import {BaseService} from './base.service';
import {SessionService} from './session.service';

@Injectable()
export class ParaService extends BaseService<Para> {

  constructor(protected http: HttpClient,
              protected sessionService: SessionService,
              private bookService: BookService,
              private chapService: ChapService) {
    super(http, sessionService);
    let apiBase = environment.apiBase || '';
    this.baseUrl = `${apiBase}/paras`;
  }

  loadPara(id: string): Observable<Para> {
    return Observable.create(observer => {
      this.getOne(id).subscribe((para: Para) => {
        if (!para) {
          observer.next(null);
          observer.complete();
          return;
        }
        let {bookId, chapId} = para;
        observableCombineLatest(
          this.bookService.getOne(bookId),
          this.chapService.getOne(chapId))
          .subscribe(([book, chap]) => {
            para.book = book;
            para.chap = chap as Chap;
            observer.next(para);
            observer.complete();
          });
      });
    });
  }

  textSearch(word: string, options: any = {}): Observable<Para[]> {
    let {limit} = options;
    if (!limit) {
      limit = 4;
    }
    let url = `${this.baseUrl}/search/${word}?limit=${limit}`;

    return Observable.create(observer => {
      this.list(url).subscribe(paras => {
        if (!paras || paras.length === 0) {
          observer.next([]);
          observer.complete();
        }
        let bookIds = uniq(paras.map(p => p.bookId).filter(bookId => bookId != null));
        let chapIds = uniq(paras.map(p => p.chapId).filter(chapId => chapId != null));
        let booksObs: Observable<any>[] = bookIds.map(bookId => this.bookService.getOne(bookId));
        let chapsObs: Observable<any>[] = chapIds.map(chapId => this.chapService.getOne(chapId));
        observableCombineLatest(booksObs.concat(chapsObs)).subscribe(bookOrChaps => {
          let bookOrChapMap = new Map();
          for (let boc of bookOrChaps) {
            bookOrChapMap.set(boc._id, boc);
          }
          for (let para of paras) {
            para.book = bookOrChapMap.get(para.bookId);
            para.chap = bookOrChapMap.get(para.chapId);
          }
          observer.next(paras);
          observer.complete();
        });
      });
    });
  }

  loadComments(para: Para): Observable<ParaComment[]> {
    let url = `${this.baseUrl}/${para._id}/comments`;
    return this.http.get<ParaComment[]>(url, this.getHttpOptions())
      .pipe(
        map((comments: ParaComment[]) => {
          para.comments = comments;
          return comments;
        }),
        catchError(this.handleError));
  }

}
