import {guestBaseForms, guestStem} from './word-forms';
import {UserWord} from '../models/user-word';

export class CombinedWordsMap {

  baseVocabularyMap: Map<string, string>;
  userWordsMap: Map<string, UserWord>;
  baseFormsMap: Map<string, string>;

  constructor(baseVocabularyMap: Map<string, string>,
              userWordsMap: Map<string, UserWord>,
              baseFormsMap: Map<string, string>) {
    this.baseVocabularyMap = baseVocabularyMap;
    this.userWordsMap = userWordsMap;
    this.baseFormsMap = baseFormsMap;
  }

  private _get(word: string): (string | UserWord) {
    let userWord = this.userWordsMap.get(word);
    if (userWord) {
      return userWord;
    }
    let categoryCode = this.baseVocabularyMap.get(word);
    if (categoryCode) {
      return categoryCode;
    }
    return null;
  }


  get(word: string): (string | UserWord) {

    let codeOrUW = this._get(word);

    if (codeOrUW) {
      return codeOrUW;
    }

    if (/[A-Z]/.test(word)) {
      word = word.toLowerCase();
      codeOrUW = this._get(word);
      if (codeOrUW) {
        return codeOrUW;
      }
    }

    if (this.baseFormsMap) {
      let base = this.baseFormsMap.get(word);
      if (base) {
        codeOrUW = this._get(base);
        if (codeOrUW) {
          // console.log('hit, ' + word + ' -> ' + base);
          return codeOrUW;
        }
      }
    }

    let forms = guestBaseForms(word);
    for (let form of forms) {
      codeOrUW = this._get(form);
      if (codeOrUW) {
        return codeOrUW;
      }
    }

    let stem = guestStem(word);
    codeOrUW = this._get(stem);

    return codeOrUW;
  }
}
