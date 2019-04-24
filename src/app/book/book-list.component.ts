import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';

import {SuiModalService} from 'ng2-semantic-ui';

import {BookImagesBase, BookImageNotSet} from '../config';
import {Book} from '../models/book';
import {BookService} from '../services/book.service';
import {BookInfoModal} from './book-info.component';

@Component({
  selector: 'book-list',
  templateUrl: './book-list.component.html',
  styleUrls: ['./book-list.component.css']
})
export class BookListComponent implements OnInit {
  @ViewChild('newBookCode') newBookCodeEl: ElementRef;
  @ViewChild('newBookName') newBookNameEl: ElementRef;
  books: Book[] = [];
  showZh = true;

  statusNames = Book.StatusNames;
  categoryNames = Book.CategoryNames;

  bookImagesBase = BookImagesBase;
  bookImageNotSet = BookImageNotSet;

  constructor(private bookService: BookService,
              private modalService: SuiModalService) {
  }

  ngOnInit(): void {
    this.bookService
      .list()
      .subscribe(books => this.books = books);
  }


  showDetail(book: Book) {
    this.modalService.open(new BookInfoModal(book));
  }


  bookTracker(index, book) {
    return book._id;
  }

}
