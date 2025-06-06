import {
  Component, ComponentFactory, ComponentFactoryResolver,
  ComponentRef, HostListener, ViewChild, ViewContainerRef
} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {PopStateEvent} from '@angular/common/src/location/location';

import * as Tether from 'tether';
import * as Drop from 'tether-drop';

import {SuiSidebar} from 'ng2-semantic-ui/dist';
import {SuiModalService} from 'ng2-semantic-ui';

import {UIConstants, ReaderStyles, LocalStorageKey} from '../config';
import {AnnotationSet} from '../anno/annotation-set';
import {AnnotatorHelper} from '../anno/annotator-helper';
import {ContentContext} from '../content-types/content-context';
import {DictRequest, SelectedItem, UserWordChange} from '../content-types/dict-request';
import {Book} from '../models/book';
import {Chap} from '../models/chap';
import {Para} from '../models/para';
import {UserWord} from '../models/user-word';
import {DictEntry} from '../models/dict-entry';
import {SessionService} from '../services/session.service';
import {WxAuthService} from '../services/wx-auth.service';
import {BookService} from '../services/book.service';
import {ChapService} from '../services/chap.service';
import {ParaService} from '../services/para.service';
import {DictService} from '../services/dict.service';
import {DictZhService} from '../services/dict-zh.service';
import {UserWordService} from '../services/user-word.service';
import {AnnotationsService} from '../services/annotations.service';
import {UserVocabularyService} from '../services/user-vocabulary.service';
import {DictSimpleComponent} from '../dict/dict-simple.component';
import {ParaCommentsModal} from '../content/para-comments.component';
import {AccountSupportComponent} from '../account/account-support.component';
import {ReaderHelperModal} from './reader-helper.component';


@Component({
  selector: 'chap-detail',
  templateUrl: './chap.component.html',
  styleUrls: ['./chap.component.css']
})
export class ChapComponent extends AccountSupportComponent {
  @ViewChild('dictSimple', {read: ViewContainerRef}) dictSimple: ViewContainerRef;
  @ViewChild('sidebar', {read: SuiSidebar}) sidebar: SuiSidebar;
  book: Book;
  chap: Chap;

  selectedPara: Para;
  showTrans = true;
  leftRight = true;
  highlightSentence = true;
  wordsHover = true;
  markNewWords = true;
  lookupDict = false;
  loadZhPhrases = true;
  showCommentsCount = true;

  allowSwitchChap = true;

  chapListScrolled = false;

  sidebarContent: 'vocabulary' | 'chap-list' = 'vocabulary';

  readerBgCssClass = ReaderStyles.ReaderBgDefault;
  readerBgCandidates = ReaderStyles.ReaderBgCandidates;

  prevChap: Chap;
  nextChap: Chap;

  annotationSet: AnnotationSet;
  contentContext: ContentContext;

  dictRequest: DictRequest = null;
  dictTether = null;

  simpleDictRequest: DictRequest = null;
  simpleDictDrop: Drop;
  simpleDictComponentRef: ComponentRef<DictSimpleComponent>;

  lastWordDrop = null;

  constructor(protected sessionService: SessionService,
              protected wxAuthService: WxAuthService,
              protected bookService: BookService,
              protected chapService: ChapService,
              protected paraService: ParaService,
              protected dictService: DictService,
              protected dictZhService: DictZhService,
              protected userWordService: UserWordService,
              protected annoService: AnnotationsService,
              protected vocabularyService: UserVocabularyService,
              protected modalService: SuiModalService,
              protected resolver: ComponentFactoryResolver,
              protected route: ActivatedRoute) {
    super(sessionService, wxAuthService, modalService, route);
    this.requireLogin = true;

    const LSK = LocalStorageKey;
    let storage = window.localStorage;
    let readerBg = storage.getItem(LSK.readerBG);
    if (readerBg) {
      this.readerBgCssClass = readerBg;
    }
    this.lookupDict = this.getStorageBoolean(storage, LSK.readerLookupDict, this.lookupDict);
    this.markNewWords = this.getStorageBoolean(storage, LSK.readerMarkNewWords, this.markNewWords);
    this.wordsHover = this.getStorageBoolean(storage, LSK.readerWordsHover, this.wordsHover);
    this.showTrans = this.getStorageBoolean(storage, LSK.readerShowTrans, this.showTrans);
    this.leftRight = this.getStorageBoolean(storage, LSK.readerLeftRight, this.leftRight);
  }


  get entryHistory(): DictEntry[] {
    return this.dictService.entryHistory;
  }

  get latestAdded(): UserWord[] {
    return this.userWordService.latestAdded;
  }

  private getStorageBoolean(storage, key, defaultValue: boolean): boolean {
    let value = storage.getItem(key);
    if (value == null) {
      return defaultValue;
    }
    return value === '1';
  }

