import {Component, Input, OnInit} from '@angular/core';

import {ComponentModalConfig, SuiModal} from 'ng2-semantic-ui';
import {ModalSize} from 'ng2-semantic-ui/dist/modules/modal/classes/modal-config';

import {Book} from '../models/book';
import {BookService} from '../services/book.service';

@Component({
  selector: 'book-info',
  templateUrl: './book-info.component.html',
  styleUrls: ['./book-info.component.css']
})
export class BookInfoComponent implements OnInit {
  @Input() book: Book;
  // langOptions = Book.LangTypes;
  statusNames = Book.StatusNames;
  categoryNames = Book.CategoryNames;

  constructor(private bookService: BookService,
              private modal: SuiModal<Book, string, string>) {
    this.book = modal.context;
  }

  ngOnInit(): void {
  }

  close() {
    this.modal.approve('');
  }

}


export class BookInfoModal extends ComponentModalConfig<Book> {
  constructor(book: Book) {
    super(BookInfoComponent, book, false);
    this.size = ModalSize.Tiny;
    this.isClosable = true;
    this.mustScroll = false;
    // this.isBasic = true;
  }
}
