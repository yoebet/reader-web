import {Model} from './model';
import {Book} from './book';
import {Para} from './para';

export class Chap extends Model {
  name: string;
  zhName: string = '';
  bookId: string;
  no: number;

  status: string;

  isFree: boolean;
  price: number; // cents
  priceLabel: string;

  paras: Para[];

  book: Book;

  paraCommentsCountLoaded = false;
}
