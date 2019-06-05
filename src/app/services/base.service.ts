import {HttpClient} from '@angular/common/http';

import {Observable, EMPTY, throwError} from 'rxjs';
import {catchError} from 'rxjs/operators';

import {Model} from '../models/model';
import {OpResult} from '../models/op-result';
import {SessionService} from './session.service';

export class BaseService<M extends Model> {

  protected baseUrl: string;

  protected handleError = (err) => this._handleError(err, false);
  protected handleErrorGET = (err) => this._handleError(err, true);


  constructor(protected http: HttpClient,
              protected sessionService: SessionService) {
  }

  protected getHttpOptions() {
    return this.sessionService.getHttpOptions();
  }

  list(url: string = null): Observable<M[]> {
    return this.http.get<M[]>(url || this.baseUrl, this.getHttpOptions())
      .pipe(catchError(this.handleErrorGET));
  }

  getOne(id: string): Observable<M> {
    const url = `${this.baseUrl}/${id}`;
    return this.http.get<M>(url, this.getHttpOptions())
      .pipe(catchError(this.handleErrorGET));
  }

  getOneByUrl(url: string): Observable<M> {
    return this.http.get<M>(url, this.getHttpOptions())
      .pipe(catchError(this.handleErrorGET));
  }

  getDetail(id: string): Observable<M> {
    const url = `${this.baseUrl}/${id}/detail`;
    return this.getOneByUrl(url);
  }

  create(model: M): Observable<M> {
    return this.http.post<M>(this.baseUrl, model, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  remove(model: M | string): Observable<OpResult> {
    const id = this.modelId(model);
    const url = `${this.baseUrl}/${id}`;
    return this.http.delete<OpResult>(url, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  update(model: M): Observable<OpResult> {
    const id = this.modelId(model);
    const url = `${this.baseUrl}/${id}`;
    return this.http.put<OpResult>(url, model, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  protected postForOpResult(url, body = null): Observable<OpResult> {
    return this.http.post<OpResult>(url, body, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  protected modelId(model: M | string): string {
    return typeof model === 'string' ? model : model._id;
  }

  protected handleError400(error: any) {
    let message = this.extractErrorMessage(error);
    if (message) {
      alert(message);
    } else {
      alert('输入错误');
    }
    return EMPTY;
  }

  protected handleError461(error: any): Observable<any> {
    let message = this.extractErrorMessage(error);
    if (message) {
      alert(message);
    } else {
      alert('没有权限');
    }
    return EMPTY;
  }

  protected handleError500(error: any): Observable<any> {
    alert('服务器内部错误');
    return EMPTY;
  }

  protected extractErrorMessage(error: any): string {
    let errorString = error.error;
    if (typeof errorString !== 'string') {
      return null;
    }
    try {
      let eo = JSON.parse(errorString);
      if (eo && typeof eo.message === 'string') {
        return eo.message;
      }
    } catch (e) {
      console.error('>> ' + errorString);
    }
    return null;
  }

  private _handleError(error: any, getMethod: boolean): Observable<any> {
    /*
    error : {
      error: `{"ok":0,"message":"code is Required"}`
      name: "HttpErrorResponse"
      ok: false
      status: 400/401/500/0
      statusText: "Unauthorized"/"Unknown Error"
      url: '...'/null
    }
    */
    if (getMethod) {
      return EMPTY;
    }
    switch (error.status) {
      case 400:
        return this.handleError400(error);
      case 401:
        return this.sessionService.handleError401(error);
      case 461:
        return this.handleError461(error);
      case 500:
        return this.handleError500(error);
      case 0:
      default:
        // alert('发生错误了，请检查网络连接');
        console.error(error);
    }

    // console.error(error);
    return throwError(error);
  }

}
