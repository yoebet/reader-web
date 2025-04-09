import {DataAttrNames, DataAttrValues, UIConstants} from '../config';
import {ZhPhrases} from './zh-phrases';
import {ElAnnos} from './el-annos';

export class AnnotatorHelper {

  static stripEnWord(word: string): string {
    if (word.indexOf('­') >= 0) {// 173, 0xAD, soft hyphen
      word = word.replace(/­/, '');
    }
    return word;
  }

  static trimSelected(text: string, charPattern: RegExp, wordStart: number, wordEnd: number) {
    let result = {trimLeft: false, trimRight: false, wordStart, wordEnd};
    let cp = charPattern;
    if (wordStart < wordEnd) {
      if (!cp.test(text.charAt(wordStart))) {
        wordStart++;
        while (wordStart < text.length) {
          let c = text.charAt(wordStart);
          if (!cp.test(c)) {
            wordStart++;
          } else {
            break;
          }
        }
        result.trimLeft = true;
      }
      if (!cp.test(text.charAt(wordEnd - 1))) {
        wordEnd--;
        while (wordEnd > 0) {
          let c = text.charAt(wordEnd - 1);
          if (!cp.test(c)) {
            wordEnd--;
          } else {
            break;
          }
        }
        result.trimRight = true;
      }
    }
    if (wordStart > wordEnd) {
      wordStart = wordEnd;
      result.trimLeft = true;
    }
    result.wordStart = wordStart;
    result.wordEnd = wordEnd;
    return result;
  }


  static extendWholeWord(text: string,
                         charPattern: RegExp,
                         wordStart: number,
                         wordEnd: number): number[] {
    let trimResult = this.trimSelected(text, charPattern, wordStart, wordEnd);
    if (trimResult.trimLeft) {
      wordStart = trimResult.wordStart;
    } else {
      while (wordStart > 0) {
        let c = text.charAt(wordStart - 1);
        if (charPattern.test(c)) {
          wordStart--;
        } else {
          break;
        }
      }
    }
    if (trimResult.trimRight) {
      wordEnd = trimResult.wordEnd;
    } else {
      while (wordEnd < text.length) {
        let c = text.charAt(wordEnd);
        if (charPattern.test(c)) {
          wordEnd++;
        } else {
          break;
        }
      }
    }
    return [wordStart, wordEnd];
  }


  static extendZhPhrases(text: string,
                         charPattern: RegExp,
                         wordStart: number,
                         wordEnd: number,
                         zhPhrases: ZhPhrases): number[] {

    let trimResult = AnnotatorHelper.trimSelected(text, charPattern, wordStart, wordEnd);
    if (trimResult.trimLeft) {
      wordStart = trimResult.wordStart;
    }
    if (trimResult.trimRight) {
      wordEnd = trimResult.wordEnd;
    }

    if (!zhPhrases) {
      return [wordStart, wordEnd];
    }

    let word = null;
    if (wordStart < wordEnd) {
      word = text.substring(wordStart, wordEnd);
      if (zhPhrases.checkIsPhrase(word)) {
        return [wordStart, wordEnd];
      }
    }

    if (!trimResult.trimRight) {
      let tryEnd = wordEnd + 1;
      while (tryEnd <= text.length && tryEnd - wordStart <= 4) {
        if (!charPattern.test(text.charAt(tryEnd))) {
          break;
        }
        if (tryEnd - wordStart < 2) {
          tryEnd++;
          continue;
        }
        word = text.substring(wordStart, tryEnd);
        if (zhPhrases.checkIsPhrase(word)) {
          return [wordStart, tryEnd];
        }
        tryEnd++;
      }
    }

    if (!trimResult.trimLeft) {
      let tryStart = wordStart - 1;
      while (tryStart > 0 && wordEnd - tryStart >= 2 && wordEnd - tryStart <= 4) {
        if (!charPattern.test(text.charAt(tryStart))) {
          break;
        }
        if (wordEnd - tryStart < 2) {
          tryStart--;
          continue;
        }
        word = text.substring(tryStart, wordEnd);
        if (zhPhrases.checkIsPhrase(word)) {
          return [tryStart, wordEnd];
        }
        tryStart--;
      }

    }

    if (!trimResult.trimLeft && !trimResult.trimRight) {
      if (wordEnd - wordStart < 2) {
        let pos = wordStart;
        for (let [s, e] of [
          [pos - 1, pos + 1], [pos - 1, pos + 2],
          [pos - 1, pos + 3], [pos - 2, pos + 2]
        ]) {
          if (s > 0 && e <= text.length) {
            word = text.substring(s, e);
            if (zhPhrases.checkIsPhrase(word)) {
              return [s, e];
            }
          }
        }
      }
    }

    if (wordEnd === wordStart) {
      if (wordEnd < text.length && charPattern.test(text.charAt(wordStart))) {
        return [wordStart, wordStart + 1];
      } else if (wordStart > 0 && charPattern.test(text.charAt(wordStart - 1))) {
        return [wordStart - 1, wordStart];
      }
    }

    return [wordStart, wordEnd];
  }

