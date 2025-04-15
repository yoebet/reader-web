import {Model} from './model';
import {Book} from './book';

export class UserBook extends Model {

  bookId: string;
  role: string;

  book: Book;
}
