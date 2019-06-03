import {
  Component, ComponentFactory, ComponentFactoryResolver,
  ComponentRef, HostListener,
  OnInit, ViewChild, ViewContainerRef
} from '@angular/core';
import {ActivatedRoute, ParamMap} from '@angular/router';
import {PopStateEvent} from '@angular/common/src/location/location';

import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

import * as Tether from 'tether';
import * as Drop from 'tether-drop';

import {SuiSidebar} from 'ng2-semantic-ui/dist';
import {SuiModalService} from 'ng2-semantic-ui';

import {UIConstants} from '../config';
import {AnnotationSet} from '../anno/annotation-set';
import {AnnotatorHelper} from '../anno/annotator-helper';
import {ContentContext} from '../content-types/content-context';
import {DictRequest, SelectedItem, UserWordChange} from '../content-types/dict-request';
import {User} from '../models/user';
import {Book} from '../models/book';
import {Chap} from '../models/chap';
import {Para} from '../models/para';
import {OpResult} from '../models/op-result';
import {UserWord} from '../models/user-word';
import {DictEntry} from '../models/dict-entry';
import {Annotation} from '../models/annotation';
import {SessionService} from '../services/session.service';
import {BookService} from '../services/book.service';
import {ChapService} from '../services/chap.service';
import {ParaService} from '../services/para.service';
import {DictService} from '../services/dict.service';
import {DictZhService} from '../services/dict-zh.service';
import {UserWordService} from '../services/user-word.service';
import {AnnotationsService} from '../services/annotations.service';
import {UserVocabularyService} from '../services/user-vocabulary.service';
import {DictSimpleComponent} from '../dict/dict-simple.component';
import {LoginModal} from '../account/login-popup.component';
import {ParaCommentsModal} from '../content/para-comments.component';

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
  loadZhPhrases = false;
  showCommentsCount = true;

  allowSwitchChap = true;
  hideWindowUrl = false;

  sidebarContent = 'vocabulary';//chap-list

  prevChap: Chap;
  nextChap: Chap;

  annotationSet: AnnotationSet;
  contentContext: ContentContext;

  currentAnnotation: Annotation = null;

  dictRequest: DictRequest = null;
  dictTether = null;

  simpleDictRequest: DictRequest = null;
  simpleDictDrop: Drop;
  simpleDictComponentRef: ComponentRef<DictSimpleComponent>;


  get currentUser(): User {
    return this.sessionService.currentUser;
  }

  constructor(private sessionService: SessionService,
              private bookService: BookService,
              private chapService: ChapService,
              private paraService: ParaService,
              private dictService: DictService,
              private dictZhService: DictZhService,
              private userWordService: UserWordService,
              private annoService: AnnotationsService,
              private vocabularyService: UserVocabularyService,
              private modalService: SuiModalService,
              private resolver: ComponentFactoryResolver,
              private route: ActivatedRoute) {
  }


  get entryHistory(): DictEntry[] {
    return this.dictService.entryHistory;
  }

  get latestAdded(): UserWord[] {
    return this.userWordService.latestAdded;
  }

  clearDictLookupHistory() {
    this.dictService.clearHistory();
  }

  private initialLoadContent(chapId) {
    this.chapService.getDetail(chapId)
      .subscribe(chap => {
        if (this.hideWindowUrl) {
          window.history.pushState({}, '', `/`);
        }
        console.log(chap);
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
        this.chap = chap;
        if (!this.contentContext) {
          this.contentContext = new ContentContext();
        }
        this.contentContext.combinedWordsMapObs = this.vocabularyService.getCombinedWordsMap();
        this.loadBook(chap.bookId);
        this.checkCommentsCount();
      });

    this.userWordService.loadAll().subscribe();
  }

  private fetchTheChapId(): Observable<string> {
    return this.route.paramMap.pipe(
      map((params: ParamMap) => {
          return params.get('id');
        }
      ));
  }

  private loginThenInit(chapId) {
    this.modalService.open<string, string, string>(new LoginModal(/*'请登录'*/))
      .onDeny(d => {

      })
      .onApprove(r => {
        this.initialLoadContent(chapId);
      });
  }

  ngOnInit(): void {
    this.fetchTheChapId().subscribe(chapId => {
      this.route.queryParamMap.subscribe(params => {
        // console.log(params);
        let tempToken = params.get('tt');
        if (tempToken) {
          this.sessionService.loginByTempToken(tempToken)
            .subscribe((opr: OpResult) => {
              if (opr && opr.ok === 1) {
                window.history.pushState({}, '', `chaps/${chapId}`);
                this.initialLoadContent(chapId);
              } else {
                let msg = opr.message || '登录失败';
                alert(msg);
              }
            });
          return;
        }

        let cu = this.sessionService.currentUser;
        if (cu) {
          this.initialLoadContent(chapId);
          return;
        }

        this.sessionService.checkLogin()
          .subscribe(cu => {
            if (cu) {
              this.initialLoadContent(chapId);
              return;
            }
            this.loginThenInit(chapId);
          });
      });
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

  private setupNavigation() {
    this.prevChap = null;
    this.nextChap = null;
    if (!this.book) {
      return;
    }
    let chaps = this.book.chaps;
    if (!chaps || chaps.length === 0) {
      return;
    }
    let ci = chaps.findIndex(c => c._id === this.chap._id);
    if (ci === -1) {
      return;
    }
    if (ci > 0) {
      this.prevChap = chaps[ci - 1];
    }
    if (ci < chaps.length - 1) {
      this.nextChap = chaps[ci + 1];
    }
  }

  switchChap(chap) {
    if (!chap) {
      return;
    }
    if (!this.allowSwitchChap) {
      return;
    }
    if (this.chap && chap._id === this.chap._id) {
      return;
    }
    // let last = this.chap;
    this.chapService.getDetail(chap._id)
      .subscribe(chapDetail => {
        this.chap = chapDetail;
        if (!this.hideWindowUrl) {
          window.history.pushState({}, '', `chaps/${chap._id}`);
        }
        this.setupNavigation();
        this.checkCommentsCount();
      });
  }

  private loadBook(bookId) {
    let obs = null;
    if (this.allowSwitchChap) {
      obs = this.bookService.getDetail(bookId);
    } else {
      obs = this.bookService.getOne(bookId);
    }
    obs.subscribe((book) => {
      if (!book) {
        return;
      }
      this.book = book;

      this.contentContext.contentLang = book.contentLang;
      this.contentContext.transLang = book.transLang;
      if (this.loadZhPhrases) {
        this.dictZhService.getPhrases()
          .subscribe(ph => this.contentContext.zhPhrases = ph);
      }
      this.loadAnnotations();

      if (this.allowSwitchChap) {
        this.setupNavigation();
      }
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
  }

  toggleSidebar(sidebar: SuiSidebar, which) {
    if (sidebar.isVisible) {
      if (this.sidebarContent === which) {
        sidebar.close();
        return;
      }
      this.sidebarContent = which;
      return;
    }
    this.sidebarContent = which;
    sidebar.open();
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

  toggleMarkNewWords() {
    this.markNewWords = !this.markNewWords;
    this.toggleBodyClass(UIConstants.userwordDisabledBodyClass, this.markNewWords);
  }

  toggleWordsHover() {
    this.wordsHover = !this.wordsHover;
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
        constraints: [
          {
            to: 'scrollParent',
            attachment: 'together',
            pin: true
          }
        ],
        classPrefix: UIConstants.tetherClassPrefixNoHyphen
      });
    }
  }

  onDictItemSelect(selected: SelectedItem) {
    if (!this.dictRequest) {
      return;
    }
    let dr = this.dictRequest;
    this.closeDictPopup();
    dr.meaningItemCallback(selected);
  }

  onUserWordChange(change: UserWordChange) {
    let dr = this.dictRequest;
    if (!dr) {
      return;
    }
    if (dr.userWordChangeCallback) {
      dr.userWordChangeCallback(change);
    }
  }

  private getSimpleDictComponentRef() {
    if (!this.simpleDictComponentRef) {
      let factory: ComponentFactory<DictSimpleComponent> = this.resolver.resolveComponentFactory(DictSimpleComponent);
      this.dictSimple.clear();
      this.simpleDictComponentRef = this.dictSimple.createComponent(factory);
    }
    return this.simpleDictComponentRef;
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
    let dscr = this.getSimpleDictComponentRef();
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
        constrainToScrollParent: false,
        remove: true,
        openOn: 'click',//click,hover,always
        tetherOptions: {
          attachment: 'top center',
          constraints: [
            {
              to: 'window',
              attachment: 'together',
              pin: true
            }
          ]
        }
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

  lastWordDrop = null;

  showDictSimplePopup(el, entry) {
    if (this.lastWordDrop) {
      this.lastWordDrop.destroy();
      this.lastWordDrop = null;
    }
    let dscr = this.getSimpleDictComponentRef();
    let content = function () {
      dscr.instance.entry = entry;
      return dscr.location.nativeElement;
    };
    let drop = new Drop({
      target: el,
      content: content,
      classes: `${UIConstants.dropClassPrefix}dict`,
      constrainToScrollParent: false,
      remove: true,
      openOn: 'click',//click,hover,always
      tetherOptions: {
        attachment: 'top center',
        constraints: [
          {
            to: 'window',
            attachment: 'together',
            pin: true
          }
        ]
      }
    });
    drop.open();
    drop.once('close', () => {
      if (this.lastWordDrop === drop) {
        this.lastWordDrop = null;
      }
    });
    this.lastWordDrop = drop;
  }

  lookupUserWord($event, uw) {
    let el = $event.target;
    this.dictService.getEntry(uw.word, {pushHistory: false})
      .subscribe(entry => {
        this.showDictSimplePopup(el, entry);
      });
  }

  showEntryPopup($event, entry) {
    this.showDictSimplePopup($event.target, entry);
  }


  private checkCommentsCount() {
    if (!this.showCommentsCount) {
      return;
    }
    let chap = this.chap;
    if (chap && !chap.paraCommentsCountLoaded) {
      this.chapService.loadCommentsCount(chap)
        .subscribe(total => {
          console.log(`total comments: ${total}`);
        });
    }
  }

  private doShowComments(para) {
    this.selectPara(para);
    this.modalService
      .open(new ParaCommentsModal(para));
  }

  showComments(para) {
    if (para.commentsCount === 0) {
      return;
    }
    if (para.comments) {
      this.doShowComments(para);
    } else {
      this.paraService.loadComments(para)
        .subscribe(cs => {
          this.doShowComments(para);
        });
    }
  }

  paraTracker(index, para) {
    return para._id;
  }

}
