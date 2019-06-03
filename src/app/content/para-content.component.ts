import {
  OnChanges, Input, OnInit, Output, EventEmitter, SimpleChanges,
  Component, ViewChild, ViewContainerRef,
  ComponentFactoryResolver, ComponentFactory, ComponentRef
} from '@angular/core';

import * as Drop from 'tether-drop';

import {Annotator} from '../anno/annotator';
import {AnnotatorHelper} from '../anno/annotator-helper';
import {AnnotateResult} from '../anno/annotate-result';
import {AnnotationSet, HighlightGroups} from '../anno/annotation-set';
import {CombinedWordsMap} from '../en/combined-words-map';

import {UIConstants, DataAttrNames, SpecialAnnotations, DataAttrValues} from '../config';
import {Para} from '../models/para';
import {DictEntry} from '../models/dict-entry';
import {DictZh} from '../models/dict-zh';
import {Annotation} from '../models/annotation';
import {Book} from '../models/book';
import {UserWord} from '../models/user-word';

import {DictService} from '../services/dict.service';
import {DictZhService} from '../services/dict-zh.service';
import {DictRequest, SelectedItem, UserWordChange} from '../content-types/dict-request';
import {WordAnnosComponent} from './word-annos.component';
import {ContentContext} from '../content-types/content-context';


declare type Side = 'content' | 'trans';

const SideContent: Side = 'content';
const SideTrans: Side = 'trans';

// declare type TriggerMethod = Tap/Click/LongClick/RightClick/Selection

@Component({
  selector: 'para-content',
  templateUrl: './para-content.component.html'
})
export class ParaContentComponent implements OnInit, OnChanges {
  @ViewChild('contentText', {read: ViewContainerRef}) contentText: ViewContainerRef;
  @ViewChild('transText', {read: ViewContainerRef}) transText: ViewContainerRef;
  @ViewChild('wordAnnos', {read: ViewContainerRef}) wordAnnos: ViewContainerRef;
  @Input() para: Para;
  @Input() showTrans: boolean;
  @Input() gotFocus: boolean;
  @Input() activeAlways: boolean;
  @Input() lookupDict: boolean;
  @Input() highlightSentence: boolean;
  @Input() markNewWords: boolean;
  @Input() wordsHover: boolean;
  @Input() annotation: Annotation;
  @Input() contentContext: ContentContext;
  @Output() dictRequest = new EventEmitter<DictRequest>();

  lookupDictSimple = false;

  _contentAnnotator: Annotator;
  _transAnnotator: Annotator;
  transRendered = false;
  sentenceHoverSetup = false;
  associationsHoverSetup = false;
  wordsHoverSetup = false;
  userWordsMarked = false;

  highlightedSentences: Element[];
  highlightedWords: Element[];

  wordsPopupMap = new Map<Element, Drop>();
  wordAnnosComponentRef: ComponentRef<WordAnnosComponent>;

  contentSentenceMap: Map<string, Element>;
  transSentenceMap: Map<string, Element>;

  combinedWordsMap: CombinedWordsMap;

  constructor(private resolver: ComponentFactoryResolver,
              private dictService: DictService,
              private dictZhService: DictZhService) {
  }


  get active() {
    return this.activeAlways || this.gotFocus;
  }

  get annotationSet(): AnnotationSet {
    if (!this.contentContext) {
      return AnnotationSet.emptySet();
    }
    return this.contentContext.annotationSet;
  }

  ngOnInit(): void {
    let wmObs = this.contentContext.combinedWordsMapObs;
    if (wmObs) {
      let contentLang = this.getTextLang(SideContent);
      if (!contentLang || contentLang === Book.LangCodeEn) {
        wmObs.subscribe((map: CombinedWordsMap) => {
          this.combinedWordsMap = map;
          if (this.active) {
            this.markUserWords(SideContent);
          }
        });
      }
    }

    if (this.activeAlways) {
      this.setupAssociationHover();
      //TODO: if (!this.annotationSet)
      this.setupAnnotationsPopup();
    }
  }

  getTextLang(side: Side): string {
    let {contentLang, transLang} = this.contentContext;
    return (side === SideContent) ? (contentLang || Book.LangCodeEn) : (transLang || Book.LangCodeZh);
  }

