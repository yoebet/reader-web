import {Model} from './model';

export class User extends Model {
  name: string;
  nickName: string;
  role: string;
  status: string;

  accessToken?: string;
  avatarSetting?: any; // {type: 'img/char', imgUrl: 'xxx', ...}

  // static Roles = ['', 'A', 'E'];
}

export class UserIdName {
  // tslint:disable-next-line:variable-name
  _id: string;
  name: string;
  nickName: string;
}
