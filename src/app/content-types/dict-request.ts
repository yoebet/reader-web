import {DictEntry} from '../models/dict-entry';
import {DictZh} from '../models/dict-zh';

export class DictRequest {
  dictLang: string;// en/zh
  wordElement: Element;
  dictEntry: DictEntry | DictZh;
  initialSelected?: SelectedItem;
  relatedWords?: string[];
  context?: any;
  meaningItemCallback: (selected: SelectedItem) => void;
  userWordChangeCallback: (change: UserWordChange) => void;

  simplePopup = false;
}

export class SelectedItem {
  word?: string;
  pos?: string;
  meaning?: string;
}


export class UserWordChange {
  word: string;
  dictEntry: DictEntry;
  op: string; // add/inc/dec/remove
  familiarity: number; // null: removed
}
