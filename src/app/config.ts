import {environment} from '../environments/environment';

const UIConstants = {
  annotationTagName: 'y-o',
  sentenceTagName: 's-st',
  sentenceIdAttrName: 'sid',
  dropClassPrefix: 'drop-',
  tetherClassPrefix: 'dp-',
  tetherClassPrefixNoHyphen: 'dp',
  highlightClass: 'highlight',
  highlightWordClass: 'highlight-word',
  newwordDisabledBodyClass: 'newword-disabled',
  annoDisabledBodyClass: 'anno-disabled',
  userWordTagName: 'w-d',
  userWordCommonClass: 'word',
  userWordBeyondClass: 'beyond',
  userWordFamiliarityClassPrefix: 'wf'
};


const DataAttrNames = {
  // mid: 'mid',
  pos: 'pos',
  word: 'word',
  mean: 'mean',
  note: 'note',
  assoc: 'assoc'//关联组
};

const ValuePhras = ['phra1', 'phra2', 'phra3'];
const ValueGroups = ['group1', 'group2', 'group3'];

const DataAttrValues = {
  phraPattern: /^phra\d$/,
  assocPhra1: ValuePhras[0],
  assocGroups: ValuePhras.concat(['trunk', 'antec']).concat(ValueGroups)
};


const SpecialAnnotations = {
  SelectMeaning: {
    name: '选词义',
    nameEn: 'SelectMeaning'
  },
  AddANote: {
    name: '加注解',
    nameEn: 'AddANote'
  }
};

const staticBase = environment.staticBase;
const ImagesBase = `${staticBase}/images`;
const BookImagesBase = `${ImagesBase}/book`;
const BookImageNotSet = `${BookImagesBase}/missing.png`;


const DefaultHttpHeaders = environment.httpHeaders || {};

export {
  UIConstants,
  DataAttrNames,
  DataAttrValues,
  SpecialAnnotations,
  BookImagesBase,
  BookImageNotSet,
  DefaultHttpHeaders
};
