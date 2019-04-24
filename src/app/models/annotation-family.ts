import {Model} from './model';
import {AnnotationGroup} from './annotation-group';

export class AnnotationFamily extends Model {
  name: string;
  description: string;
  status: string;

  groups: AnnotationGroup[];
}
