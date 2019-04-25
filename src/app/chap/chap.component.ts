import {
  Component, ComponentFactory, ComponentFactoryResolver,
  ComponentRef, HostListener,
  OnInit, ViewChild, ViewContainerRef
} from '@angular/core';
import {ActivatedRoute, ParamMap} from '@angular/router';
import {Location} from '@angular/common';
import {PopStateEvent} from '@angular/common/src/location/location';

import {switchMap} from 'rxjs/operators';

import * as Tether from 'tether';
import * as Drop from 'tether-drop';

import {UIConstants} from '../config';
import {AnnotationSet} from '../anno/annotation-set';
import {AnnotatorHelper} from '../anno/annotator-helper';
import {ContentContext} from '../content-types/content-context';
import {DictRequest, DictSelectedResult} from '../content-types/dict-request';
import {NoteRequest} from '../content-types/note-request';
import {Book} from '../models/book';
import {Chap} from '../models/chap';
import {Para} from '../models/para';
import {DictEntry} from '../models/dict-entry';
import {Annotation} from '../models/annotation';
import {BookService} from '../services/book.service';
import {ChapService} from '../services/chap.service';
import {ParaService} from '../services/para.service';
import {DictZhService} from '../services/dict-zh.service';
import {AnnotationsService} from '../services/annotations.service';
import {UserVocabularyService} from '../services/user-vocabulary.service';
import {DictSimpleComponent} from '../dict/dict-simple.component';

@Component({
  selector: 'chap-detail',
  templateUrl: './chap.component.html',
  styleUrls: ['./chap.component.css']
})
export class ChapComponent implements OnInit {
  @ViewChild('dictSimple', {read: ViewContainerRef}) dictSimple: ViewContainerRef;
  book: Book;
  chap: Chap;

  selectedPara: Para;
  showTrans = true;
  leftRight = true;
  highlightSentence = true;
  wordsHover = true;
  markNewWords = true;
  lookupDict = false;

  annotationSet: AnnotationSet;
  contentContext: ContentContext;

  currentAnnotation: Annotation = null;

  dictRequest: DictRequest = null;
  dictTether = null;

  simpleDictRequest: DictRequest = null;
  simpleDictDrop: Drop;
  simpleDictComponentRef: ComponentRef<DictSimpleComponent>;

  noteRequest: NoteRequest = null;
  noteTether = null;
  noteRequestNote = '';


  constructor(private resolver: ComponentFactoryResolver,
              private bookService: BookService,
              private chapService: ChapService,
              private paraService: ParaService,
              private dictZhService: DictZhService,
              private annoService: AnnotationsService,
              private userVocabularyService: UserVocabularyService,
              private route: ActivatedRoute,
              private location: Location) {
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(switchMap((params: ParamMap) =>
      this.chapService.getDetail(params.get('id'))
    )).subscribe(chap => {
      if (!chap) {
        return;
      }
      if (!chap.paras) {
        chap.paras = [];
      } else {
        for (let para of chap.paras) {
          para.chap = chap;
        }
      }
      if (chap.zhName == null) {
        chap.zhName = '';
      }
      this.chap = chap;
      if (!this.contentContext) {
        this.contentContext = new ContentContext();
      }
      this.contentContext.combinedWordsMapObs = this.userVocabularyService.getCombinedWordsMap();
      this.loadBook(chap);
    });

    document.addEventListener('click', (event) => {
      if (this.dictRequest && this.dictTether) {
        let dictPopup = document.getElementById('dictPopup');
        if (event.target) {
          let target = event.target as Element;
          if (target.contains(this.dictRequest.wordElement)) {
            if (target.closest(`${UIConstants.sentenceTagName}, .para-text, .paragraph`)) {
              return;
            }
          }
          if (dictPopup.contains(target)) {
            return;
          }
        }
        this.onDictItemSelect(null);
        event.stopPropagation();
      }
    }, true);
  }

  private loadBook(chap) {
    this.bookService.getOne(chap.bookId)
      .subscribe((book) => {
        if (!book) {
          return;
        }
        this.book = book;
        chap.book = book;

        this.contentContext.contentLang = book.contentLang;
        this.contentContext.transLang = book.transLang;
        this.dictZhService.getPhrases()
          .subscribe(ph => this.contentContext.zhPhrases = ph);
        this.loadAnnotations();
      });
  }

  private loadAnnotations() {
    if (!this.book) {
      return;
    }
    let afId = this.book.annotationFamilyId;
    if (!afId) {
      return;
    }
    this.annoService.getAnnotationSet(afId)
      .subscribe((annotationSet: AnnotationSet) => {
        if (!annotationSet) {
          return;
        }
        this.annotationSet = annotationSet;
        this.contentContext.annotationSet = annotationSet;
      });
  }

  @HostListener('window:keyup', ['$event'])
  keyEvent($event: KeyboardEvent) {
    // alert(`${$event.key} ${$event.code}`);
    if ($event.key === 'Escape') {
      if (this.dictRequest) {
        this.onDictItemSelect(null);
        $event.stopPropagation();
        return;
      }
      if (this.currentAnnotation) {
        this.currentAnnotation = null;
        $event.stopPropagation();
      }
    }
  }

  @HostListener('window:popstate', ['$event'])
  onPopState($event: PopStateEvent) {
    if (this.dictRequest) {
      this.closeDictPopup();
    }
    if (this.noteRequest) {
      this.closeNotePopup();
    }
  }

