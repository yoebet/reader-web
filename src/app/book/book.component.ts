import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, ParamMap, Router} from '@angular/router';
import {Location} from '@angular/common';

import {SuiModalService} from 'ng2-semantic-ui';
import {switchMap} from 'rxjs/operators';

import {Book} from '../models/book';
import {BookService} from '../services/book.service';
import {SessionService} from '../services/session.service';
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
              private bookService: BookService,
              private route: ActivatedRoute,
              private router: Router,
              private location: Location,
              public modalService: SuiModalService) {
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(switchMap((params: ParamMap) =>
      this.bookService.getDetail(params.get('id'))
    )).subscribe(book => {
      if (!book) {
        return;
      }
      this.book = book;
      if (!this.book.chaps) {
        this.book.chaps = [];
      }
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
