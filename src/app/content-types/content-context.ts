import {AnnotationSet} from '../anno/annotation-set';
import {ZhPhrases} from '../anno/zh-phrases';

export class ContentContext {
  contentLang: string;
  transLang: string;
  annotationSet: AnnotationSet;
  zhPhrases: ZhPhrases;
}
