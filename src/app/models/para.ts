import {Model} from './model';
import {Book} from './book';
import {Chap} from './chap';
import {ParaComment} from "./para-comment";

export class Para extends Model {
  content: string = '';
  trans: string = '';
  chapId: string;
  bookId: string;
  originalId: string;

  commentsCount?: number;
  comments?: ParaComment[];

  book: Book;
  chap: Chap;
}

export class ParaIdCount {
  paraId: string;
  count: number;
}