  getAnnotator(side: Side, annotation = null): Annotator {
    let annt;
    if (side === SideContent) {
      annt = this._contentAnnotator;
      if (!annt) {
        let el = this.contentText.element.nativeElement;
        let lang = this.getTextLang(side);
        annt = new Annotator(el, lang);
        this._contentAnnotator = annt;
      }
    } else {
      annt = this._transAnnotator;
      if (!annt) {
        let el = this.transText.element.nativeElement;
        let lang = this.getTextLang(side);
        annt = new Annotator(el, lang);
        this._transAnnotator = annt;
      }
    }
    if (Book.isChineseText(annt.lang) && !annt.zhPhrases) {
      annt.zhPhrases = this.contentContext.zhPhrases;
    }
    annt.switchAnnotation(annotation || this.annotation);
    return annt;
  }

  private getTextEl(side: Side) {
    return side === SideContent ?
      this.contentText.element.nativeElement :
      this.transText.element.nativeElement;
  }

  private getTheSide(textEl): Side {
    return textEl === this.contentText.element.nativeElement ?
      SideContent :
      SideTrans;
  }

  private getTheOtherSideText(textEl) {
    return textEl === this.transText.element.nativeElement ?
      this.contentText.element.nativeElement :
      this.transText.element.nativeElement;
  }

  private destroyAnnotatedWordsPopup(element) {
    let drop: any = this.wordsPopupMap.get(element);
    if (drop) {
      drop.destroy();
      this.wordsPopupMap.delete(element);
    }
  }

  selectWordMeaning(side: Side, triggerMethod = null) {
    let ann = AnnotationSet.selectMeaningAnnotation;
    let ar: AnnotateResult = this.getAnnotator(side, ann).annotate();
    if (!ar || !ar.wordEl) {
      return;
    }
    let element: any = ar.wordEl;
    let word = element.textContent;

    let oriPos = element.dataset[DataAttrNames.pos];
    let oriMeaning = element.dataset[DataAttrNames.mean];
    let oriForWord = element.dataset[DataAttrNames.word] || word;

    let textEl = this.getTextEl(side);

    let meaningItemCallback = (selected: SelectedItem) => {

      if (!selected) {
        // cancel
        let {changed, removed} = AnnotatorHelper.removeDropTagIfDummy(element);
        if (changed) {
          // this.onContentChange();
          if (removed) {
            this.destroyAnnotatedWordsPopup(element);
          }
        }
        return;
      }

      if (!selected.meaning) {
        // unset
        delete element.dataset[DataAttrNames.pos];
        delete element.dataset[DataAttrNames.mean];
        delete element.dataset[DataAttrNames.word];
        let {changed, removed} = AnnotatorHelper.removeDropTagIfDummy(element);
        if (removed) {
          this.destroyAnnotatedWordsPopup(element);
        }
      } else {
        if (selected.pos !== oriPos) {
          element.dataset[DataAttrNames.pos] = selected.pos || '';
        }
        if (selected.meaning !== oriMeaning) {
          element.dataset[DataAttrNames.mean] = selected.meaning;
        }
        if (selected.word && selected.word !== oriForWord) {
          element.dataset[DataAttrNames.word] = selected.word;
        }
      }

      this.notifyChange(side);
      if (this.wordsHoverSetup) {
        this.setupPopup(element, textEl);
      }
    };

    let textContext = {} as any;
    if (this.para) {
      textContext.paraId = this.para._id;
      let chap = this.para.chap;
      if (chap) {
        textContext.chapId = chap._id;
        if (chap.book) {
          textContext.bookId = chap.book._id;
        }
      }
    }

    let lang = this.getTextLang(side);
    if (!lang || lang === Book.LangCodeEn) {
      oriForWord = AnnotatorHelper.stripEnWord(oriForWord);

      this.dictService.getEntry(oriForWord, {base: true, stem: true})
        .subscribe((entry: DictEntry) => {
          if (entry == null) {
            AnnotatorHelper.removeDropTagIfDummy(element);
            return;
          }
          let dr = new DictRequest();
          dr.dictLang = 'en';
          dr.wordElement = element;
          dr.dictEntry = entry;
          dr.initialSelected = {pos: oriPos, meaning: oriMeaning} as SelectedItem;
          dr.relatedWords = null;
          dr.context = textContext;
          if (oriForWord !== word) {
            dr.relatedWords = [word];
          }
          let phrase = AnnotatorHelper.currentPhrase(element, textEl);
          if (phrase && phrase !== word && phrase !== oriForWord) {
            if (dr.relatedWords === null) {
              dr.relatedWords = [phrase];
            } else {
              dr.relatedWords.push(phrase);
            }
          }
          if (triggerMethod === 'Ctrl_Click') {
            dr.simplePopup = !this.lookupDictSimple;
          } else {
            dr.simplePopup = this.lookupDictSimple;
          }
          dr.meaningItemCallback = meaningItemCallback;
          dr.userWordChangeCallback = (change: UserWordChange) => {
            let {word: uwWord, dictEntry, op, familiarity} = change;
            if (dictEntry !== entry) {
              return;
            }
            const NAME_WF = DataAttrNames.wordFamiliarity;
            if (op === 'removed') {
              let codeOrUW = this.combinedWordsMap.get(uwWord);
              if (codeOrUW) {
                delete element.dataset[NAME_WF];
              } else {
                element.dataset[NAME_WF] = DataAttrValues.uwfBeyond;
              }
              return;
            }
            element.dataset[NAME_WF] = '' + familiarity;
          };
          this.dictRequest.emit(dr);
        });
    } else if (Book.isChineseText(lang)) {

      this.dictZhService.getEntry(oriForWord)
        .subscribe((entry: DictZh) => {
          if (entry == null) {
            AnnotatorHelper.removeDropTagIfDummy(element);
            return;
          }
          let dr = new DictRequest();
          dr.dictLang = 'zh';
          dr.wordElement = element;
          dr.dictEntry = entry;
          dr.context = textContext;
          dr.initialSelected = {pos: oriPos, meaning: oriMeaning} as SelectedItem;
          dr.meaningItemCallback = meaningItemCallback;
          this.dictRequest.emit(dr);
        });
    }
  }

