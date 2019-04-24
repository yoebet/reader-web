import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';

import {UIConstants} from '../config';
import {DictEntry} from '../models/dict-entry';
import {Para} from '../models/para';
import {ParaService} from '../services/para.service';
import {SafeHtml} from "@angular/platform-browser/src/security/dom_sanitization_service";

@Component({
  selector: 'word-text',
  templateUrl: './word-text.component.html',
  styleUrls: ['./word-text.component.css']
})
export class WordTextComponent implements OnChanges {

  @Input() entry: DictEntry;
  @Input() para: Para;
  @Input() textTrans: boolean;
  @Input() showTitle: boolean;

  sanitizedContent: SafeHtml;
  sanitizedTrans: SafeHtml;

  constructor(private paraService: ParaService,
              private sanitizer: DomSanitizer) {
  }


  ngOnChanges(changes: SimpleChanges) {
    if (changes.entry || changes.para) {
      this.trySetup();
    }
  }

  trySetup() {
    if (!this.para || !this.entry) {
      return;
    }
    let {content, trans} = this.highlightTheWord(this.para);
    this.sanitizedContent = this.sanitizer.bypassSecurityTrustHtml(content);
    this.sanitizedTrans = this.sanitizer.bypassSecurityTrustHtml(trans);
  }


  private commonPrefix(strings: string[]): string {
    let first = strings[0];
    let commonLength = first.length;
    for (let i = 1; i < strings.length; ++i) {
      let si = strings[i];
      if(commonLength > si.length){
        commonLength = si.length;
      }
      for (let j = 0; j < commonLength; ++j) {
        if (si.charAt(j) !== first.charAt(j)) {
          commonLength = j;
          break;
        }
      }
    }
    return first.slice(0, commonLength);
  }

  highlightTheWord(para) {
    let entry = this.entry;
    let words = [entry.word];
    if (entry.baseForm) {
      words.push(entry.baseForm);
    }
    if (entry.forms) {
      words = words.concat(entry.forms);
    }

    let content = para.content;

    let contentHolder = document.createElement('div');
    contentHolder.innerHTML = content;

    let textContent = contentHolder.textContent;
    words = words.filter(word => textContent.indexOf(word) >= 0);
    let patterns = words.map(word => new RegExp(`\\b${word}\\b`));
    let commonPrefixPattern = null;
    if (words.length > 1) {
      let cp = this.commonPrefix(words);
      if (cp.length >= 3) {
        commonPrefixPattern = new RegExp(`\\b${cp}`);
      }
    }

    let nodeIterator = document.createNodeIterator(
      contentHolder,
      NodeFilter.SHOW_TEXT
    );
    let textNode;
    let nodesToTry: any[] = [];

    while (textNode = nodeIterator.nextNode()) {
      let text = textNode.nodeValue;
      let element = textNode.parentNode;
      let parentWholeText = element.textContent;
      if (text.trim().length < 3) {
        continue;
      }
      if (commonPrefixPattern && !commonPrefixPattern.test(text)) {
        continue;
      }
      for (let pattern of patterns) {
        let matcher = text.match(pattern);
        if (!matcher) {
          continue;
        }
        let word = matcher[0];
        if (word === parentWholeText) {
          element.classList.add(UIConstants.highlightWordClass);
          break;
        }
        nodesToTry.push(textNode);
      }
    }

    for (let pattern of patterns) {
      let nodes = nodesToTry;
      nodesToTry = [];
      for (let textNode of nodes) {
        let text = textNode.nodeValue;
        let element = textNode.parentNode;
        let matcher = text.match(pattern);
        if (!matcher) {
          nodesToTry.push(textNode);
          continue;
        }
        while (matcher) {
          let word = matcher[0];
          let offset = matcher.index;
          let wordNode = textNode;
          if (offset > 0) {
            if (offset > 3) {
              nodesToTry.push(wordNode);
            }
            wordNode = wordNode.splitText(offset);
          }
          if (offset + word.length < text.length) {
            textNode = wordNode.splitText(word.length);
          }

          let wrapping = document.createElement('span');
          wrapping.classList.add(UIConstants.highlightWordClass);
          element.replaceChild(wrapping, wordNode);
          wrapping.appendChild(wordNode);

          if (offset + word.length >= text.length) {
            break;
          }
          text = textNode.nodeValue;
          if (text.length < 3) {
            break;
          }
          matcher = text.match(pattern);
          if (!matcher) {
            nodesToTry.push(textNode);
          }
        }
      }
    }

    let findSentence = (el): any => {
      do {
        if (el === contentHolder) {
          return null;
        }
        if (el.matches(UIConstants.sentenceTagName)) {
          return el;
        }
        el = el.parentNode;
      } while (el);
      return null;
    };

    let sids = [];

    let wordEls = Array.from(contentHolder.querySelectorAll('.' + UIConstants.highlightWordClass));
    for (let wordEl of wordEls) {
      let sentenceEl = findSentence(wordEl);
      if (sentenceEl) {
        let sid = sentenceEl.dataset.sid;
        if (sids.indexOf(sid) >= 0) {
          continue;
        }
        sentenceEl.classList.add(UIConstants.highlightClass);
        sids.push(sid);
      }
    }

    content = contentHolder.innerHTML;

    let trans = para.trans || '';
    if (sids.length > 0) {
      contentHolder.innerHTML = trans;
      let transEls = contentHolder.querySelectorAll(UIConstants.sentenceTagName);
      let tes = Array.from(transEls);
      for (let transEl of tes) {
        let te = transEl as any;
        let sid = te.dataset.sid;
        if (sids.indexOf(sid) >= 0) {
          te.classList.add(UIConstants.highlightClass);
        }
      }
      trans = contentHolder.innerHTML;
    }

    return {content, trans};
  }

}
