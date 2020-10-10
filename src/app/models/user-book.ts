import {Model} from './model';
import {Book} from './book';

export class UserBook extends Model {

  static Roles = ['', 'O', 'E'];
  static AcquireMethods = {Purchase: 'P', Bestow: 'B'};

  userId: string;
  bookId: string;
  role: string;
  isAllChaps: boolean;
  chaps: any[];
  chapsCount: number;
  acquireMethod: string;

  userName: string;
  userNickName: string;

  book: Book;
}
