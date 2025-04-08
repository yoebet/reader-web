import {Model} from './model';

export class DictEntry extends Model {

  word: string;

  simple: SimpleMeaning[];
  // simple: [
  //   { pos: 'n.', exp: '' },
  //   { pos: 'v.', exp: '' }
  // ]
  // complete: [
  //   {
  //     pos: 'n.',
  //     items: [
  //       { id: 1, exp: '' },
  //       { id: 2, exp: '' }
  //       ]
  //   },
  //   {
  //     pos: 'v.',
  //     items: [
  //       { id: 3, exp: '' },
  //       { id: 4, exp: '' }
  //       ]
  //   }
  //   ]
  complete?: PosMeanings[] = [];
  categories: {
    [cat: string]: number;
  } = {};
  phonetics?: any;
  forms?: any;
  baseForm?: string;
  phrases?: string[];


  static isId(idOrWord): boolean {
    return /^[0-9a-z]{24}$/.test(idOrWord);
  }

  static EvaluateCategoryTags(categories: DictEntry['categories']): string[] {
    let tags = [];
    if (!categories) {
      return tags;
    }
    if (categories.junior) {
      tags.push('基础');
    } else {
      if (categories.cet) {
        if (categories.cet === 4) {
          tags.push('CET 4');
        } else if (categories.cet === 6) {
          tags.push('CET 6');
        }
      } else {
        let wCategories = [
          ['gre', 'GRE'],
          ['yasi', '雅思'],
          ['pro', '英专']
        ];
        for (let [key, name] of wCategories) {
          if (categories[key]) {
            tags.push(name);
          }
        }
      }
      /*if (categories.haici) {
        tags.push(`海词 ${categories.haici}星`);
      }*/
      let wordFreqs = ['coca', 'bnc', 'anc'];
      for (let freqName of wordFreqs) {
        let rank = categories[freqName];
        if (rank) {
          let mod = rank % 3;
          let align3 = mod === 0 ? rank : rank + (3 - mod);
          tags.push(`${freqName.toUpperCase()} ${align3}000`);
        }
      }
    }

    return tags;
  }

}

export class SimpleMeaning {
  pos: string;
  exp: string;
}

export class PosMeanings {
  // Part Of Speech
  pos: string;
  items: MeaningItem[] = [];
}

export class MeaningItem {
  id: number;
  tags: string[];
  exp: string;
}

export const DictFields = {
  WORD_ONLY: 'word',
  SIMPLE: 'simple',
  COMPLETE: 'complete'
};

export const PosTags = {
  common: [
    {value: 'idiom', label: '习语'},
    {value: 'colloquial', label: '口语'},
    {value: 'figurative', label: '比喻'},
    {value: 'slang', label: '俚语'},
    {value: 'euphemism', label: '委婉'}
  ],
  'n.': [
    {value: 'individual', label: '个体'},
    {value: 'collective', label: '集体'},
    {value: 'material', label: '物质'},
    {value: 'abstract', label: '抽象'},
    {value: 'countable', label: '可数'},
    {value: 'uncountable', label: '不可数'},
    {value: 'singular', label: '单数'},
    {value: 'plural', label: '复数'},
    {value: 'gerund', label: '动名词'},
    {value: 'proper', label: '专有'}
  ],
  'v.': [
    {value: 'transitive', label: 'vt.'},
    {value: 'intransitive', label: 'vi.'},
    {value: 'ergative', label: 'vi.&vt.'},
    {value: 'link', label: '系动词'},
    {value: 'modal', label: '情态'},
    {value: 'ditransitive', label: '双宾'},
    {value: 'irregular', label: '不规则'},
    {value: 'instantaneous', label: '短暂'}
  ]
};

export const TagLabelMap = {};

for (let pos in PosTags) {
  if (!PosTags.hasOwnProperty(pos)) {
    continue;
  }
  let tags = PosTags[pos];
  if (tags) {
    for (let tag of tags) {
      TagLabelMap[tag.value] = tag.label;
    }
  }
}
