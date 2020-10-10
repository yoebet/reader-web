import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';

import {Observable, of} from 'rxjs';
import {map, catchError} from 'rxjs/operators';

import {environment} from '../../environments/environment';
import {StaticResource} from '../config';
import {Chap, ChapContentPack} from '../models/chap';
import {ParaIdCount} from '../models/para';
import {BaseService} from './base.service';
import {SessionService} from './session.service';
import {BookService} from './book.service';

const ChapPacksBase = StaticResource.ChapPacksBase;

@Injectable()
export class ChapService extends BaseService<Chap> {

  constructor(protected http: HttpClient,
              protected bookService: BookService,
              protected sessionService: SessionService) {
    super(http, sessionService);
    let apiBase = environment.apiBase || '';
    this.baseUrl = `${apiBase}/chaps`;
  }


  getDetail(id: string): Observable<Chap> {
    let pack: ChapContentPack = this.bookService.chapContentPacksMap.get(id);
    if (pack) {
      const url = `${ChapPacksBase}/${pack.bookId}/${pack.srcFile}`;
      return this.http.get<Chap>(url, this.getHttpOptions())
        .pipe(catchError(e => super.getDetail(id)));
    }
    return super.getDetail(id);
  }

  loadCommentsCount(chap: Chap): Observable<number> {
    if (!chap || !chap.paras || chap.paras.length === 0) {
      return of(0);
    }

    let url = `${this.baseUrl}/${chap._id}/paraCommentsCount`;
    return this.http.get<ParaIdCount[]>(url, this.getHttpOptions())
      .pipe(
        catchError(this.handleErrorGET),
        map((idCounts: ParaIdCount[]) => {
          let parasMap = new Map();
          for (let p of chap.paras) {
            p.commentsCount = 0;
            parasMap.set(p._id, p);
          }

          let total = 0;
          for (let {paraId, count} of idCounts) {
            total += count;
            let para = parasMap.get(paraId);
            if (para) {
              para.commentsCount = count;
            }
          }
          chap.paraCommentsCountLoaded = true;
          return total;
        }));
  }

}
