import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, ParamMap, Router} from '@angular/router';
import {Location} from '@angular/common';

import {SuiModalService} from 'ng2-semantic-ui';

import {Observable} from 'rxjs/index';
import {map} from 'rxjs/operators';

import {Book} from '../models/book';
import {BookService} from '../services/book.service';
import {SessionService} from '../services/session.service';
import {WxAuthService} from '../services/wx-auth.service';
import {AnnotationsService} from '../services/annotations.service';
import {BookInfoModal} from './book-info.component';

@Component({
  selector: 'book-detail',
  templateUrl: './book.component.html',
  styleUrls: ['./book.component.css']
})
export class BookComponent implements OnInit {
  book: Book;
  showZh = true;

  statusNames = Book.StatusNames;
  categoryNames = Book.CategoryNames;

  constructor(private sessionService: SessionService,
              private wxAuthService: WxAuthService,
              private bookService: BookService,
              private annoService: AnnotationsService,
              private route: ActivatedRoute,
              private router: Router,
              private location: Location,
              public modalService: SuiModalService) {
  }

  private fetchTheBookId(): Observable<string> {
    return this.route.paramMap.pipe(
      map((params: ParamMap) => {
          return params.get('id');
        }
      ));
  }

  ngOnInit(): void {
    this.fetchTheBookId()
      .subscribe(bookId => {

        this.route.queryParamMap.subscribe(params => {
          console.log(params);
          // let state = params.get('state');
          let code = params.get('code');
          if (code) {
            window.history.pushState({}, '', `books/${bookId}`);
            // this.wxAuthService.requestAccessToken(code)
            this.wxAuthService.requestAccessTokenAndLogin(code)
              .subscribe(result => {
                console.log(result);
                if (result.ok === 0) {
                  // alert(result.message || '微信登录失败');
                  return;
                }
              });
          }
        });
        this.loadBook(bookId);
      });
  }

  private loadBook(bookId) {
    this.bookService.getDetail(bookId).subscribe(book => {
      if (!book) {
        return;
      }
      this.book = book;
      if (!this.book.chaps) {
        this.book.chaps = [];
      }
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

  goBack(): void {
    this.location.back();
  }

  chapTracker(index, chap) {
    return chap._id;
  }
}
