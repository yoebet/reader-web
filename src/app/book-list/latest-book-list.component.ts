import {Component} from '@angular/core';
import {ActivatedRoute} from '@angular/router';

import {SuiModalService} from 'ng2-semantic-ui';

import {BookService} from '../services/book.service';
import {WxAuthService} from '../services/wx-auth.service';
import {SessionService} from '../services/session.service';
import {BookListComponent} from './book-list.component';

@Component({
  selector: 'latest-book-list',
  templateUrl: './book-list.component.html',
  styleUrls: ['./book-list.component.css']
})
export class LatestBookListComponent extends BookListComponent {

  constructor(protected sessionService: SessionService,
              protected wxAuthService: WxAuthService,
              protected bookService: BookService,
              protected modalService: SuiModalService,
              protected route: ActivatedRoute) {
    super(sessionService, wxAuthService, bookService, modalService, route);
  }


  protected buildCurrentUri(): string {
    return `books/latest`;
  }

  protected loadContent() {
    this.bookService.latestBooks().subscribe(books => {
      this.books = books;
      this.contentLoaded = true;
    });
  }

}
