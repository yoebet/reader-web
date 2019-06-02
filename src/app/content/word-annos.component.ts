import {Component, Input, OnInit} from '@angular/core';

import {AnnotationSet} from '../anno/annotation-set';
import {DataAttrNames} from '../config';

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
    if (this.initialized && this.enabled && this.annotationSet) {
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
    }

    if (this.head.length > 20) {
      this.head = this.head.substring(0, 20) + '...';
    }
  }

}