  selectPara(para): void {
    if (this.selectedPara === para) {
      return;
    }
    this.selectedPara = para;
  }

  selectPara2(para): void {
    if (this.selectedPara === para) {
      this.selectedPara = null;
      return;
    }
    this.selectPara(para);
  }


  private toggleBodyClass(className: string, flag: boolean) {
    let bodyClasses = document.body.classList;
    if (flag) {
      bodyClasses.remove(className);
    } else {
      bodyClasses.add(className);
    }
  }

  onMarkNewWordsChange() {
    this.toggleBodyClass(UIConstants.newwordDisabledBodyClass, this.markNewWords);
  }

  onWordsHoverChange() {
    this.toggleBodyClass(UIConstants.annoDisabledBodyClass, this.wordsHover);
  }


  private removeTetherClass(el) {
    el.className = el.className.split(' ')
      .filter(n => !n.startsWith(UIConstants.tetherClassPrefixNoHyphen + '-')).join(' ');
    if (el.className === '') {
      el.removeAttribute('class');
    }
  }

  private closeDictPopup() {
    if (this.dictRequest) {
      if (this.dictTether) {
        this.dictTether.destroy();
        this.dictTether = null;
      }
      let el = this.dictRequest.wordElement;
      this.removeTetherClass(el);
      this.dictRequest = null;
    }
  }

  onDictRequest(dictRequest: DictRequest) {
    if (this.dictRequest) {
      if (this.dictRequest.wordElement === dictRequest.wordElement) {
        this.onDictItemSelect(null);
        return;
      } else {
        // cancel
        this.onDictItemSelect(null);
      }
    }
    if (dictRequest && dictRequest.simplePopup) {
      this.showDictSimple(dictRequest);
    } else {
      this.dictRequest = dictRequest;
    }
  }

  onDictPopupReady() {
    if (!this.dictRequest) {
      return;
    }
    if (this.dictTether) {
      this.dictTether.position();
    } else {
      let dictPopup = document.getElementById('dictPopup');
      this.dictTether = new Tether({
        element: dictPopup,
        target: this.dictRequest.wordElement,
        attachment: 'top center',
        targetAttachment: 'bottom center',
        constraints: [
          {
            to: 'window',
            attachment: 'together',
            pin: true
          }
        ],
        classPrefix: UIConstants.tetherClassPrefixNoHyphen
      });
    }
  }

  onDictItemSelect(selected: DictSelectedResult) {
    if (!this.dictRequest) {
      return;
    }
    let dr = this.dictRequest;
    this.closeDictPopup();
    dr.meaningItemCallback(selected);
  }

  private showDictSimple(dictRequest: DictRequest) {
    if (!dictRequest) {
      return;
    }
    if (this.simpleDictRequest) {
      let el = this.simpleDictRequest.wordElement;
      if (el === dictRequest.wordElement) {
        return;
      }
    }

    let {dictEntry, wordElement} = dictRequest;
    if (!this.simpleDictComponentRef) {
      let factory: ComponentFactory<DictSimpleComponent> = this.resolver.resolveComponentFactory(DictSimpleComponent);
      this.dictSimple.clear();
      this.simpleDictComponentRef = this.dictSimple.createComponent(factory);
    }
    let dscr = this.simpleDictComponentRef;

    let content = function () {
      dscr.instance.entry = dictEntry as DictEntry;
      return dscr.location.nativeElement;
    };

    setTimeout(() => {
      let lastDrop = this.simpleDictDrop;
      if (lastDrop) {
        lastDrop.close();
      }
      let drop = new Drop({
        target: wordElement,
        content: content,
        classes: `${UIConstants.dropClassPrefix}dict`,
        position: 'bottom center',
        constrainToScrollParent: false,
        remove: true,
        openOn: 'click'//click,hover,always
      });
      drop.open();
      drop.once('close', () => {
        AnnotatorHelper.removeDropTagIfDummy(wordElement);
        setTimeout(() => {
          drop.destroy();
        }, 10);
      });

      this.simpleDictRequest = dictRequest;
      this.simpleDictDrop = drop;
    }, 10);
  }

  private closeNotePopup() {
    if (this.noteRequest) {
      if (this.noteTether) {
        this.noteTether.destroy();
        this.noteTether = null;
      }
      let el = this.noteRequest.wordElement;
      this.removeTetherClass(el);
      this.noteRequest = null;
    }
    this.noteRequestNote = '';
  }

  onNoteRequest(noteRequest) {
    if (this.noteRequest) {
      // cancel
      this.completeNoteEdit(null);
    }
    this.noteRequest = noteRequest;
    this.noteRequestNote = noteRequest.note;

    let notePopup = document.getElementById('notePopup');
    this.noteTether = new Tether({
      element: notePopup,
      target: this.noteRequest.wordElement,
      attachment: 'top center',
      targetAttachment: 'bottom right',
      constraints: [
        {
          to: 'window',
          attachment: 'together',
          pin: true
        }
      ],
      classPrefix: UIConstants.tetherClassPrefixNoHyphen
    });
  }

  completeNoteEdit(note) {
    if (!this.noteRequest) {
      return;
    }
    let nr = this.noteRequest;
    this.closeNotePopup();
    nr.editNoteCallback(note);
  }

  paraTracker(index, para) {
    return para._id;
  }

  goBack(): void {
    this.location.back();
  }

}