  /*addANote(side: Side, triggerMethod = null) {
    let ann = AnnotationSet.addNoteAnnotation;
    let ar: AnnotateResult = this.getAnnotator(side, ann).annotate();
    if (!ar || !ar.wordEl) {
      return;
    }
    let dataName = DataAttrNames.note;
    let element: any = ar.wordEl;
    let oriNote = element.dataset[dataName];

    let editNoteCallback = (note: string) => {
      let changed = false;
      if (note === null || note === oriNote) {
        // cancel
        AnnotatorHelper.removeDropTagIfDummy(element);
      } else {
        if (note === '') {
          // element.removeAttribute('data-note');
          delete element.dataset[dataName];
          let {removed} = AnnotatorHelper.removeDropTagIfDummy(element);
          if (removed) {
            this.destroyAnnotatedWordsPopup(element);
          }
        } else {
          element.dataset[dataName] = note;
          changed = true;
        }
      }
      if (changed) {
        this.notifyChange(side);
        if (this.wordsHoverSetup) {
          let textEl = this.getTextEl(side);
          this.setupPopup(element, textEl);
        }
      }
    };

    let nr = new NoteRequest();
    nr.wordElement = element;
    nr.note = oriNote || '';
    nr.editNoteCallback = editNoteCallback;
    this.noteRequest.emit(nr);
  }*/

  private doAnnotate(side: Side, triggerMethod = null) {
    if (this.annotation.nameEn === SpecialAnnotations.SelectMeaning.nameEn) {
      this.selectWordMeaning(side, triggerMethod);
      return;
    }
    /*if (this.annotation.nameEn === SpecialAnnotations.AddANote.nameEn) {
      this.addANote(side, triggerMethod);
      return;
    }*/
    let ar: AnnotateResult = this.getAnnotator(side).annotate();
    if (!ar) {
      return;
    }
    if (ar.wordEl) {
      if (ar.elCreated) {
        let textEl = this.getTextEl(side);
        if (ar.wordEl.matches(HighlightGroups.HighlightSelectors)) {
          this.highlightAssociatedWords(ar.wordEl, textEl, this.getTheOtherSideText(textEl));
        }
        if (this.wordsHoverSetup) {
          this.setupPopup(ar.wordEl, textEl);
        }
      }
      if (ar.operation === 'remove') {
        let {changed, removed} = AnnotatorHelper.removeDropTagIfDummy(ar.wordEl);
        if (removed) {
          this.destroyAnnotatedWordsPopup(ar.wordEl);
        }
      }
      this.notifyChange(side);
    }
  }

