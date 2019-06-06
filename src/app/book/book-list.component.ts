import {Component, ElementRef, ViewChild} from '@angular/core';

import {SuiModalService} from 'ng2-semantic-ui';

import {StaticResource} from '../config';
import {Book} from '../models/book';
import {BookService} from '../services/book.service';
import {BookInfoModal} from './book-info.component';
import {AccountSupportComponent} from '../account/account-support.component';
import {WxAuthService} from '../services/wx-auth.service';
import {SessionService} from '../services/session.service';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'book-list',
  templateUrl: './book-list.component.html',
  styleUrls: ['./book-list.component.css']
})
export class BookListComponent extends AccountSupportComponent {
  @ViewChild('newBookCode') newBookCodeEl: ElementRef;
  @ViewChild('newBookName') newBookNameEl: ElementRef;
  books: Book[] = [];
  showZh = true;

  // statusNames = Book.StatusNames;
  // categoryNames = Book.CategoryNames;

  bookImagesBase = StaticResource.BookImagesBase;
  bookImageNotSet = StaticResource.BookImageNotSet;

  constructor(protected sessionService: SessionService,
              protected wxAuthService: WxAuthService,
              protected bookService: BookService,
              protected modalService: SuiModalService,
              protected route: ActivatedRoute) {
    super(sessionService, wxAuthService, modalService, route);
    this.requireLogin = false;
  }

  ngOnInit(): void {
    super.ngOnInit();
    this.checkLoginAndLoad();
  }

  protected buildCurrentUri(): string {
    return `books`;
  }

  protected loadContent() {
    this.bookService.list()
      .subscribe(books => {
        this.books = books;
        this.contentLoaded = true;
      });
  }

  showDetail(book: Book) {
    this.modalService.open(new BookInfoModal(book));
  }


  bookTracker(index, book) {
    return book._id;
  }

}