  // tslint:disable-next-line:use-life-cycle-interface
  ngOnInit(): void {
    super.ngOnInit();

    this.checkLoginAndLoad();

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
          if (target.closest('.ui.modal')) {
            return;
          }
        }
        this.onDictItemSelect(null);
        event.stopPropagation();
      }
    }, true);
  }


  // tslint:disable-next-line:use-life-cycle-interface
  ngOnDestroy(): void {
    super.ngOnDestroy();

    let storage = window.localStorage;

    const LSK = LocalStorageKey;
    storage.setItem(LSK.readerBG, this.readerBgCssClass);
    storage.setItem(LSK.readerLookupDict, this.lookupDict ? '1' : '0');
    storage.setItem(LSK.readerMarkNewWords, this.markNewWords ? '1' : '0');
    storage.setItem(LSK.readerWordsHover, this.wordsHover ? '1' : '0');
    storage.setItem(LSK.readerShowTrans, this.showTrans ? '1' : '0');
    storage.setItem(LSK.readerLeftRight, this.leftRight ? '1' : '0');
  }

  protected loadContent() {
    if (!this.pathParams) {
      return;
    }
    let chapId = this.pathParams.get('id');
    this.chapService.getDetail(chapId)
      .subscribe(chap => {
        if (!chap) {
          return;
        }
        this.processChap(chap);
        this.chap = chap;
        this.contentLoaded = true;

        if (!this.contentContext) {
          this.contentContext = new ContentContext();
        }
        this.contentContext.combinedWordsMapObs = this.vocabularyService.getCombinedWordsMap();
        this.loadBook(chap.bookId);
        this.checkCommentsCount();
      });

    this.userWordService.loadAll().subscribe();
  }

  protected onUserChanged(event) {
    this.vocabularyService.invalidateBaseVocabularyMap();
    this.loadContent();
  }

  gotoPercent(percent: number) {
    if (!this.chap) {
      return;
    }
    let paras = this.chap.paras;
    if (!paras || paras.length === 0) {
      return;
    }
    let pn = Math.round(paras.length * percent / 100.0);
    if (pn === 0) {
      pn = 1;
    } else if (pn > paras.length) {
      pn = paras.length;
    }
    this.selectedPara = paras[pn - 1];
    this.selectPno(pn);
  }

  private selectPno(pn) {
    let paraEl = document.querySelector(`.item.paragraph.chap_p${pn}`);
    if (paraEl) {
      paraEl.scrollIntoView({block: 'center'});
    }
  }

  private processChap(chap) {
    if (this.book) {
      chap.book = this.book;
    }
    if (!chap.paras) {
      chap.paras = [];
      return;
    }

    let paras = chap.paras;
    for (let para of paras) {
      para.chap = chap;
    }

    let pns = this.queryParams.get('pn');
    if (pns) {
      let pn = parseInt(pns); // 1 based
      if (!isNaN(pn) && pn > 0) {
        if (pn > paras.length) {
          pn = paras.length;
        }
        let para = paras[pn - 1];
        if (para) {
          setTimeout(() => {
            this.selectedPara = para;
            this.selectPno(pn);
          }, 50);
        }
      }
    }
  }

  protected buildCurrentUri(): string {
    let chapId;
    if (this.pathParams) {
      chapId = this.pathParams.get('id');
    }
    if (!chapId && this.chap) {
      chapId = this.chap._id;
    }
    let uri = `chaps/${chapId}`;
    let pn = this.queryParams.get('pn');
    if (pn) {
      uri = `${uri}?pn=${pn}`;
    }
    return uri;
  }

  private doScrollChapList(chapIndex) {
    let selector = `.chap-list a.item.chap_title${chapIndex}`;
    let chapTitleEl = document.querySelector(selector);
    if (!chapTitleEl) {
      setTimeout(() => {
        chapTitleEl = document.querySelector(selector);
        if (chapTitleEl) {
          chapTitleEl.scrollIntoView({block: 'center'});
          this.chapListScrolled = true;
        }
      }, 50);
      return;
    }
    chapTitleEl.scrollIntoView({block: 'center'});
    this.chapListScrolled = true;
  }

  private setupNavigation(scrollChapList = true) {
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
    if (scrollChapList) {
      this.doScrollChapList(ci);
    }
  }

  switchChap(chap, scrollChapList = true) {
    if (!chap) {
      return;
    }
    if (!this.allowSwitchChap) {
      return;
    }
    if (this.chap && chap._id === this.chap._id) {
      return;
    }
    this.chapService.getDetail(chap._id)
      .subscribe(chapDetail => {
        this.processChap(chapDetail);
        this.chap = chapDetail;
        this.contentLoaded = true;

        window.history.pushState({}, '', `chaps/${chap._id}`);
        if (scrollChapList) {
          this.chapListScrolled = false;
        }
        this.setupNavigation(scrollChapList);
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
      if (this.chap) {
        this.chap.book = book;
      }

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
    if (which === 'chap-list') {
      if (this.chapListScrolled) {
        return;
      }
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
      this.doScrollChapList(ci);
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
        targetAttachment: 'bottom right',
        attachment: 'top right',
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
    // tslint:disable-next-line:only-arrow-functions
    let content = function() {
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
        content,
        classes: `${UIConstants.dropClassPrefix}dict`,
        constrainToScrollParent: false,
        remove: true,
        openOn: 'click', // click,hover,always
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

  showDictSimplePopup(el, entry) {
    if (this.lastWordDrop) {
      this.lastWordDrop.destroy();
      this.lastWordDrop = null;
    }
    let dscr = this.getSimpleDictComponentRef();
    // tslint:disable-next-line:only-arrow-functions
    let content = function() {
      dscr.instance.entry = entry;
      return dscr.location.nativeElement;
    };
    let drop = new Drop({
      target: el,
      content,
      classes: `${UIConstants.dropClassPrefix}dict`,
      constrainToScrollParent: false,
      remove: true,
      openOn: 'click', // click,hover,always
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
          // console.log(`total comments: ${total}`);
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

  clearDictLookupHistory() {
    this.dictService.clearHistory();
  }

  showHelper() {
    this.modalService.open(new ReaderHelperModal());
  }

  setBackground(cssClass: string) {
    this.readerBgCssClass = cssClass;
  }


  paraTracker(index, para) {
    return para._id;
  }

}
