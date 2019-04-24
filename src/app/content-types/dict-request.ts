import {DictEntry} from '../models/dict-entry';
import {DictZh} from '../models/dict-zh';

export class DictRequest {
  dictLang: string;// en/zh
  wordElement: Element;
  dictEntry: DictEntry | DictZh;
  initialSelected?: SelectedItem;
  relatedWords?: string[];
  context?: any;
  meaningItemCallback: (selected: DictSelectedResult) => void;
}

export class SelectedItem {
  pos?: string;
  meaning?: string;
}

export class DictSelectedResult extends SelectedItem {
  word?: string;
}
