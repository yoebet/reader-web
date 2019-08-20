import {AnnotationGroup} from '../models/annotation-group';
import {Annotation} from '../models/annotation';
import {DataAttrNames, DataAttrValues, SpecialAnnotations} from '../config';


export class AnnotationSet {

  static selectMeaningAnnotation: Annotation;

  static emptySet = () => new AnnotationSet([]);

  readonly groups: AnnotationGroup[];

  readonly annotationsMap: Map<string, Annotation> = new Map();

  readonly specialAnnotations: Annotation[];

  static buildStaticAnnotations() {

    let groupSwm = new AnnotationGroup();
    groupSwm.dataName = DataAttrNames.mean;
    let swm = new Annotation();
    let annSMConfig = SpecialAnnotations.SelectMeaning;
    swm.name = annSMConfig.name;
    swm.nameEn = annSMConfig.nameEn;
    swm.group = groupSwm;
    AnnotationSet.selectMeaningAnnotation = swm;

  }

  constructor(groups: AnnotationGroup[]) {
    this.groups = groups.map(og => {
      let ag = new AnnotationGroup();
      Object.assign(ag, og);
      return ag;
    });


    this.specialAnnotations = [
      AnnotationSet.selectMeaningAnnotation];

    for (let group of this.groups) {
      group.annotations = group.annotations.map(oa => {
        let ann = new Annotation();
        Object.assign(ann, oa);
        ann.group = group;
        if (ann.dataName && ann.dataValue) {
          let annKey = `${ann.dataName}.${ann.dataValue}`;
          this.annotationsMap.set(annKey, ann);
        }
        return ann;
      });

    }

  }


  annotationOutput(dataName: string, dataValue: string) {
    if (dataName === DataAttrNames.assoc) {
      if (DataAttrValues.phraPattern.test(dataValue)) {
        // return '词组';
        return null;
      }
      if (DataAttrValues.groupPattern.test(dataValue)) {
        // return '关联';
        return null;
      }
    }
    let annKey = `${dataName}.${dataValue}`;
    let ann = this.annotationsMap.get(annKey);
    if (!ann) {
      return null;
    }
    return ann.name;
  }

}

AnnotationSet.buildStaticAnnotations();


export class HighlightGroups {

  /*private static group(attr, values) {
    return values.map(v => `[data-${attr}=${v}]`).join(', ');
  }*/

  private static groupSelectors: string[] = DataAttrValues.assocGroups
    .map(group => `[data-${DataAttrNames.assoc}=${group}]`);

  // static HighlightSelectors = HighlightGroups.groupSelectors.join(', ');

  static HighlightSelectors = `[data-${DataAttrNames.assoc}]`;

  static matchGroup(element): string {
    for (let selector of HighlightGroups.groupSelectors) {
      if (element.matches(selector)) {
        return selector;
      }
    }
    return null;
  }

}