  static removeTagIfDummy(element) {
    if (element.tagName !== UIConstants.annotationTagName.toUpperCase()) {
      return false;
    }
    if (element.classList.length === 0) {
      element.removeAttribute('class');
    }
    if (!element.hasAttributes()) {
      // remove tag
      let pp = element.parentNode;
      while (element.firstChild) {
        pp.insertBefore(element.firstChild, element);
      }
      pp.removeChild(element);
      pp.normalize();
    }
  }

  static removeDropTagIfDummy(el) {
    let result = {changed: false, removed: false};
    if (el.tagName !== UIConstants.annotationTagName.toUpperCase() && el.tagName !== 'SPAN') {
      return result;
    }
    if (el.className === '') {
      el.removeAttribute('class');
      result.changed = true;
    } else if (el.attributes.length === 1 && el.hasAttributes('class')) {
      let cns = el.className.split(' ')
        .filter(n => !n.startsWith(UIConstants.dropClassPrefix)
          && !n.startsWith(UIConstants.tetherClassPrefix)
          && n !== UIConstants.highlightClass);
      if (cns.length === 0) {
        el.removeAttribute('class');
        result.changed = true;
      }
    }
    if (!el.hasAttributes()) {
      // remove tag
      let pp = el.parentNode;
      if (!pp) {
        return result;
      }
      while (el.firstChild) {
        pp.insertBefore(el.firstChild, el);
      }
      pp.removeChild(el);
      pp.normalize();
      result.changed = true;
      result.removed = true;
    }
    return result;
  }

  static findSentence(node, textEl): any {
    let sentenceSelector = UIConstants.sentenceTagName;
    do {
      if (node instanceof Element) {
        let el = node as Element;
        if (el === textEl) {
          return null;
        }
        if (el.matches(sentenceSelector)) {
          return el;
        }
      }
      node = node.parentNode;
    } while (node);
    return null;
  }

  static currentPhrase(wordEl, textEl) {
    let stEl = this.findSentence(wordEl, textEl);
    if (!stEl) {
      stEl = textEl;
    }
    let ds = wordEl.dataset;
    let group = ds[DataAttrNames.assoc];
    if (!group) {
      return null;
    }
    if (!DataAttrValues.phraPattern.test(group)) {
      return null;
    }
    let groupSelector = `[data-${DataAttrNames.assoc}=${group}]`;
    let groupEls = stEl.querySelectorAll(groupSelector);
    let els = Array.from(groupEls);
    return els.map((el: Element) => el.textContent).join(' ');
  }


  static checkIsContainer(element: Element, container): boolean {
    if (!container) {
      return false;
    }
    if (typeof container === 'string') {
      if (element.matches(container as string)) {
        return true;
      }
    } else if (container === element) {
      return true;
    }
    return false;
  }

  static lookupElement(element, selector, container) {
    if (!selector) {
      return null;
    }
    while (element) {
      if (element.nodeType !== Node.ELEMENT_NODE) {
        return null;
      }
      if (this.checkIsContainer(element, container)) {
        return null;
      }
      if (element.matches(selector)) {
        return element;
      }
      element = element.parentNode;
    }
    return null;
  }

  static checkSelectionContainer(selection: Selection, ...containers) {
    let node1 = selection.anchorNode;
    let node2 = selection.focusNode;

    if (!node1 || !node2) {
      return null;
    }

    let offset1 = selection.anchorOffset;
    let offset2 = selection.focusOffset;

    if (node1 === node2 && offset1 === offset2) {
      return null;
    }

    if (node1.nodeType !== Node.TEXT_NODE
      || node2.nodeType !== Node.TEXT_NODE) {
      return null;
    }

    if (node1.parentNode !== node2.parentNode) {
      return null;
    }

    for (let container of containers) {
      if (this.inContainer(node1, node2, container)) {
        return container;
      }
    }

    return null;
  }

