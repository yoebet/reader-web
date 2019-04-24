import {Model} from './model';
import {AnnotationGroup} from './annotation-group';

export class Annotation extends Model {

  name: string;
  nameEn: string;
  dataValue: string;

  group: AnnotationGroup;

  get cssClass() {
    // return this.group.cssClass;
    return null;
  }

  get tagName() {
    return this.group.tagName;
  }

  get dataName() {
    return this.group.dataName;
  }
}
