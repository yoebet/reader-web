import {Model} from './model';

export class User extends Model {
  name: string;
  nickName: string;
  pass: string;
  role: string;
  status: string;

  static Roles = ['', 'A', 'E'];
}

export class UserIdName {
  _id: string;
  name: string;
  nickName: string;
}
