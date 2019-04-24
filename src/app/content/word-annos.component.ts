import {Component, Input, OnInit} from '@angular/core';

import {AnnotationSet} from '../anno/annotation-set';
import {UIConstants, DataAttrNames} from '../config';
import {AnnotatorHelper} from '../anno/annotator-helper';

@Component({
  selector: 'word-annos',
  templateUrl: './word-annos.component.html',
  styleUrls: ['./word-annos.component.css']
})
export class WordAnnosComponent implements OnInit {
  @Input() _wordEl: HTMLElement;
  @Input() paraTextEl: HTMLElement;
  @Input() enabled: boolean;
  @Input() annotationSet: AnnotationSet;
  @Input() onTagRemoved: (el: HTMLElement) => void;
  @Input() notifyChange: () => void;
  word: string;
  head: string;
  items: any[];
  note: string;
  meaning: any;
  private initialized = false;


  ngOnInit() {
    this.initialized = true;
  }

  set wordEl(_wordEl: HTMLElement) {
    this._wordEl = _wordEl;
    if (this.initialized && this.enabled) {
      this.parseAnnotations();
    }
  }

  get wordEl(): HTMLElement {
    return this._wordEl;
  }

  private parseAnnotations() {
    this.items = [];
    this.note = null;
    this.meaning = null;
    let wordEl = this._wordEl;
    if (!wordEl) {
      this.word = null;
      this.head = null;
      return;
    }
    this.word = wordEl.textContent;
    this.head = this.word;

    let dataset = wordEl.dataset;
    for (let name in dataset) {
      let value = dataset[name];
      if (name === DataAttrNames.mean) {
        let mean = value;
        let forWord = wordEl.dataset[DataAttrNames.word];
        if (!forWord) {
          forWord = this.word;
        }
        let pos = wordEl.dataset[DataAttrNames.pos] || '';
        let text = mean;
        if (pos) {
          text = `${pos} ${mean}`;
        }
        this.meaning = {pos, mean, word: forWord, text};
        continue;
      }
      if (name === DataAttrNames.note) {
        this.note = value;
        continue;
      }
      let text = this.annotationSet.annotationOutput(name, value);
      if (!text) {
        continue;
      }
      let item = {dataName: name, dataValue: value, text};
      this.items.push(item);

      /*if (name === DataAttrNames.assoc/!* && DataAttrValues.phraPattern.test(value)*!/) {
        let group = value;

        let stEl = this.findSentence(this.wordEl);
        if (!stEl) {
          stEl = this.paraTextEl;
        }
        let groupSelector = `[data-${DataAttrNames.assoc}=${group}]`;
        let groupEls = stEl.querySelectorAll(groupSelector);
        let els = Array.from(groupEls);
        item.phrase = els.map((el: Element) => el.textContent).join(' ');
      }*/
    }

    if (this.head.length > 20) {
      this.head = this.head.substring(0, 20) + '...';
    }
  }

  private findSentence(node): any {
    do {
      if (node instanceof Element) {
        let el = node as Element;
        if (el === this.paraTextEl) {
          return null;
        }
        if (el.matches(UIConstants.sentenceTagName)) {
          return el;
        }
      }
      node = node.parentNode;
    } while (node);
    return null;
  }

  dropAnno(item) {
    let element = this._wordEl;
    let dataset = element.dataset;
    if (item === 'meaning') {
      delete dataset[DataAttrNames.pos];
      delete dataset[DataAttrNames.word];
      delete dataset[DataAttrNames.mean];
      this.meaning = null;
    } else if (item === 'note') {
      delete dataset[DataAttrNames.note];
      this.note = null;
    } else {
      let dataName = item.dataName;
      if (!dataName) {
        return;
      }
      delete dataset[dataName];
      element.classList.remove(dataName);
      this.items = this.items.filter(it => it !== item);
    }

    this.notifyChange();

    if (!this.note && !this.meaning && (!this.items || this.items.length == 0)) {
      let {removed} = AnnotatorHelper.removeDropTagIfDummy(element);
      if (removed) {
        this.onTagRemoved(element);
      }
    }
  }

}
