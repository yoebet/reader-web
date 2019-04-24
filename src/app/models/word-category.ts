import {Model} from './model';

export class WordCategory extends Model {
  code: string;
  name: string;
  dictKey: string;
  dictOperator: string;
  dictValue: number;
  description: string;
  wordCount: number;
  extendTo: string;
  extendedWordCount: number;

  extend: WordCategory;

  static DictOperators = [
    {value: '', label: '='},
    {value: 'gt', label: '>'},
    {value: 'lt', label: '<'},
    {value: 'ne', label: '<>'}
  ];
}

export class WordBook {
  code: string;
  version: number;
  words: string[];
}
