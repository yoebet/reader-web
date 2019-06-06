import {Component} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Location} from '@angular/common';

import {SuiModalService} from 'ng2-semantic-ui';

import {StaticResource} from '../config';
import {Book} from '../models/book';
import {BookService} from '../services/book.service';
import {SessionService} from '../services/session.service';
import {WxAuthService} from '../services/wx-auth.service';
import {AnnotationsService} from '../services/annotations.service';
import {BookInfoModal} from './book-info.component';
import {AccountSupportComponent} from '../account/account-support.component';


@Component({
  selector: 'book-detail',
  templateUrl: './book.component.html',
  styleUrls: ['./book.component.css']
})
export class BookComponent extends AccountSupportComponent {
  book: Book;
  showZh = true;

  statusNames = Book.StatusNames;
  categoryNames = Book.CategoryNames;

  bookImagesBase = StaticResource.BookImagesBase;
  bookImageNotSet = StaticResource.BookImageNotSet;

  constructor(protected sessionService: SessionService,
              protected wxAuthService: WxAuthService,
              protected bookService: BookService,
              protected annoService: AnnotationsService,
              protected route: ActivatedRoute,
              protected router: Router,
              protected location: Location,
              public modalService: SuiModalService) {
    super(sessionService, wxAuthService, modalService, route);
  }


  ngOnInit(): void {
    super.ngOnInit();
    this.checkLoginAndLoad();
  }

  protected buildCurrentUri(): string {
    let bookId;
    if (this.pathParams) {
      bookId = this.pathParams.get('id');
    }
    if (!bookId && this.book) {
      bookId = this.book._id;
    }
    return `books/${bookId}`;
  }

  protected loadContent() {
    let bookId = this.pathParams.get('id');
    this.bookService.getDetail(bookId)
      .subscribe(book => {
        if (!book) {
          return;
        }
        this.book = book;
        if (!this.book.chaps) {
          this.book.chaps = [];
        }
        this.contentLoaded = true;

        let afId = this.book.annotationFamilyId;
        if (!afId) {
          return;
        }
        this.annoService.getAnnotationSet(afId)
          .subscribe();
      });
  }


  showDetail() {
    this.modalService.open(new BookInfoModal(this.book));
  }


  /*
  const WX_CONFIG = {
  appid: '',
  oauth2_base: 'https://open.weixin.qq.com/connect/oauth2'
};

  tryWxLogin() {
    let redirect_uri = '';
    let scope = 'snsapi_base';// snsapi_base, snsapi_userinfo
    let url = `${WX_CONFIG.oauth2_base}/authorize?appid=${WX_CONFIG.appid}&redirect_uri=${redirect_uri}&response_type=code&scope=${scope}&state=12#wechat_redirect`;
  }*/

  goBack(): void {
    this.location.back();
  }

  chapTracker(index, chap) {
    return chap._id;
  }
}
