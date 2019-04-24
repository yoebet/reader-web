import {Model} from './model';
import {Annotation} from './annotation';

export class AnnotationGroup extends Model {
  familyId: string;
  name: string;
  nameEn: string;
  dataName: string;
  tagName: string;
  cssClass: string;

  annotations: Annotation[];
}
