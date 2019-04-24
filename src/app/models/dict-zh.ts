import {Model} from './model';

export class DictZh extends Model {
  word: string;

  pinyins: string[] = [];
  complete: EntryZh[] = [];
  expSrc: string;
}

export class EntryZh {
  pinyin: number;
  head: string;
  items: MeaningItemZh[] = [];
}

export class MeaningItemZh {
  pos: string;
  exp: string;
}
