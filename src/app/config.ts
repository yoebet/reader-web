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
  annoDisabledBodyClass: 'anno-disabled',
  userwordDisabledBodyClass: 'uwf-disabled',
  userWordTagName: 'w-d'
};


const DataAttrNames = {
  // mid: 'mid',
  pos: 'pos',
  word: 'word',
  mean: 'mean',
  note: 'note',
  assoc: 'assoc',//关联组
  wordFamiliarity: 'uwf'
};

const ValuePhras = ['phra1', 'phra2', 'phra3'];

const DataAttrValues = {
  phraPattern: /^phra\d$/,
  groupPattern: /^group\d$/,
  assocPhra1: ValuePhras[0],
  assocGroups: ValuePhras.concat(['trunk', 'antec', 'group1', 'group2', 'group3']),
  uwfBeyond: '0'
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
const UserAvatarsBase = `${staticBase}/avatars`;
const AppPackagesBase = `${staticBase}/packages`;
const ChapPacksBase = `${staticBase}/book-chaps`;


const StaticResource = {
  BookImagesBase,
  BookImageNotSet,
  UserAvatarsBase,
  AppPackagesBase,
  ChapPacksBase
};

const HeaderPrefix = 'X-';

const HeaderNames = {
  UserToken: HeaderPrefix + 'UT',
  UserName: HeaderPrefix + 'UN',
  Client: HeaderPrefix + 'CL'
};

const HeaderValues = {
  Client: 'R'/*,
  Client_Agent: 'M'*/
};

const DefaultHttpHeaders = environment.httpHeaders || {};

export {
  UIConstants,
  DataAttrNames,
  DataAttrValues,
  SpecialAnnotations,
  StaticResource,
  HeaderNames,
  HeaderValues,
  DefaultHttpHeaders
};
