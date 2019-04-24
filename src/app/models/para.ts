import {Model} from './model';
import {Book} from './book';
import {Chap} from './chap';

export class Para extends Model {
  content: string = '';
  trans: string = '';
  chapId: string;
  bookId: string;
  originalId: string;

  book: Book;
  chap: Chap;
}
