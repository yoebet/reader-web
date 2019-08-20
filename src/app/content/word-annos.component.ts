import {Component, Input, OnInit} from '@angular/core';

import {AnnotationSet} from '../anno/annotation-set';
import {AnnotatorHelper} from '../anno/annotator-helper';
import {ElAnnos} from '../anno/el-annos';

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

  head: string;
  annos: ElAnnos;
  private initialized = false;


  ngOnInit() {
    this.initialized = true;
  }

  set wordEl(_wordEl: HTMLElement) {
    this._wordEl = _wordEl;
    if (this.initialized && this.enabled && this.annotationSet) {
      this.annos = AnnotatorHelper.parseAnnotations(this._wordEl, this.annotationSet, this.paraTextEl);

      let annos = this.annos;
      this.head = annos.word;
      if (!annos.note && annos.items.length === 0) {
        if (!annos.meaning && annos.phraseMeaning) {
          this.head = annos.phraseMeaning.word;
        } else if (annos.meaning && !annos.phraseMeaning) {
          this.head = annos.meaning.word;
        }
      }
      if (this.head.length > 20) {
        this.head = this.head.substring(0, 20) + '...';
      }
    }
  }

  get wordEl(): HTMLElement {
    return this._wordEl;
  }

}