  onMouseup($event, side: Side) {
    $event.stopPropagation();
    $event.preventDefault();
    // console.log($event);
    if ($event.which === 3) {
      return;
    }
    let triggerMethod = 'Click';
    /*if ($event.altKey) {
      triggerMethod = 'Alt_' + triggerMethod;
      this.addANote(side, triggerMethod);
      return;
    }*/

    let ctrl = $event.ctrlKey || $event.metaKey;
    if (ctrl) {
      triggerMethod = 'Ctrl_' + triggerMethod;
    }
    if (this.lookupDict) {
      this.selectWordMeaning(side, triggerMethod);
      return;
    }
    if ($event.ctrlKey || $event.metaKey) {
      this.selectWordMeaning(side, triggerMethod);
      return;
    }
    if (!this.gotFocus) {
      return;
    }
    if (!this.annotation) {
      return;
    }
    this.doAnnotate(side, triggerMethod);
  }

  onContextmenu($event, side: Side) {
    this.selectWordMeaning(side, 'RightClick');
    $event.stopPropagation();
    $event.preventDefault();
  }

  private notifyChange(side: Side) {
  }

  private clearSentenceHighlights() {
    let hls = this.highlightedSentences;
    if (!hls) {
      return;
    }
    while (hls.length > 0) {
      let hl = hls.pop();
      hl.classList.remove(UIConstants.highlightClass);
    }
    this.highlightedSentences = null;
  }

  private clearWordHighlights() {
    let hls = this.highlightedWords;
    if (!hls) {
      return;
    }
    while (hls.length > 0) {
      let hl = hls.pop();
      hl.classList.remove(UIConstants.highlightClass);
    }
    this.highlightedWords = null;
  }

  private setupSentenceIdMap() {
    if (this.contentSentenceMap != null) {
      return;
    }
    this.contentSentenceMap = new Map<string, Element>();
    this.transSentenceMap = new Map<string, Element>();
    let contentEl = this.contentText.element.nativeElement;
    let transEl = this.transText.element.nativeElement;
    for (let [textEl, selMap] of [[contentEl, this.contentSentenceMap], [transEl, this.transSentenceMap]]) {
      let sentenceEls = textEl.querySelectorAll(UIConstants.sentenceTagName);
      for (let stEl of sentenceEls) {
        if (!stEl.dataset) {
          continue;
        }
        let sid = stEl.dataset[UIConstants.sentenceIdAttrName];
        if (sid) {
          selMap.set(sid, stEl);
        }
      }
    }
  }

  private setupSentenceHover() {

    if (this.sentenceHoverSetup || !this.highlightSentence) {
      return;
    }

    this.setupSentenceIdMap();

    let component = this;

    let sentenceMouseover = function (event) {
      if (!component.highlightSentence) {
        return;
      }
      let el = this;
      if (!el.dataset) {
        return;
      }
      let sid = el.dataset[UIConstants.sentenceIdAttrName];
      if (!sid) {
        return;
      }

      component.clearSentenceHighlights();
      for (let selMap of [component.contentSentenceMap, component.transSentenceMap]) {
        let tsEl = selMap.get(sid);
        if (tsEl) {
          tsEl.classList.add(UIConstants.highlightClass);
          if (!component.highlightedSentences) {
            component.highlightedSentences = [];
          }
          component.highlightedSentences.push(tsEl);
        }
      }
    };

    let contentEl = this.contentText.element.nativeElement;
    let transEl = this.transText.element.nativeElement;
    for (let textEl of [contentEl, transEl]) {
      let sentenceEls = textEl.querySelectorAll(UIConstants.sentenceTagName);
      for (let sentenceEl of sentenceEls) {
        sentenceEl.addEventListener('mouseover', sentenceMouseover);
      }
    }

    this.sentenceHoverSetup = true;
  }

