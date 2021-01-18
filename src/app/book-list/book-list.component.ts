import {Component, ElementRef, ViewChild} from '@angular/core';
import {ActivatedRoute} from '@angular/router';

import {SuiModalService} from 'ng2-semantic-ui';

import {StaticResource} from '../config';
import {Book} from '../models/book';
import {BookService} from '../services/book.service';
import {BookInfoModal} from '../book/book-info.component';
import {AccountSupportComponent} from '../account/account-support.component';
import {WxAuthService} from '../services/wx-auth.service';
import {SessionService} from '../services/session.service';

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
  category: string;

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
  }

  // tslint:disable-next-line:use-life-cycle-interface
  ngOnInit(): void {
    super.ngOnInit();
    this.checkLoginAndLoad();
  }

  protected buildCurrentUri(): string {
    if (this.pathParams) {
      let cat = this.pathParams.get('cat');
      if (cat) {
        return `books/cat/${cat}`;
      }
    }
    return `books`;
  }

  protected loadContent() {
    if (this.pathParams) {
      this.category = this.pathParams.get('cat');
    }
    let obs;
    let service = this.bookService;
    if (this.category) {
      obs = service.listByCat(this.category);
    } else {
      obs = service.list();
    }
    obs.subscribe(books => {
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
