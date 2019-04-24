import {UIConstants} from '../config';
import {Annotation} from '../models/annotation';
import {Book} from '../models/book';
import {AnnotateResult} from './annotate-result';
import {AnnotatorHelper} from './annotator-helper';
import {ZhPhrases} from './zh-phrases';


export class Annotator {
  // element or selector,
  container: Element | string = null;
  lang: string;
  zhPhrases: ZhPhrases;

  wordAtCursorIfNoSelection = true;
  isExtendWholeWord = true;
  charPattern = /[-a-zA-Z­']/; // ­ soft hyphen

  current: Annotation;

  constructor(container, lang) {
    this.container = container;
    this.lang = lang;
    if (Book.isChineseText(this.lang)) {
      this.charPattern = /[\u4E00-\u9FA5]/;
    }
  }

  switchAnnotation(annotation: Annotation): Annotator {
    this.current = annotation;
    return this;
  }

  private createWrappingTag() {
    let ann = this.current;
    let wrapping;
    if (ann.tagName) {
      wrapping = document.createElement(ann.tagName);
    } else {
      wrapping = document.createElement(UIConstants.annotationTagName);
      if (ann.cssClass) {
        wrapping.className = ann.cssClass;
      }
    }
    this.setDataAttribute(wrapping);
    return wrapping;
  }

  private setDataAttribute(element) {
    let ann = this.current;
    if (ann.dataName && ann.dataValue) {
      element.dataset[ann.dataName] = ann.dataValue;
    }
  }

  private annotationSelector() {
    let ann = this.current;
    let selector = '';
    if (ann.cssClass) {
      selector = '.' + ann.cssClass;
    }
    let dataAttr = null;
    if (ann.dataName) {
      if (ann.dataValue) {
        dataAttr = `[data-${ann.dataName}=${ann.dataValue}]`;
      } else {
        dataAttr = `[data-${ann.dataName}]`;
      }
      selector += dataAttr;
    }
    if (ann.tagName) {
      let tagSelector = ann.tagName.toLowerCase();
      if (dataAttr) {
        tagSelector += dataAttr;
      }
      selector = `${tagSelector}, ${selector}`;
    }
    return selector;
  }

  private resetAnnotation(element, type, match?) {
    //type: add, remove, toggle
    if (element.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    let ann = this.current;
    if (typeof match === 'undefined') {
      match = element.matches(this.annotationSelector());
    }
    if (match) {
      if (type === 'add') {
        this.setDataAttribute(element);
        if (element.tagName !== ann.tagName && ann.cssClass) {
          element.classList.add(ann.cssClass);
        }
        return;
      }
      // remove,toggle
      if (ann.dataName) {
        delete element.dataset[ann.dataName];
      }
      let cc = ann.cssClass || ann.group.cssClass;
      if (cc) {
        element.classList.remove(cc);
      }
      if (element.tagName === ann.tagName && element.hasAttributes()) {
        let wrapping = document.createElement(UIConstants.annotationTagName);
        wrapping.className = element.className;

        //for (let item of element.childNodes)
        while (element.firstChild) {
          wrapping.appendChild(element.firstChild);
        }
        let pp = element.parentNode;
        pp.replaceChild(wrapping, element);
        return;
      }
      AnnotatorHelper.removeTagIfDummy(element);
    } else {
      if (type === 'add' || type === 'toggle') {
        this.setDataAttribute(element);
        if (element.tagName !== ann.tagName && ann.cssClass) {
          element.classList.add(ann.cssClass);
        }
        return;
      }
      // remove
      if (ann.dataName) {
        delete element.dataset[ann.dataName];
      }
      let cc = ann.cssClass || ann.group.cssClass;
      if (cc) {
        element.classList.remove(cc);
      }
      AnnotatorHelper.removeTagIfDummy(element);
    }
  }

  private removeInnerAnnotations(element) {
    let selector = this.annotationSelector();
    let annotated = element.querySelectorAll(selector);
    annotated.forEach(ae => {
      this.resetAnnotation(ae, 'remove', true);
    });
  }

  private lookupAndProcess(element) {
    let selector = this.annotationSelector();
    let annotatedNode = AnnotatorHelper.lookupElement(element, selector, this.container);
    if (!annotatedNode) {
      return null;
    }
    let ar = new AnnotateResult();
    ar.wordEl = annotatedNode;
    let ann = this.current;
    let editAttrOutside = ann.dataName && typeof ann.dataValue === 'undefined';
    if (editAttrOutside) {
      return ar;
    } else {
      this.resetAnnotation(annotatedNode, 'remove', true);
      ar.operation = 'remove';
      return ar;
    }
  }


  private doInOneTextNode(textNode: Text, offset1, offset2): AnnotateResult {

    let nodeText = textNode.textContent;
    if (offset1 > offset2) {
      [offset1, offset2] = [offset2, offset1];
    }

    let ar0 = this.lookupAndProcess(textNode.parentNode);
    if (ar0) {
      return ar0;
    }

    let [wordStart, wordEnd] = [offset1, offset2];
    if (this.isExtendWholeWord) {
      if (this.lang === Book.LangCodeEn) {
        [wordStart, wordEnd] = AnnotatorHelper.extendWholeWord(
          nodeText, this.charPattern, wordStart, wordEnd);
      } else if (Book.isChineseText(this.lang)) {
        [wordStart, wordEnd] = AnnotatorHelper.extendZhPhrases(
          nodeText, this.charPattern, wordStart, wordEnd, this.zhPhrases);
      }
    }
    if (wordStart === wordEnd) {
      return null;
    }

    let ar = new AnnotateResult();
    ar.operation = 'add';
    let selectedText = nodeText.substring(wordStart, wordEnd);

    if (selectedText === nodeText) {
      // if (textNode.previousSibling === null && textNode.nextSibling === null) {
      // the only one TextNode
      let exactNode = textNode.parentNode as Element;
      this.resetAnnotation(exactNode, 'add', true);
      ar.wordEl = exactNode;
      return ar;
      // }
    }

    let wordsNode = textNode;
    if (wordStart > 0) {
      wordsNode = wordsNode.splitText(wordStart);
    }
    if (wordEnd < nodeText.length) {
      wordsNode.splitText(selectedText.length);
    }

    let parent = textNode.parentNode;
    let wrapping = this.createWrappingTag();
    parent.replaceChild(wrapping, wordsNode);
    wrapping.appendChild(wordsNode);

    ar.wordEl = wrapping;
    ar.elCreated = true;
    return ar;
  }

  private doInSameParent(parent: Element, textNode1: Text, offset1, textNode2: Text, offset2): AnnotateResult {

    let cns = Array.from(parent.childNodes);
    let nodeIndex1 = cns.indexOf(textNode1);
    let nodeIndex2 = cns.indexOf(textNode2);
    if (nodeIndex1 > nodeIndex2) {
      [textNode1, textNode2] = [textNode2, textNode1];
      [offset1, offset2] = [offset2, offset1];
    }

    let ar0 = this.lookupAndProcess(parent);
    if (ar0) {
      return ar0;
    }

    let interNodes = [];
    let inter = false;
    let ann = this.current;
    let editAttrOutside = ann.dataName && typeof ann.dataValue === 'undefined';
    for (let item of cns) {
      if (item === textNode2) {
        break;
      }
      if (inter) {
        if (item.nodeType === Node.ELEMENT_NODE && editAttrOutside) {
          let selector = this.annotationSelector();
          let itemEl = item as Element;
          if (itemEl.matches(selector)) {
            return null;
          }
          let nested = itemEl.querySelector(selector);
          if (nested) {
            return null;
          }
        }
        interNodes.push(item);
      }
      if (item === textNode1) {
        inter = true;
      }
    }

    let [wordStart1, wordEnd2] = [offset1, offset2];
    let text1 = textNode1.textContent, text2 = textNode2.textContent;

    if (this.isExtendWholeWord) {
      if (this.lang === Book.LangCodeEn) {
        [wordStart1,] = AnnotatorHelper.extendWholeWord(text1, this.charPattern, wordStart1, text1.length);
        [, wordEnd2] = AnnotatorHelper.extendWholeWord(text2, this.charPattern, 0, wordEnd2);
      } else if (Book.isChineseText(this.lang)) {
        [wordStart1,] = AnnotatorHelper.extendZhPhrases(text1, this.charPattern, wordStart1, text1.length, this.zhPhrases);
        [, wordEnd2] = AnnotatorHelper.extendZhPhrases(text2, this.charPattern, 0, wordEnd2, this.zhPhrases);
      }
    }

    let beginingNode = textNode1;
    if (wordStart1 > 0) {
      beginingNode = beginingNode.splitText(wordStart1);
    }

    let endingNode = textNode2;
    endingNode.splitText(wordEnd2);

    let wrapping = this.createWrappingTag();
    parent.replaceChild(wrapping, beginingNode);
    wrapping.appendChild(beginingNode);
    for (let inode of interNodes) {
      wrapping.appendChild(inode);
    }
    wrapping.appendChild(endingNode);
    this.removeInnerAnnotations(wrapping);

    let ar = new AnnotateResult();
    ar.operation = 'add';
    ar.wordEl = wrapping;
    ar.elCreated = true;
    return ar;
  }

  annotate(): AnnotateResult {
    if (!this.current) {
      return null;
    }
    let selection = window.getSelection();
    let ar = this.doAnnotate(selection);
    selection.removeAllRanges();
    return ar;
  }

  private doAnnotate(selection: Selection): AnnotateResult {
    let node1 = selection.anchorNode;
    let node2 = selection.focusNode;

    if (!node1 || !node2) {
      return null;
    }

    let offset1 = selection.anchorOffset;
    let offset2 = selection.focusOffset;

    if (!this.wordAtCursorIfNoSelection) {
      if (node1 === node2 && offset1 === offset2) {
        return null;
      }
    }

    if (node1.nodeType !== Node.TEXT_NODE
      || node2.nodeType !== Node.TEXT_NODE) {
      return null;
    }

    if (node1.parentNode !== node2.parentNode) {
      return null;
    }

    if (!AnnotatorHelper.inContainer(node1, node2, this.container)) {
      return null;
    }

    let textNode1 = node1 as Text;
    let textNode2 = node2 as Text;

    if (textNode1 === textNode2) {
      return this.doInOneTextNode(textNode1, offset1, offset2);
    }

    // textNode1 !== textNode2
    // textNode1.parentNode === textNode2.parentNode
    let parent = textNode1.parentNode as Element;
    return this.doInSameParent(parent, textNode1, offset1, textNode2, offset2);
  }

}