  private highlightAssociatedWords(wordEl, textEl, theOtherTextEl) {

    let theOtherSentenceMap = (textEl === this.contentText.element.nativeElement) ?
      this.transSentenceMap : this.contentSentenceMap;

    let component = this;

    let wordsMouseleave = function (event) {
      component.clearWordHighlights();
    };

    let wordsMouseover = function (event) {
      component.clearWordHighlights();

      let el = this;
      let stEl = AnnotatorHelper.findSentence(el, textEl);
      let stEl2;
      if (stEl) {
        if (stEl.dataset) {
          let sid = stEl.dataset[UIConstants.sentenceIdAttrName];
          stEl2 = theOtherSentenceMap.get(sid);
        }
      } else {
        stEl = textEl;
        stEl2 = theOtherTextEl;
      }

      let groupSelector = HighlightGroups.matchGroup(el);
      if (!groupSelector) {
        return;
      }
      if (!component.highlightedWords) {
        component.highlightedWords = [];
      }

      let annEls = stEl.querySelectorAll(groupSelector);
      for (let annEl of annEls) {
        annEl.classList.add(UIConstants.highlightClass);
        component.highlightedWords.push(annEl);
      }
      if (stEl2) {
        let annEls2 = stEl2.querySelectorAll(groupSelector);
        for (let annEl of annEls2) {
          annEl.classList.add(UIConstants.highlightClass);
          component.highlightedWords.push(annEl);
        }
      }
    };

    wordEl.addEventListener('mouseover', wordsMouseover);
    wordEl.addEventListener('mouseleave', wordsMouseleave);
  }

  private setupAssociationHover() {

    if (this.associationsHoverSetup || !this.active) {
      return;
    }

    this.setupSentenceIdMap();

    let contentEl = this.contentText.element.nativeElement;
    let transEl = this.transText.element.nativeElement;

    let selector = HighlightGroups.HighlightSelectors;

    let annEls = contentEl.querySelectorAll(selector);
    for (let annEl of annEls) {
      this.highlightAssociatedWords(annEl, contentEl, transEl);
    }

    let tAnnEls = transEl.querySelectorAll(selector);
    for (let annEl of tAnnEls) {
      this.highlightAssociatedWords(annEl, transEl, contentEl);
    }

    this.associationsHoverSetup = true;
  }


