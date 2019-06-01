import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';

import {Observable, of} from 'rxjs';
import {map, catchError} from 'rxjs/operators';

import {Chap} from '../models/chap';
import {ParaIdCount} from '../models/para';
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

  loadCommentsCount(chap: Chap): Observable<number> {
    if (!chap || !chap.paras || chap.paras.length === 0) {
      return of(0);
    }

    let url = `${this.baseUrl}/${chap._id}/paraCommentsCount`;
    return this.http.get<ParaIdCount[]>(url, this.getHttpOptions())
      .pipe(
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
        }),
        catchError(this.handleError));
  }

}