  static inContainer(node1, node2, container): boolean {

    if (!container) {
      return true;
    }

    if (typeof container === 'string') {
      let lookupContainer = (node) => {
        do {
          if (node instanceof Element) {
            let el = node as Element;
            if (el.matches(container as string)) {
              return el;
            }
          }
          node = node.parentNode;
        } while (node);
        return null;
      };

      let container1 = lookupContainer(node1);
      if (!container1) {
        return false;
      }
      if (node1 !== node2) {
        let container2 = lookupContainer(node2);
        if (!container2) {
          return false;
        }
        if (container1 !== container2) {
          return false;
        }
      }
      return true;
    }

    if (container instanceof Element) {
      let ct = container as Element;
      if (!ct.contains(node1)) {
        return false;
      }
      if (node1 !== node2 && !ct.contains(node2)) {
        return false;
      }
    }

    return true;
  }

  static parseAnnotations(wordEl, annotationSet, paraTextEl): ElAnnos {
    let annos = new ElAnnos();
    if (!wordEl) {
      return annos;
    }
    annos.word = wordEl.textContent;

    let phraseWords = null;

    let dataset = wordEl.dataset;
    for (let name in dataset) {
      if (!dataset.hasOwnProperty(name)) {
        continue;
      }
      let value = dataset[name];
      if (name === DataAttrNames.mean && !dataset[DataAttrNames.forPhraseGroup]) {
        let mean = value;
        let forWord = wordEl.dataset[DataAttrNames.word];
        if (!forWord) {
          forWord = annos.word;
        }
        let pos = wordEl.dataset[DataAttrNames.pos] || '';
        let text0 = mean;
        if (pos) {
          text0 = `${pos} ${mean}`;
        }
        annos.meaning = {pos, mean, word: forWord, text: text0};
        continue;
      }

      if (name === DataAttrNames.assoc) {

        let group = value;

        let stEl = AnnotatorHelper.findSentence(wordEl, paraTextEl);
        if (!stEl) {
          stEl = paraTextEl;
        }
        let groupSelector = `[data-${DataAttrNames.assoc}=${group}]`;
        let groupEls = stEl.querySelectorAll(groupSelector);
        let els = Array.from(groupEls);
        let words = els.map((el: Element) => el.textContent).join(' ');
        if (words.indexOf(' ') === -1) {
          continue;
        }

        phraseWords = words;

        if (DataAttrValues.phraPattern.test(group)) {

          let mean = null;
          let phraseWord = words;

          for (let el0 of els) {
            let el = el0 as HTMLElement;
            let ds = el.dataset;
            mean = ds[DataAttrNames.mean];
            if (!mean) {
              continue;
            }
            let phraseGroup = ds[DataAttrNames.forPhraseGroup];
            let forWord = ds[DataAttrNames.word];
            if (forWord !== words && phraseGroup !== group) {
              continue;
            }
            if (forWord) {
              phraseWord = forWord;
            }
            break;
          }

          if (mean) {
            annos.phraseMeaning = {pos: '', mean, word: phraseWord, text: mean};
          }
          continue;
        }

      }

      if (name === DataAttrNames.note) {
        annos.note = value;
        continue;
      }
      let text = annotationSet.annotationOutput(name, value);
      if (!text) {
        continue;
      }
      let item = {dataName: name, dataValue: value, text};
      annos.items.push(item);
    }

    if (phraseWords && !annos.note && !annos.meaning && !annos.phraseMeaning && annos.items.length === 0) {
      annos.word = phraseWords;
    }

    return annos;
  }

  static anyAnno(wordEl, annotationSet): boolean {
    if (!wordEl) {
      return false;
    }
    let dataset = wordEl.dataset;
    for (let name in dataset) {
      if (!dataset.hasOwnProperty(name)) {
        continue;
      }
      let value = dataset[name];
      if (name === DataAttrNames.mean) {
        return true;
      }
      if (name === DataAttrNames.note) {
        return true;
      }
      let text = annotationSet.annotationOutput(name, value);
      if (text) {
        return true;
      }
    }

    return false;
  }

}
