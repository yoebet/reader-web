import {Observable} from 'rxjs';

import {AnnotationSet} from '../anno/annotation-set';
import {ZhPhrases} from '../anno/zh-phrases';
import {CombinedWordsMap} from '../en/combined-words-map';

export class ContentContext {
  contentLang: string;
  transLang: string;
  annotationSet: AnnotationSet;
  zhPhrases: ZhPhrases;
  combinedWordsMapObs: Observable<CombinedWordsMap>;
}
