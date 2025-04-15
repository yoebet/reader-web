import {Model} from './model';
import {Chap} from './chap';
import {UserBook} from './user-book';

export class Book extends Model {

  static CategoryNames = {
    Nov: '小说',
    Tex: '教材',
    Kid: '儿童',
    His: '历史',
    Poe: '诗歌',
    Oth: '其他'
  };


  static Categories = ['Nov', 'Tex', 'Kid', 'His', 'Poe', 'Oth'].map(k => {
    return {value: k, label: Book.CategoryNames[k]};
  });

  static LangCodeEn = 'En';
  static LangCodeZh = 'Zh';
  static LangCodeZc = 'Zc';

  static LangTypes = [
    {value: Book.LangCodeEn, label: '英文'},
    {value: Book.LangCodeZh, label: '中文'},
    {value: Book.LangCodeZc, label: '文言文/诗词'}
  ];

  static StatusNames = {
    E: '编辑中',
    C: '校对中',
    R: '已上线',
    B: '备份'
  };

  static Statuses = ['E', 'C', 'R'].map(k => {
    return {value: k, label: Book.StatusNames[k]};
  });


  code: string;
  name: string;
  zhName = '';
  author = '';
  zhAuthor = '';

  label: string;

  contentLang = Book.LangCodeEn;
  transLang = Book.LangCodeZh;
  category: string;
  categoryName: string;
  description: string;

  status = 'E';
  isPrivate: boolean;

  chiefEditorId: string;
  chiefEditorName: string;

  chapsComplete: boolean;

  // isFree: boolean;
  // price: number; // cents
  // priceLabel: string;

  slogan: string;
  introduction: string;
  tags: string;

  annotationFamilyId: string;

  image: BookImage;

  chaps: Chap[];


  static isChineseText(lang) {
    return lang === Book.LangCodeZh || lang === Book.LangCodeZc;
  }

}

export class BookImage {
  file: string;
  type: string;
  size: number;
  uploadedAt: Date;
}

export class PrivilegedUsers {
  owner: UserBook;
  editors: UserBook[];
  readers: UserBook[];
}