  private setupPopup(wordEl, textEl) {
    if (this.wordsPopupMap.has(wordEl)) {
      return;
    }

    if (this.annotationSet) {
      let anyAnno = AnnotatorHelper.anyAnno(wordEl, this.annotationSet);
      if (!anyAnno) {
        return;
      }
    }

    if (!this.wordAnnosComponentRef) {
      let factory: ComponentFactory<WordAnnosComponent> = this.resolver.resolveComponentFactory(WordAnnosComponent);
      this.wordAnnos.clear();
      this.wordAnnosComponentRef = this.wordAnnos.createComponent(factory);
    }
    let wacr = this.wordAnnosComponentRef;

    let component = this;

    let content = function () {
      wacr.instance.paraTextEl = textEl;
      wacr.instance.annotationSet = component.annotationSet;
      wacr.instance.enabled = component.wordsHover;
      wacr.instance.wordEl = wordEl;
      return wacr.location.nativeElement;
    };
    let drop = new Drop({
      target: wordEl,
      content: content,
      classes: `${UIConstants.dropClassPrefix}anno`,
      // position: 'bottom center',
      constrainToScrollParent: false,
      remove: true,
      hoverOpenDelay: 100,
      openOn: 'hover',//click,hover,always
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

    this.wordsPopupMap.set(wordEl, drop);
  }


  private setupAnnotationsPopup() {

    if (this.wordsHoverSetup || !this.wordsHover || !this.active) {
      return;
    }

    this.wordsPopupMap.clear();

    let contentEl = this.contentText.element.nativeElement;
    let annEls = contentEl.querySelectorAll(UIConstants.annotationTagName);
    for (let annEl of annEls) {
      this.setupPopup(annEl, contentEl);
    }

    let transEl = this.transText.element.nativeElement;
    let tAnnEls = transEl.querySelectorAll(UIConstants.annotationTagName);
    for (let annEl of tAnnEls) {
      this.setupPopup(annEl, transEl);
    }

    this.wordsHoverSetup = true;
  }

  private markUserWords(side: Side) {

    if (this.userWordsMarked || !this.markNewWords || !this.combinedWordsMap || !this.active) {
      return;
    }

    let contentHolder = this.contentText.element.nativeElement;

    let nodeIterator = document.createNodeIterator(
      contentHolder,
      NodeFilter.SHOW_TEXT
    );

    let textNodes = [];

    let tn;
    while (tn = nodeIterator.nextNode()) {
      textNodes.push(tn);
    }

    let wordsMap = this.combinedWordsMap;

    let wordPattern = /\b[\w­]{3,}\b/;

    for (let textNode of textNodes) {
      let text = textNode.nodeValue;
      let element = textNode.parentNode;
      let parentWholeText = element.textContent;
      if (text.trim().length < 3) {
        continue;
      }

      let baseOffset = 0;

      let matcher;
      while (matcher = text.match(wordPattern)) {
        let word = matcher[0];
        let offset = matcher.index;

        let tWord = AnnotatorHelper.stripEnWord(word);
        let codeOrUW = wordsMap.get(tWord);

        if (!codeOrUW) {
          if (/[A-Z]/.test(word)
            || text.charAt(offset + word.length) === '’'
            || (offset > 0 && text.charAt(offset - 1) === '-')) {
            codeOrUW = 'ignore';
          }
        }

        let uwfValue: string = null;
        if (!codeOrUW) {
          uwfValue = DataAttrValues.uwfBeyond;
        } else if (typeof codeOrUW === 'string') {
          // base vocabulary / ignore
        } else {
          let uw = codeOrUW as UserWord;
          if (uw.familiarity === UserWord.FamiliarityHighest) {
            // grasped
          } else {
            uwfValue = '' + uw.familiarity;
          }
        }

        if (!uwfValue) {
          if (word.length + 3 >= text.length) {
            break;
          }
          let from = offset + word.length;
          text = text.substr(from);
          baseOffset += from;
          continue;
        }

        if (word === parentWholeText) {
          element.dataset[DataAttrNames.wordFamiliarity] = uwfValue;
          break;
        }

        let totalOffset = baseOffset + offset;
        if (totalOffset > 0) {
          textNode = textNode.splitText(totalOffset);
        }
        let wordNode = textNode;
        if (offset + word.length < text.length) {
          textNode = wordNode.splitText(word.length);
        }

        let wrapping = document.createElement(UIConstants.userWordTagName);
        wrapping.dataset[DataAttrNames.wordFamiliarity] = uwfValue;
        element.replaceChild(wrapping, wordNode);
        wrapping.appendChild(wordNode);

        if (offset + word.length + 3 >= text.length) {
          break;
        }
        text = textNode.nodeValue;
        baseOffset = 0;
      }
    }

    this.userWordsMarked = true;
  }

  refreshContent() {
    if (!this.para) {
      return;
    }
    let html = this.para.content || ' ';
    this.contentText.element.nativeElement.innerHTML = html;
  }

  refreshTrans() {
    if (!this.para) {
      return;
    }
    let html = this.para.trans || ' ';
    this.transText.element.nativeElement.innerHTML = html;
    this.transRendered = true;
  }

  private clearHovers() {
    this.contentSentenceMap = null;
    this.sentenceHoverSetup = false;
    this.associationsHoverSetup = false;
    this.wordsHoverSetup = false;
  }

  private setupHovers() {
    this.setupSentenceHover();
    this.setupAssociationHover();
    this.setupAnnotationsPopup();
  }

  private annotateCurrentCursor(side: Side) {
    let annotator = this.getAnnotator(side);
    let wacins = annotator.wordAtCursorIfNoSelection;
    annotator.wordAtCursorIfNoSelection = false;
    this.doAnnotate(side, 'Selection');
    annotator.wordAtCursorIfNoSelection = wacins;
  }

  ngOnChanges(changes: SimpleChanges) {
    let textChanged = false;
    if (changes.para) {
      this.refreshContent();
      textChanged = true;
    }
    if (this.showTrans && !this.transRendered) {
      this.refreshTrans();
      textChanged = true;
    }
    if (!textChanged && changes.annotation) {
      if (this.gotFocus && this.annotation) {
        let contentEl = this.contentText.element.nativeElement;
        let transEl = this.transText.element.nativeElement;
        let selection = window.getSelection();
        let selected = AnnotatorHelper.checkSelectionContainer(selection, contentEl, transEl);
        if (selected) {
          if (selected === contentEl) {
            this.annotateCurrentCursor(SideContent);
          } else {
            this.annotateCurrentCursor(SideTrans);
          }
        }
      }
    }

    if (this.highlightedSentences && (!this.gotFocus || !this.sentenceHoverSetup || !this.highlightSentence)) {
      this.clearSentenceHighlights();
    }
    if (this.highlightedWords && (!this.gotFocus || changes.content || changes.trans)) {
      this.clearWordHighlights();
    }

    if (textChanged) {
      this.clearHovers();
      this.setupHovers();
    }
  }
}
