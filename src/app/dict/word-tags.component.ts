import {Component, Input, OnInit} from '@angular/core';

import {isEqual} from 'lodash';

import {WordCategoryService} from '../services/word-category.service';
import {UserPreferenceService} from '../services/user-preference.service';
import {WordCategory} from '../models/word-category';

@Component({
  selector: 'word-tags',
  templateUrl: './word-tags.component.html',
  styleUrls: ['./word-tags.component.css']
})
export class WordTagsComponent implements OnInit {
  private _categories: any;
  @Input() set categories(categories: any) {
    if (isEqual(this._categories, categories)) {
      return;
    }
    this._categories = categories;
    this.tryEvaluateTags(1);
  }

  private _userWordTags: string[];
  @Input() set userWordTags(codes: string[]) {
    if (isEqual(this._userWordTags, codes)) {
      return;
    }
    this._userWordTags = codes;
    this.tryEvaluateTags(2);
  }


  wordCategoriesMap: Map<string, WordCategory>;

  categoryTags: string[];


  constructor(private wordCategoryService: WordCategoryService,
              private userPreferenceService: UserPreferenceService) {
  }

  ngOnInit() {
    this.wordCategoryService.list()
      .subscribe((cats: WordCategory[]) => {
        this.wordCategoriesMap = this.wordCategoryService.wordCategoriesMap;
        this.tryEvaluateTags(3);
      });
    this.userPreferenceService.getWordTags()
      .subscribe((codes: string[]) => {
        if (isEqual(this._userWordTags, codes)) {
          return;
        }
        this._userWordTags = codes;
        this.tryEvaluateTags(4);
      });

  }

  tryEvaluateTags(from) {
    // console.log('tryEvaluateTags, ' + from);
    if (this._categories && this._userWordTags && this.wordCategoriesMap) {
      // console.log('evaluateTags, ' + from);
      this.evaluateTags();
    }

  }

  evaluateTags() {
    let categories = this._categories;
    let userWordTags = this._userWordTags;
    let categoriesMap = this.wordCategoriesMap;

    let tags = [];

    for (let code of userWordTags) {

      let wordCategory = categoriesMap.get(code);
      if (!wordCategory) {
        console.log('Not Found: ' + code);
        continue;
      }
      let key = wordCategory.dictKey;
      let rank = categories[key];
      if (!rank) {
        continue;
      }

      let op = wordCategory.dictOperator;
      let val = wordCategory.dictValue;
      if (!op) {
        if (rank !== val) {
          continue;
        }
      } else if (op === 'lt') {
        if (rank >= val) {
          continue;
        }
      } else if (op === 'gt') {
        if (rank <= val) {
          continue;
        }
      } else if (op === 'ne') {
        if (rank === val) {
          continue;
        }
      } else {
        continue;
      }

      let tag = wordCategory.name;
      if (code === 'haici') {
        tag = `海词 ${rank}星`;
      } else if (['coca', 'bnc', 'anc'].indexOf(code) >= 0) {
        let align3 = rank + (3 - rank % 3);
        tag = `${code.toUpperCase()} ${align3}000`;
      }
      tags.push(tag);
    }

    this.categoryTags = tags;
  }

}
