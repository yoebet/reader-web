import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';

import {Observable, of} from 'rxjs';
import {map} from 'rxjs/operators';

import {environment} from '../../environments/environment';
import {AnnotationFamily} from '../models/annotation-family';
import {AnnotationSet} from '../anno/annotation-set';

import {BaseService} from './base.service';
import {SessionService} from './session.service';

@Injectable()
export class AnnotationsService extends BaseService<AnnotationFamily> {

  annotationsMap: Map<string, AnnotationSet> = new Map<string, AnnotationSet>();

  constructor(protected http: HttpClient,
              protected sessionService: SessionService) {
    super(http, sessionService);
    let apiBase = environment.apiBase || '';
    this.baseUrl = `${apiBase}/anno_families`;
  }

  getAnnotationSet(familyId: string): Observable<AnnotationSet> {
    let anns = this.annotationsMap.get(familyId);
    if (anns) {
      return of(anns);
    }

    return this.getDetail(familyId).pipe(
      map((family: AnnotationFamily) => {
        if (!family) {
          return null;
        }
        let groups = family.groups;
        let anns2 = new AnnotationSet(groups);
        this.annotationsMap.set(familyId, anns2);
        return anns2;
      })
    );
  }

}
