import {Model} from './model';

export class WordCategory extends Model {

  static DictOperators = [
    {value: '', label: '='},
    {value: 'gt', label: '>'},
    {value: 'lt', label: '<'},
    {value: 'ne', label: '<>'}
  ];

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
}

export class WordBook {
  code: string;
  version: number;
  words: string[];
}
