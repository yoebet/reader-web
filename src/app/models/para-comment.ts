import {Model} from './model';

export class ParaComment extends Model {
  paraId: string;
  sentenceId: string;
  chapId: string;
  bookId: string;
  title: string;
  content: string;

  userId: string;
  userName: string;
  userNickName: string;

  status: string;
}
